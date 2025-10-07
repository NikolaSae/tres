// app/(protected)/admin/aidash/components/ChatInterface.tsx

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Send, Bot, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Request failed');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Greška: ${error.message}. Molim vas pokušajte ponovo.`,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const quickCommands = [
    { label: '🛠️ Alati', command: 'Koje alate imam?' },
    { label: '📋 Ugovori', command: 'Prikaži ugovore' },
    { label: '🏢 Provajderi', command: 'Prikaži provajdere' },
    { label: '📊 Statistika', command: 'Statistika' }
  ];

  const handleQuickCommand = (command: string) => {
    setInput(command);
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="font-semibold">MCP Asistent</h3>
            <p className="text-xs text-blue-100">Pitajte me bilo šta o sistemu</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 space-y-4">
            <div className="text-4xl">👋</div>
            <p className="font-medium">Pozdrav! Kako vam mogu pomoći?</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {quickCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickCommand(cmd.command)}
                  className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[75%] p-3 rounded-lg whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 border rounded-bl-none'
                }`}
              >
                {msg.content}
                <div className={`text-xs mt-1 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString('sr-RS', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white dark:bg-gray-800 border p-3 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Razmišljam...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands Bar (when no messages) */}
      {messages.length > 0 && (
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-t">
          <div className="flex gap-2 overflow-x-auto">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickCommand(cmd.command)}
                disabled={loading}
                className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors whitespace-nowrap disabled:opacity-50"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-900 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700"
            placeholder="Unesite vašu poruku..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="px-4 bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Pritisnite Enter za slanje • Probajte: "Koje alate imam?"
        </p>
      </form>
    </div>
  );
}