import { Markdown } from "./markdown";

export interface ChatTextComponentProps {
    text: string;
    role: string;
}

export function ChatTextComponent(props: Readonly<ChatTextComponentProps>) {
    const { text } = props;

    // تصفية الرسائل غير المرغوب فيها
    const filteredText = text
        .replace(/The question is clear and I can answer it with the following SQL\./gi, '')
        .replace(/I can answer it with the following SQL\./gi, '')
        .replace(/The question is clear and I can answer it\./gi, '')
        .replace(/The question is clear\./gi, '')
        .trim();

    if (!filteredText) return null;

    return (
        <div className="w-full">
            <div className="prose prose-green max-w-none font-arabic">
                <Markdown>{filteredText}</Markdown>
            </div>
        </div>
    )
}