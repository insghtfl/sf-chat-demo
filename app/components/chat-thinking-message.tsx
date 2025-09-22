import { motion } from 'framer-motion';
import { SparklesIcon } from './icons';

export const ThinkingMessage = () => {
    return (
        <motion.div
            className="w-full mx-auto max-w-3xl px-4 group/message"
            initial={{ y: 5, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
        >
            <div className="bg-gradient-to-r from-white to-[#25935f]/5 px-8 py-6 rounded-3xl border border-[#25935f]/20 shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <div className="size-10 flex items-center rounded-full justify-center shrink-0 border-none animate-pulse bg-gradient-to-r from-[#25935f]/20 to-[#25935f]/30">
                        <div className="text-[#25935f]">
                            <SparklesIcon size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                        <div className="text-gray-700 text-xl font-semibold font-arabic">
                            جاري التفكير...
                        </div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-[#25935f] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#25935f] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-[#25935f] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};