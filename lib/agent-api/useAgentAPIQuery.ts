"use client"

import React from "react";
import { events } from 'fetch-event-stream';
import { AgentMessage, AgentMessageRole } from "./types";
import { AgentRequestBuildParams, buildStandardRequestParams } from "./functions/buildStandardRequestParams";
import { appendTextToAssistantMessage } from "./functions/assistant/appendTextToAssistantMessage";
import { getEmptyAssistantMessage } from "./functions/assistant/getEmptyAssistantMessage";
import { appendAssistantMessageToMessagesList } from "./functions/assistant/appendAssistantMessageToMessagesList";
import { appendToolResponseToAssistantMessage } from "./functions/assistant/appendToolResponseToAssistantMessage";
import { toast } from "sonner";
import { appendFetchedTableToAssistantMessage } from "./functions/assistant/appendFetchedTableToAssistantMessage";
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
    const { authToken, snowflakeUrl, ...agentRequestParams } = params;

    const [agentState, setAgentState] = React.useState<AgentApiState>(AgentApiState.IDLE);
    const [messages, setMessages] = React.useState<AgentMessage[]>([]);
    const [response, setResponse] = React.useState<Record<string, unknown> | null>(null);

    const handleNewMessage = React.useCallback(async (input: string) => {
        if (!authToken) {
            toast.error("Authorization failed: Token is not defined");
            return;
        }

        // Add user message
        const newMessages = [...messages, {
            id: shortUUID.generate(),
            role: AgentMessageRole.USER,
            content: [{ type: "text", text: input }],
        }];

        setMessages(newMessages);
        setAgentState(AgentApiState.LOADING);
        setResponse(null);

        try {
            const { headers, body } = buildStandardRequestParams({
                authToken,
                messages: removeFetchedTableFromMessages(newMessages),
                input,
                ...agentRequestParams,
            });

            // Get agent endpoint
            const agentDatabase = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_DATABASE;
            const agentSchema = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT_SCHEMA;
            const agentName = process.env.NEXT_PUBLIC_SNOWFLAKE_AGENT;
            
            const agentEndpoint = agentDatabase && agentSchema && agentName
                ? `${snowflakeUrl}/api/v2/databases/${agentDatabase}/schemas/${agentSchema}/agents/${agentName}:run`
                : `${snowflakeUrl}/api/v2/cortex/agent:run`;

            const response = await fetch(agentEndpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify(body)
            });
            console.log('response', response);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            if (!response.body) {
                throw new Error('Response body is null');
            }

            // Create assistant message
            const assistantMessageId = shortUUID.generate();
            const assistantMessage = getEmptyAssistantMessage(assistantMessageId);

            // Process stream events
            const streamEvents = events(response);
            for await (const event of streamEvents) {
                if (event.data === "[DONE]") {
                    setAgentState(AgentApiState.IDLE);
                    setResponse({
                        status: 'completed',
                        messages: newMessages,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                if (event.event === 'error' || event.event === 'response.error') {
                    setAgentState(AgentApiState.IDLE);
                    setResponse({
                        status: 'error',
                        error: event.data,
                        timestamp: new Date().toISOString()
                    });
                    return;
                }

                // Handle text streaming
                if (event.event === 'response.text.delta') {
                    try {
                        const { text } = JSON.parse(event.data!);
                        if (text) {
                            appendTextToAssistantMessage(assistantMessage, text);
                            setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                            setAgentState(AgentApiState.STREAMING);
                        }
                    } catch (error) {
                        console.warn('Failed to parse text delta:', error);
                    }
                }

                // Handle tool use
                else if (event.event === 'response.tool_use') {
                    try {
                        const toolUse = JSON.parse(event.data!);
                        appendToolResponseToAssistantMessage(assistantMessage, { 
                            type: "tool_use", 
                            tool_use: toolUse 
                        });
                        setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                    } catch (error) {
                        console.warn('Failed to parse tool use:', error);
                    }
                }

                // Handle tool results
                else if (event.event === 'response.tool_result') {
                    try {
                        const toolResult = JSON.parse(event.data!);
                        
                        appendToolResponseToAssistantMessage(assistantMessage, { 
                            type: "tool_results", 
                            tool_results: {
                                content: Array.isArray(toolResult.content) ? toolResult.content : [toolResult.content],
                                name: toolResult.name
                            }
                        });
                        setMessages(appendAssistantMessageToMessagesList(assistantMessage));

                        // Handle SQL results
                        const sqlResult = toolResult.content?.[0]?.json?.result_set;
                        if (sqlResult) {
                            setAgentState(AgentApiState.EXECUTING_SQL);
                            appendFetchedTableToAssistantMessage(assistantMessage, sqlResult, true);
                            setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                        }
                        
                        // Handle chart results
                        const chartResult = toolResult.content?.[0]?.json?.chart_spec;
                        if (chartResult) {
                            setAgentState(AgentApiState.RUNNING_ANALYTICS);
                            appendChartToAssistantMessage(assistantMessage, { chart_spec: chartResult });
                            setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                        }
                    } catch (error) {
                        console.warn('Failed to parse tool result:', error);
                    }
                }

                // Handle chart events
                else if (event.event === 'response.chart') {
                    try {
                        const chartData = JSON.parse(event.data!);
                        appendChartToAssistantMessage(assistantMessage, chartData);
                        setMessages(appendAssistantMessageToMessagesList(assistantMessage));
                    } catch (error) {
                        console.warn('Failed to parse chart data:', error);
                    }
                }

                // Handle status updates
                else if (event.event === 'response.status') {
                    try {
                        const { status } = JSON.parse(event.data!);
                        if (status === 'executing_tools') {
                            setAgentState(AgentApiState.EXECUTING_SQL);
                        } else if (status === 'streaming_analyst_results') {
                            setAgentState(AgentApiState.RUNNING_ANALYTICS);
                        } else if (status === 'proceeding_to_answer') {
                            setAgentState(AgentApiState.STREAMING);
                        }
                    } catch (error) {
                        console.warn('Failed to parse status:', error);
                    }
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to connect to agent API: ${errorMessage}`);
            setAgentState(AgentApiState.IDLE);
            setResponse({
                status: 'error',
                error: errorMessage,
                timestamp: new Date().toISOString()
            });
        }
    }, [agentRequestParams, authToken, messages, snowflakeUrl]);

    return {
        agentState,
        messages,
        handleNewMessage,
        response
    };
}