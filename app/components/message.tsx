'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { AgentApiState, AgentMessage, AgentMessageRole, AgentMessageChartContent, AgentMessageFetchedTableContent, AgentMessageTextContent, AgentMessageToolResultsContent, AgentMessageToolUseContent, Citation, CortexSearchCitationSource, RELATED_QUERIES_REGEX, RelatedQuery } from '@/lib/agent-api';
import equal from 'fast-deep-equal';
import { cn } from '@/lib/utils';
import { ChatTextComponent } from './chat-text-component';
import { ChatChartComponent } from './chat-chart-component';
import { ChatSQLComponent } from './chat-sql-component';
import { ChatTableComponent } from './chat-table-component';
import { ChatRelatedQueriesComponent } from './chat-related-queries-component';
import { ChatCitationsComponent } from './chat-citations-component';
import { convertVegaLiteToChartJS } from './chart-converter';
import { Data2AnalyticsMessage } from './chat-data2-message';
import { postProcessAgentText } from '../functions/postProcessAgentText';

const PurePreviewMessage = ({
    message,
    agentState,
    isLatestAssistantMessage,
}: {
    message: AgentMessage;
    agentState: AgentApiState,
    isLatestAssistantMessage: boolean,
}) => {
    // if only the search citations are available without text
    if (
        message.content.length === 2 &&
        message.content[0]?.type === "tool_use" &&
        (message?.content[0] as AgentMessageToolUseContent)?.tool_use?.name === "search1"
    ) {
        return null;
    }

    let agentApiText = "";
    const role = message.role;
    const citations: Citation[] = [];
    const relatedQueries: RelatedQuery[] = [];
    const agentResponses: React.ReactElement[] = [];

    // Log message data for debugging
    console.log('=== MESSAGE PROCESSING ===');
    console.log('Message Role:', message.role);
    console.log('Message Content:', message.content);
    console.log('Content Length:', message.content.length);
    console.log('========================');

    // iterate over the message content and populate the agentResponses array
    // this logic is useful until we get names / keys associated with each text / tool_results responses to differentiate
    message.content.forEach((content, contentIndex) => {
        console.log(`=== CONTENT ${contentIndex} ===`);
        console.log('Content Type:', content.type);
        console.log('Content Data:', content);
        console.log('=======================');
        
        // if plain text
        if (content.type === "text") {
            const { text } = (content as AgentMessageTextContent);
            agentApiText = text;

            if (citations.length > 0) {
                relatedQueries.push(...text.matchAll(RELATED_QUERIES_REGEX).map(match => ({
                    relatedQuery: match[1].trim(),
                    answer: match[2].trim()
                })));
            }

            const postProcessedText = postProcessAgentText(text, relatedQueries, citations);

            agentResponses.push(<ChatTextComponent key={`text-${contentIndex}-${text.slice(0, 20)}`} text={postProcessedText} role={role} />);
            // if analyst / search / data2analytics response
        } else if (content.type === "tool_results") {
            const toolResults = (content as AgentMessageToolResultsContent).tool_results;
            const firstContent = toolResults.content?.[0];
            
            if (firstContent?.json) {
                const toolResultsContent = firstContent.json;

                // if search response
                if ("searchResults" in toolResultsContent) {
                    citations.push(...toolResultsContent.searchResults.map((result: CortexSearchCitationSource) => ({
                        text: result.text,
                        number: parseInt(String(result.source_id), 10),
                    })))
                }

                // if analyst text response
                if ("text" in toolResultsContent) {
                    const { text } = toolResultsContent;
                    agentResponses.push(<ChatTextComponent key={`tool-text-${contentIndex}-${text.slice(0, 20)}`} role={role} text={text} />);
                }

                // if analyst sql response
                if ("sql" in toolResultsContent) {
                    const { sql } = toolResultsContent;
                    agentResponses.push(<ChatSQLComponent key={`tool-sql-${contentIndex}-${sql.slice(0, 20)}`} />);
                }
            }

            // if execute sql response
        } else if (content.type === "fetched_table") {
            const tableContent = (content as AgentMessageFetchedTableContent);
            agentResponses.push(<ChatTableComponent key={`table-${contentIndex}-${tableContent.tableMarkdown.slice(0, 20)}`} />);
        } else if (content.type === "chart") {
            const chart_content = (content as AgentMessageChartContent);
            try {
                const chartSpec = JSON.parse(chart_content.chart.chart_spec);
                const chartData = convertVegaLiteToChartJS(chartSpec);
                agentResponses.push(<ChatChartComponent key={`chart-${contentIndex}-${Math.random().toString(36).substring(2, 11)}`} {...chartData} />);
            } catch (error) {
                console.error('Error parsing chart spec:', error);
                agentResponses.push(
                    <div key={`chart-error-${contentIndex}-${Math.random().toString(36).substring(2, 11)}`} className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
                        خطأ في تحليل مواصفات الرسم البياني
                    </div>
                );
            }
            
        }
    })

    if (agentResponses.length === 0) {
        return null;
    }
    return (
        <AnimatePresence>
            <motion.div
                className="w-full mx-auto max-w-4xl px-4 group/message"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                data-role={message.role}
            >
                <div
                    className={cn('w-full', {
                        'ml-auto max-w-lg w-fit': message.role === AgentMessageRole.USER,
                        'w-full': message.role === AgentMessageRole.ASSISTANT,
                    })}
                >
                    {message.role === AgentMessageRole.ASSISTANT ? (
                        <div className="bg-gradient-to-br from-white to-[#25935f]/5 rounded-3xl border border-[#25935f]/20 shadow-lg backdrop-blur-sm p-8">
                            <div className="flex flex-col gap-6">
                                {agentResponses}
                                {role === AgentMessageRole.ASSISTANT && agentState === AgentApiState.RUNNING_ANALYTICS && isLatestAssistantMessage && (
                                    <Data2AnalyticsMessage message="Analyzing data..." />
                                )}

                                {role === AgentMessageRole.ASSISTANT && relatedQueries.length > 0 && (
                                    <ChatRelatedQueriesComponent relatedQueries={relatedQueries} />
                                )}

                                {role === AgentMessageRole.ASSISTANT && citations.length > 0 && agentState === AgentApiState.IDLE && agentApiText && (
                                    <ChatCitationsComponent agentApiText={agentApiText} citations={citations} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {agentResponses}
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export const PreviewMessage = memo(
    PurePreviewMessage,
    (prevProps, nextProps) => {
        if (!equal(prevProps.agentState, nextProps.agentState)) return false;
        if (!equal(prevProps.message.content, nextProps.message.content)) return false;
        return true;
    },
);