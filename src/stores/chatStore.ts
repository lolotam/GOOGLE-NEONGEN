import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  messages: Message[];
  updatedAt: number;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  selectedModel: string;
  isLoading: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversationId: (id: string | null) => void;
  setSelectedModel: (model: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: (model?: string) => string;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      selectedModel: 'gemini-3-flash-preview',
      isLoading: false,

      setConversations: (conversations) => set({ conversations }),
      setCurrentConversationId: (id) => set({ currentConversationId: id }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setLoading: (loading) => set({ isLoading: loading }),

      addMessage: (conversationId, message) => {
        set((state) => {
          const conversations = state.conversations.map((c) => {
            if (c.id === conversationId) {
              return {
                ...c,
                messages: [...c.messages, message],
                updatedAt: Date.now(),
              };
            }
            return c;
          });
          return { conversations };
        });
      },

      createConversation: (model) => {
        const id = crypto.randomUUID();
        const newConversation: Conversation = {
          id,
          title: 'New Chat',
          model: model || get().selectedModel,
          messages: [],
          updatedAt: Date.now(),
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId,
        }));
      },

      updateConversationTitle: (id, title) => {
        set((state) => ({
          conversations: state.conversations.map((c) => 
            c.id === id ? { ...c, title } : c
          ),
        }));
      },
    }),
    {
      name: 'neongen-chat-storage',
    }
  )
);
