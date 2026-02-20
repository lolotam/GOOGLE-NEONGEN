import { useChatStore } from '@/stores/chatStore';
import { Plus, MessageSquare, Trash2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useState } from 'react';

export const ChatSidebar = () => {
  const { 
    conversations, 
    currentConversationId, 
    setCurrentConversationId, 
    createConversation, 
    deleteConversation 
  } = useChatStore();
  
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 h-full border-r border-white/5 bg-background-secondary/50 flex flex-col">
      <div className="p-4 space-y-4">
        <button
          onClick={() => createConversation()}
          className="w-full flex items-center gap-2 px-4 py-3 bg-primary-neon text-background-primary rounded-xl font-bold hover:bg-primary-lime transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background-tertiary border border-white/5 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-primary-neon/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredConversations.map((conv) => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors relative",
              currentConversationId === conv.id 
                ? "bg-white/10 text-white" 
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            )}
            onClick={() => setCurrentConversationId(conv.id)}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {new Date(conv.updatedAt).toLocaleDateString()}
              </p>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-md transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            No conversations yet
          </div>
        )}
      </div>
    </div>
  );
};
