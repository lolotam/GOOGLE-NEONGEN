import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { useChatStore } from '@/stores/chatStore';
import { useEffect } from 'react';

export default function Chat() {
  const { createConversation, conversations, currentConversationId } = useChatStore();

  useEffect(() => {
    // Create a new conversation if none exist
    if (conversations.length === 0 && !currentConversationId) {
      createConversation();
    }
  }, [conversations.length, currentConversationId, createConversation]);

  return (
    <div className="flex h-full">
      <div className="hidden lg:block h-full">
        <ChatSidebar />
      </div>
      <ChatArea />
    </div>
  );
}
