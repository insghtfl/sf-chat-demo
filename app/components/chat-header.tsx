'use client';

import { Button } from './ui/button';
import { PlusIcon } from './icons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function ChatHeader() {

    return (
        <header className="flex sticky top-0 bg-[#25935f] py-3 items-center px-6 gap-4 border-b border-[#25935f]/30 shadow-lg">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            className="order-2 md:order-1 px-4 py-2 md:h-fit ml-auto md:ml-0 rounded-xl border-2 border-white/30 hover:border-white/50 hover:bg-white/20 transition-all duration-200 shadow-sm bg-white/10 text-white"
                            onClick={() => {
                                window.location.reload();
                            }}
                        >
                            <PlusIcon />
                            <span className="font-medium text-sm font-arabic">محادثة جديدة</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>New Chat</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </header>
    );
}