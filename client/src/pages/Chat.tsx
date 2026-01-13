import { useState, useRef, useEffect } from "react";
import { useConversations, useCreateConversation, useConversation, useChatStream } from "@/hooks/use-chat";
import { BottomNav } from "@/components/BottomNav";
import { Send, Plus, MessageSquare, Bot } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatPage() {
  const { data: conversations, isLoading: isLoadingConvos } = useConversations();
  const { mutate: createConvo } = useCreateConversation();
  const [activeId, setActiveId] = useState<number | null>(null);

  // Auto-select first conversation or create one if none exist
  useEffect(() => {
    if (conversations && conversations.length > 0 && !activeId) {
      setActiveId(conversations[0].id);
    }
  }, [conversations]);

  const handleNewChat = () => {
    createConvo("New Consultation", {
      onSuccess: (data) => setActiveId(data.id),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm z-10 flex items-center justify-between">
        <h1 className="text-xl font-bold font-display text-slate-900">AI Nutritionist</h1>
        <button 
          onClick={handleNewChat}
          className="p-2 bg-emerald-50 text-primary rounded-full hover:bg-emerald-100 transition"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeId ? (
          <ChatWindow conversationId={activeId} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <Bot className="w-16 h-16 mb-4 text-emerald-200" />
            <p>Start a new conversation to get advice.</p>
            <button onClick={handleNewChat} className="mt-4 text-primary font-medium">Start Chat</button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ChatWindow({ conversationId }: { conversationId: number }) {
  const { data: conversation } = useConversation(conversationId);
  const { sendMessage, streamingContent, isStreaming } = useChatStream(conversationId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] p-4 rounded-2xl ${
              msg.role === "user" 
                ? "bg-primary text-white rounded-br-none" 
                : "bg-white text-slate-800 shadow-sm rounded-bl-none border border-gray-100"
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap text-sm">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {isStreaming && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="max-w-[85%] p-4 rounded-2xl bg-white text-slate-800 shadow-sm rounded-bl-none border border-gray-100">
               <p className="leading-relaxed whitespace-pre-wrap text-sm">
                 {streamingContent}
                 <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />
               </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your diet..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isStreaming}
            className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none hover:bg-emerald-600 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
