"use client"

import React from "react";
import { events } from 'fetch-event-stream';
import { AgentMessage, AgentMessageRole, AgentMessageToolResultsContent, AgentMessageToolUseContent } from "./types";
import { AgentRequestBuildParams, buildStandardRequestParams } from "./functions/buildStandardRequestParams";
import { appendTextToAssistantMessage } from "./functions/assistant/appendTextToAssistantMessage";
import { getEmptyAssistantMessage } from "./functions/assistant/getEmptyAssistantMessage";
import { getSQLExecUserMessage } from "./functions/assistant/getSQLExecUserMessage";
import { appendAssistantMessageToMessagesList } from "./functions/assistant/appendAssistantMessageToMessagesList";
import { appendToolResponseToAssistantMessage } from "./functions/assistant/appendToolResponseToAssistantMessage";
import { appendUserMessageToMessagesList } from "./functions/assistant/appendUserMessageToMessagesList";
import { toast } from "sonner";
import { appendFetchedTableToAssistantMessage } from "./functions/assistant/appendFetchedTableToAssistantMessage";
import { appendTableToAssistantMessage } from "./functions/assistant/appendTableToAssistantMessage";
import { appendChartToAssistantMessage } from "./functions/assistant/appendChartToAssistantMessage";
import { removeFetchedTableFromMessages } from "./functions/chat/removeFetchedTableFromMessages";
import shortUUID from "short-uuid";

export interface AgentApiQueryParams extends Omit<AgentRequestBuildParams, "messages" | "input"> {
    snowflakeUrl: string;
}

async function fetchAvailableAgents(authToken: string, snowflakeUrl: string): Promise<any[]> {
    const agentDatabase = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_DATABASE;
    const agentSchema = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_SCHEMA;
    
    if (!agentDatabase || !agentSchema) {
        console.warn("Agent database or schema not configured");
        return [];
    }

    try {
        const response = await fetch(
            `${snowflakeUrl}/api/v2/databases/${agentDatabase}/schemas/${agentSchema}/agents`,
            {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'X-Snowflake-Authorization-Token-Type': 'KEYPAIR_JWT',
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            console.warn(`Failed to fetch agents: ${response.status}`);
            return [];
        }
        
        return await response.json();
    } catch (error) {
        console.warn("Error fetching available agents:", error);
        return [];
    }
}

export enum AgentApiState {
    IDLE = "idle",
    LOADING = "loading",
    STREAMING = "streaming",
    EXECUTING_SQL = "executing_sql",
    RUNNING_ANALYTICS = "running_analytics",
}

export function useAgentAPIQuery(params: AgentApiQueryParams) {
    const {
        authToken,
        snowflakeUrl,
        ...agentRequestParams
    } = params;

    const { toolResources } = agentRequestParams;

    const [agentState, setAgentState] = React.useState<AgentApiState>(AgentApiState.IDLE);
    const [messages, setMessages] = React.useState<AgentMessage[]>([]);
    const [latestAssistantMessageId, setLatestAssistantMessageId] = React.useState<string | null>(null);
    const [availableAgents, setAvailableAgents] = React.useState<any[]>([]);

    // Fetch available agents on mount
    React.useEffect(() => {
        if (authToken) {
            fetchAvailableAgents(authToken, snowflakeUrl).then(setAvailableAgents);
        }
    }, [authToken, snowflakeUrl]);

    const handleNewMessage = React.useCallback(async (input: string) => {
        if (!authToken) {
            toast.error("Authorization failed: Token is not defined");
            return;
        }

        const newMessages = structuredClone(messages);

        const latestUserMessageId = shortUUID.generate();

        newMessages.push({
            id: latestUserMessageId,
            role: AgentMessageRole.USER,
            content: [{ type: "text", text: input }],
        });

        setMessages(newMessages);

        const { headers, body } = buildStandardRequestParams({
            authToken,
            messages: removeFetchedTableFromMessages(newMessages),
            input,
            ...agentRequestParams,
        });

        setAgentState(AgentApiState.LOADING);
        
        try {
            // Use specific agent endpoint if database, schema, and agent name are provided
            const agentDatabase = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_DATABASE;
            const agentSchema = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_SCHEMA;
            const agentName = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT;
            
            const agentEndpoint = agentDatabase && agentSchema && agentName
                ? `${snowflakeUrl}/api/v2/databases/${agentDatabase}/schemas/${agentSchema}/agents/${agentName}:run`
                : `${snowflakeUrl}/api/v2/cortex/agent:run`;

            const response = await fetch(
                agentEndpoint,
                { method: 'POST', headers, body: JSON.stringify(body) }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error - Status: ${response.status}, Endpoint: ${agentEndpoint}, Response: ${errorText}`);
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }

            if (!response.body) {
                throw new Error('Response body is null');
            }

            const latestAssistantMessageId = shortUUID.generate();
            setLatestAssistantMessageId(latestAssistantMessageId);
            const newAssistantMessage = getEmptyAssistantMessage(latestAssistantMessageId);

            const streamEvents = events(response);
        for await (const event of streamEvents) {
            if (event.data === "[DONE]") {
                setAgentState(AgentApiState.IDLE);
                return;
            }

            // Handle error responses
            if (event.data && JSON.parse(event.data).code) {
                toast.error(JSON.parse(event.data).message);
                setAgentState(AgentApiState.IDLE);
                return;
            }

            // Handle different event types from new Snowflake API
            if (event.event === 'response.text.delta') {
                const { text } = JSON.parse(event.data!);
                if (text) {
                    appendTextToAssistantMessage(newAssistantMessage, text);
                    setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                    setAgentState(AgentApiState.STREAMING);
                }
            }
            else if (event.event === 'response.tool_use') {
                const toolUse = JSON.parse(event.data!);
                appendToolResponseToAssistantMessage(newAssistantMessage, { type: "tool_use", tool_use: toolUse });
                setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
            }
            else if (event.event === 'response.tool_result') {
                const toolResult = JSON.parse(event.data!);
                appendToolResponseToAssistantMessage(newAssistantMessage, { type: "tool_results", tool_results: toolResult });
                setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));

                // Handle SQL execution results - the new API executes SQL automatically
                const sqlResult = toolResult.content?.[0]?.json?.result_set;
                if (sqlResult) {
                    setAgentState(AgentApiState.EXECUTING_SQL);
                    appendFetchedTableToAssistantMessage(newAssistantMessage, sqlResult, true);
                    setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                }
            }
            else if (event.event === 'response.status') {
                const statusData = JSON.parse(event.data!);
                // Update agent state based on status
                if (statusData.status === 'executing_tools') {
                    setAgentState(AgentApiState.EXECUTING_SQL);
                } else if (statusData.status === 'streaming_analyst_results') {
                    setAgentState(AgentApiState.RUNNING_ANALYTICS);
                } else if (statusData.status === 'proceeding_to_answer') {
                    setAgentState(AgentApiState.STREAMING);
                }
            }
            // Handle final response format (for compatibility)
            else if (event.event === 'response') {
                const responseData = JSON.parse(event.data!);
                responseData.content?.forEach((content: any) => {
                    if (content.type === 'text') {
                        appendTextToAssistantMessage(newAssistantMessage, content.text);
                        setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                    } else if (content.type === 'tool_use') {
                        appendToolResponseToAssistantMessage(newAssistantMessage, content);
                        setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                    } else if (content.type === 'tool_result') {
                        appendToolResponseToAssistantMessage(newAssistantMessage, { type: "tool_results", tool_results: content.tool_result });
                        setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                        
                        // Handle SQL results
                        const sqlResult = content.tool_result.content?.[0]?.json?.result_set;
                        if (sqlResult) {
                            appendFetchedTableToAssistantMessage(newAssistantMessage, sqlResult, true);
                            setMessages(appendAssistantMessageToMessagesList(newAssistantMessage));
                        }
                    }
                });
            }
            // Ignore thinking events and other unknown events for now
        }
        } catch (error) {
            console.error('Error in agent API query:', error);
            toast.error(`Failed to connect to agent API: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setAgentState(AgentApiState.IDLE);
        }
    }, [agentRequestParams, authToken, messages, snowflakeUrl, toolResources]);

    return {
        agentState,
        messages,
        handleNewMessage,
        latestAssistantMessageId,
        availableAgents
    };
}
