import { motion } from 'framer-motion';
import { MessageIcon } from './icons';

export const Overview = () => {
    return (
        <motion.div
            key="overview"
            className="w-full h-full flex justify-center items-center"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ delay: 0.5 }}
        >
            <div className="flex flex-col gap-8 mt-[9rem] text-center">
                <div className="p-8 bg-gradient-to-br from-[#25935f]/10 to-[#25935f]/20 rounded-3xl shadow-xl border border-[#25935f]/30">
                    <MessageIcon size={56} />
                </div>
                <h1 className="text-5xl font-bold text-[#25935f] font-arabic">
                    مرحباً بك في نظام الذكاء الاصطناعي
                </h1>
                <p className="text-xl text-gray-700 max-w-lg font-arabic">
                    نظام ذكي لتحليل البيانات الصناعية وإنشاء التقارير والرسوم البيانية
                </p>
            </div>
        </motion.div>
    );
};
