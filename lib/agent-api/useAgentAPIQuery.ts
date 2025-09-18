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
        const response = await fetch(
            `${snowflakeUrl}/api/v2/cortex/agent:run`,
            { method: 'POST', headers, body: JSON.stringify(body) }
        );

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
    }, [agentRequestParams, authToken, messages, snowflakeUrl, toolResources]);

    return {
        agentState,
        messages,
        handleNewMessage,
        latestAssistantMessageId
    };
}
