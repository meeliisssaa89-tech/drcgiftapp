import { useState, useRef, useEffect } from 'react';
import { Send, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/hooks/useLudoGame';

interface LudoChatProps {
  messages: ChatMessage[];
  myId: string;
  onSendMessage: (params: { message: string; type?: 'text' | 'emoji' }) => void;
}

const QUICK_EMOJIS = ['👍', '😂', '😢', '😡', '🎉', '🔥', '💀', '🤔'];

export const LudoChat = ({ messages, myId, onSendMessage }: LudoChatProps) => {
  const [input, setInput] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage({ message: input.trim(), type: 'text' });
    setInput('');
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage({ message: emoji, type: 'emoji' });
    setShowEmojis(false);
  };

  return (
    <div className="flex flex-col h-48 bg-card/40 backdrop-blur-sm rounded-xl border border-border/50 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.sender_id === myId ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] px-3 py-1.5 rounded-2xl text-sm",
                  msg.message_type === 'emoji' && "text-2xl bg-transparent px-1",
                  msg.message_type === 'system' && "text-muted-foreground italic",
                  msg.message_type === 'text' && msg.sender_id === myId
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : msg.message_type === 'text'
                    ? "bg-muted text-foreground rounded-bl-sm"
                    : ""
                )}
              >
                {msg.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Emojis */}
      {showEmojis && (
        <div className="flex gap-2 px-3 py-2 border-t border-border/50 bg-background/50">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="text-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 p-2 border-t border-border/50">
        <button
          onClick={() => setShowEmojis(!showEmojis)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            showEmojis ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Smile className="w-5 h-5" />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Send a message..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className={cn(
            "p-2 rounded-lg transition-colors",
            input.trim()
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
