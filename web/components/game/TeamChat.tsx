'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/types';

interface Props {
  messages: ChatMessage[];
  myUserId: string;
  onSend: (text: string) => void;
  onClose: () => void;
}

const QUICK_MESSAGES = ['Send piece!', 'Hold on!', 'Good move!', 'Thanks!'];

export default function TeamChat({ messages, myUserId, onSend, onClose }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  }

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-gray-900 border-l border-gray-700 flex flex-col z-40 shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <span className="font-semibold">Team Chat</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === myUserId;
          return (
            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <span className="text-xs text-gray-500 mb-0.5">{isMe ? 'You' : msg.senderName}</span>
              <span className={`px-3 py-1.5 rounded-2xl text-sm max-w-[220px] break-words ${isMe ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                {msg.text}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-gray-800">
        {QUICK_MESSAGES.map((qm) => (
          <button
            key={qm}
            onClick={() => onSend(qm)}
            className="bg-gray-800 hover:bg-gray-700 rounded-full px-2.5 py-1 text-xs text-gray-300 transition-colors"
          >
            {qm}
          </button>
        ))}
      </div>

      <div className="flex gap-2 px-3 py-3 border-t border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
        >
          Send
        </button>
      </div>
    </div>
  );
}
