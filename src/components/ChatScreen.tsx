import { useState, useRef, useEffect } from "react";
import { Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatScreenProps {
  onEndChat: () => void;
}

const ChatScreen = ({ onEndChat }: ChatScreenProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    const timer = setTimeout(() => {
      const greeting: Message = {
        role: "assistant",
        content: "നമസ്കാരം! 🎅 ഞാൻ സാന്താ ക്ലോസ്. നീ എത്ര സന്തോഷിതനാണ് ഈ ക്രിസ്മസ്സ് സീസണിൽ?",
      };
      setMessages([greeting]);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setTextInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/santa-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Chat error:", response.status, errorData);
        throw new Error("Failed to get Santa's response");
      }

      const data = await response.json();
      const santaMessage: Message = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, santaMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Connection Issue",
        description: "Couldn't reach Santa. Try again!",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(textInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-night to-background">
      {/* Chat header */}
      <div className="flex items-center justify-between pt-6 px-4 pb-4 border-b border-border">
        <button
          onClick={onEndChat}
          className="w-10 h-10 rounded-full bg-muted flex items-center justify-center
                     hover:bg-muted/80 transition-all"
        >
          <X className="w-6 h-6 text-foreground" />
        </button>
        
        <div className="flex-1 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 mb-2 flex items-center justify-center text-4xl">
            🎅
          </div>
          <h2 className="font-display text-xl text-foreground">Santa Claus</h2>
          <p className="text-muted-foreground text-xs">Chat in Malayalam</p>
        </div>

        <div className="w-10" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-4 rounded-2xl bg-muted text-foreground rounded-bl-sm">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse" />
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 rounded-full bg-muted-foreground animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-6 bg-gradient-to-t from-background to-transparent border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Type your message to Santa..."
            disabled={isLoading}
            className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-christmas-gold flex items-center justify-center
                       hover:bg-christmas-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-secondary-foreground" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatScreen;
