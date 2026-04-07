import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function ChatPanel({ socket, activeRoom }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom on new message
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Clear messages when joining a new room
    setMessages([]);

    function onMessage(data) {
      setMessages((prev) => [...prev, data]);
    }

    function onHistory(history) {
      setMessages(history);
    }

    socket.on('chatMessage', onMessage);
    socket.on('chatHistory', onHistory);

    return () => {
      socket.off('chatMessage', onMessage);
      socket.off('chatHistory', onHistory);
    };
  }, [socket, activeRoom]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    socket.emit('chatMessage', inputVal.trim());
    setInputVal('');
  };

  return (
    <div className="absolute overflow-hidden bottom-8 right-8 w-[340px] h-[420px] flex flex-col bg-white/[0.04] backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-50 animate-slide-up">
      {/* Header */}
      <div className="relative px-5 py-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" /> Nearby Connection
        </h3>
        <div className="relative flex items-center justify-center w-3 h-3">
          <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-60" />
          <div className="w-2 h-2 rounded-full bg-blue-400 z-10" />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 text-sm mt-auto mb-auto font-light">
            You've crossed paths! <br /> Say hello.
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === socket.id;
            return (
              <div key={idx} className={cn("flex flex-col max-w-[85%] animate-slide-up", isMe ? "self-end items-end" : "self-start items-start")}>
                <div className="text-[10px] text-white/40 mb-1 ml-1 tracking-wide uppercase">{m.sender}</div>
                <div className={cn("px-4 py-2.5 rounded-2xl text-sm break-words shadow-sm", isMe ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm border border-white/5")}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4 bg-black/20 border-t border-white/5 flex gap-2 items-center">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Send a message..."
          className="flex-1 bg-white/5 border border-white/10 shadow-inner rounded-full px-5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-white/30"
        />
        <button type="submit" disabled={!inputVal.trim()} className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-400 hover:to-purple-500 disabled:opacity-50 disabled:grayscale rounded-full text-white transition-all shadow-lg hover:shadow-blue-500/25">
          <Send className="w-4 h-4 ml-0.5" />
        </button>
      </form>
    </div>
  );
}
