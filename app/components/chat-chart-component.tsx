import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { TopLevelSpec } from "vega-lite";

const VegaLite = dynamic(() => import("react-vega").then((m) => m.VegaLite), {
    ssr: false,
    loading: () => <div className="p-4 text-center">جاري تحميل الرسم البياني...</div>
});

export interface ChatChartComponentProps {
    chartSpec: TopLevelSpec;
}

export function ChatChartComponent(props: ChatChartComponentProps) {
    const { chartSpec } = props;

    // Add error handling and debugging
    if (!chartSpec) {
        console.error('ChatChartComponent: No chart spec provided');
        return (
            <motion.div
                className="w-full mx-auto max-w-3xl pr-4 pl-0 group/message"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { delay: 0 } }}
            >
                <div className="p-4 border border-red-200 rounded bg-red-50 text-red-700">
                    خطأ: لم يتم توفير مواصفات الرسم البياني
                </div>
            </motion.div>
        );
    }

    console.log('ChatChartComponent: Rendering chart with spec:', chartSpec);

    return (
        <motion.div
            className="w-full mx-auto max-w-3xl pr-4 pl-0 group/message"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 0 } }}
        >
            <style jsx global>{`
                .vega-actions {
                    display: none !important;
                }
                .vega-embed summary {
                    display: none !important;
                }
            `}</style>
            <VegaLite spec={chartSpec} />
        </motion.div>
    )
}