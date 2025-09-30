// app/(protected)/admin/aidash/components/ChatInterface.tsx
'use client';


import { useState } from 'react';
import type { ChatMessage } from '@/lib/types/dashboard';
import { Button } from '@/components/ui/button';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);

    // Ovo je primer kako ide server action
    // const response = await sendChatMessage(input);
    // setMessages([...messages, { role: 'user', content: input }, ...response]);

    setInput('');
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="h-64 overflow-y-auto border p-4 rounded-lg">
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="inline-block p-2 rounded bg-gray-100 dark:bg-gray-800">
              {msg.content}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" disabled={loading}>
          Pošalji
        </Button>
      </form>
    </div>
  );
}
