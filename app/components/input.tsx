'use client';

import cx from 'classnames';
import type React from 'react';
import {
    useRef,
    useEffect,
    useCallback,
    memo,
    useState,
} from 'react';
import { toast } from 'sonner';
import { useWindowSize } from 'usehooks-ts';

import { ArrowUpIcon } from './icons';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export const ChatInput = ({
    isLoading,
    handleSubmit,
    className,
}: {
    isLoading: boolean;
    handleSubmit: (input: string) => void;
    className?: string;
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { width } = useWindowSize();
    const [isMounted, setIsMounted] = useState(false);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setIsMounted(true);
        if (textareaRef.current) {
            adjustHeight();
        }
    }, []);

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`;
        }
    };

    const resetHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = '98px';
        }
    };

    const submitForm = useCallback(() => {
        if (!textareaRef.current) return;

        if (textareaRef.current.value.trim() === '') {
            toast.error('Please enter a message.');
            return;
        }

        handleSubmit(textareaRef.current.value);
        textareaRef.current.value = '';
        setInputValue('');
        resetHeight();

        if (width && width > 768) {
            textareaRef.current?.focus();
        }
    }, [handleSubmit, width]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        adjustHeight();
    }, []);

    if (!isMounted) {
        return (
            <div className="relative w-full flex flex-col gap-6">
                <div className="flex w-full rounded-md border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm border-0 min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base bg-muted pb-10 dark:border-zinc-700">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full flex flex-col gap-6">
            <div className="relative">
                <Textarea
                    ref={textareaRef}
                    placeholder="اكتب رسالتك هنا..."
                    className={cx(
                        'border-2 border-[#25935f]/30 min-h-[24px] max-h-[calc(75dvh)] overflow-hidden resize-none !text-base bg-white pb-12 dark:border-zinc-700 rounded-3xl shadow-xl focus:border-[#25935f] focus:ring-2 focus:ring-[#25935f]/20 transition-all duration-200',
                        className,
                    )}
                    rows={2}
                    autoFocus
                    suppressHydrationWarning={true}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();

                            if (isLoading) {
                                toast.error('Please wait for the model to finish its response!');
                            } else {
                                submitForm();
                            }
                        }
                    }}
                />

                <div className="absolute bottom-2 right-2 w-fit flex flex-row justify-end">
                    <SendButton
                        input={inputValue}
                        submitForm={submitForm}
                    />
                </div>
            </div>
        </div>
    );
}

function PureSendButton({
    submitForm,
    input,
}: {
    submitForm: () => void;
    input: string;
}) {
    return (
        <Button
            className="p-3 size-12 rounded-2xl border-0 shadow-xl bg-[#25935f] hover:bg-[#25935f]/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(event) => {
                event.preventDefault();
                submitForm();
            }}
            disabled={input.length === 0}
        >
            <div className="text-white">
                <ArrowUpIcon size={16} />
            </div>
        </Button>
    );
}

const SendButton = memo(PureSendButton, (prevProps, nextProps) => {
    if (prevProps.input !== nextProps.input) return false;
    return true;
});
