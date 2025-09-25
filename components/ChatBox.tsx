'use client';

import { useState } from 'react';

export default function ChatBox() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' }
  ]);

  const sendMessage = async () => {
    const newMessages = [...messages, { role: 'user', content: input }];

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content;

    if (reply) {
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    }

    setInput('');
  };

  return (
    <div className="p-4">
      <div className="border p-2 h-64 overflow-auto mb-4">
        {messages.map((msg, idx) => (
          <p key={idx}><strong>{msg.role}:</strong> {msg.content}</p>
        ))}
      </div>
      <input
        className="border p-2 w-full"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Unesi poruku..."
      />
      <button onClick={sendMessage} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Pošalji
      </button>
    </div>
  );
}
