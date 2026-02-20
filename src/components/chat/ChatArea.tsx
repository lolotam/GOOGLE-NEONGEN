import { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Paperclip } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { geminiService } from '@/lib/api/gemini';
import { ChatMessage } from './ChatMessage';
import { ModelSelector } from './ModelSelector';
import { GenerateContentResponse } from '@google/genai';
import { cn } from '@/lib/utils';

export const ChatArea = () => {
  const { 
    conversations, 
    currentConversationId, 
    addMessage, 
    isLoading, 
    setLoading,
    selectedModel,
    updateConversationTitle
  } = useChatStore();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentConversation = conversations.find(c => c.id === currentConversationId);
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !currentConversationId || isLoading) return;

    const userMessageContent = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Add user message
    addMessage(currentConversationId, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessageContent,
      timestamp: Date.now(),
    });

    setLoading(true);

    try {
      // Prepare history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      // Stream response
      const streamResult = await geminiService.streamContent(selectedModel, userMessageContent, history);
      
      const botMessageId = crypto.randomUUID();
      let fullContent = '';
      
      // Add initial empty bot message
      addMessage(currentConversationId, {
        id: botMessageId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
      });

      for await (const chunk of streamResult) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || '';
        fullContent += text;
        
        // Update the last message with accumulated content
        // Note: In a real app, we'd want a more efficient way to update the last message 
        // than replacing the whole array in the store, but this works for now.
        useChatStore.setState((state) => {
            const convs = state.conversations.map(c => {
                if (c.id === currentConversationId) {
                    const msgs = [...c.messages];
                    msgs[msgs.length - 1] = {
                        ...msgs[msgs.length - 1],
                        content: fullContent
                    };
                    return { ...c, messages: msgs };
                }
                return c;
            });
            return { conversations: convs };
        });
      }

      // Generate title if it's the first message
      if (messages.length === 0) {
        const titlePrompt = `Generate a short, concise title (max 4 words) for this conversation based on the first message: "${userMessageContent}"`;
        const title = await geminiService.generateContent('gemini-3-flash-preview', titlePrompt);
        if (title) {
            updateConversationTitle(currentConversationId, title.trim().replace(/^"|"$/g, ''));
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      addMessage(currentConversationId, {
        id: crypto.randomUUID(),
        role: 'model',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: Date.now(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        Select or create a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background-primary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="font-medium truncate max-w-md">
          {currentConversation?.title}
        </div>
        <ModelSelector />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
             <div className="flex gap-4 p-6 rounded-2xl bg-transparent">
                <div className="w-8 h-8 rounded-lg bg-primary-lime text-background-primary flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-background-primary border-t border-white/5">
        <div className="max-w-4xl mx-auto relative">
          <div className="absolute left-3 top-3">
            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
          
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-background-secondary border border-white/10 rounded-2xl pl-12 pr-12 py-4 min-h-[60px] max-h-[200px] resize-none focus:outline-none focus:border-primary-neon/50 text-white placeholder:text-gray-500"
            rows={1}
          />
          
          <div className="absolute right-3 top-3">
            <button
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-2 rounded-lg transition-colors",
                input.trim() && !isLoading
                  ? "bg-primary-neon text-background-primary hover:bg-primary-lime"
                  : "bg-white/5 text-gray-500 cursor-not-allowed"
              )}
            >
              {isLoading ? <StopCircle className="w-5 h-5" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="text-center mt-2 text-xs text-gray-500">
          AI can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};

import { Bot } from 'lucide-react';
