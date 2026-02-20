import ReactMarkdown from 'react-markdown';
import { User, Bot, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Message } from '@/stores/chatStore';

export const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "flex gap-4 p-6 rounded-2xl transition-colors",
      isUser ? "bg-white/5" : "bg-transparent"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
        isUser ? "bg-primary-neon text-background-primary" : "bg-primary-lime text-background-primary"
      )}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">
            {isUser ? 'You' : 'NeonGen AI'}
          </span>
          {!isUser && (
            <button 
              onClick={handleCopy}
              className="p-1.5 hover:bg-white/10 rounded-md text-gray-500 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
        
        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};
