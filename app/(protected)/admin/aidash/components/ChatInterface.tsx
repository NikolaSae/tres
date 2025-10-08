// app/(protected)/admin/aidash/components/ChatInterface.tsx

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Send, 
  Bot, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCheck,
  Wrench,
  Info,
  AlertCircle,
  Sparkles
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  toolsUsed?: string[];
  data?: any;
  error?: boolean;
}

interface UserContext {
  role: string;
  availableTools: string[];
  recentTools: string[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showToolsPanel, setShowToolsPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user context on mount
  useEffect(() => {
    fetchUserContext();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUserContext = async () => {
    try {
      const res = await fetch('/api/chat/context');
      if (res.ok) {
        const data = await res.json();
        setUserContext(data);
      }
    } catch (error) {
      console.error('Failed to fetch context:', error);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
        body: JSON.stringify({ 
          message: userMessage.content,
          conversationHistory: messages.slice(-5) // Last 5 messages for context
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Request failed');
      }

      const data = await res.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp || new Date().toISOString(),
        toolsUsed: data.toolsUsed || [],
        data: data.data || null
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update recent tools in context
      if (data.toolsUsed && userContext) {
        setUserContext({
          ...userContext,
          recentTools: [...new Set([...data.toolsUsed, ...userContext.recentTools])].slice(0, 10)
        });
      }

    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: `Došlo je do greške: ${error.message}`,
        timestamp: new Date().toISOString(),
        error: true
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleQuickCommand = (command: string) => {
    setInput(command);
  };

  const quickCommands = [
  { label: '🛠️ Alati', command: 'Koje alate imam?' },
  { label: '📋 Ugovori', command: 'Prikaži ugovore' },
  { label: '🏢 Provajderi', command: 'Lista provajdera' },
  { label: '😠 Žalbe', command: 'Prikaži žalbe' },
  { label: '📊 Statistika', command: 'Moja statistika' },
  // Dodaj svoje:
  { label: '💰 Finansije', command: 'Finansijski izveštaj' },
  { label: '⚠️ Ističu', command: 'Ugovori koji ističu' }
];

  const roleColors = {
    ADMIN: 'bg-red-100 text-red-800 border-red-200',
    MANAGER: 'bg-purple-100 text-purple-800 border-purple-200',
    AGENT: 'bg-blue-100 text-blue-800 border-blue-200',
    USER: 'bg-green-100 text-green-800 border-green-200'
  };

  const renderMessageContent = (msg: Message, index: number) => {
    const isExpanded = expandedMessages.has(index);
    const hasData = msg.data && Object.keys(msg.data).length > 0;
    const hasTools = msg.toolsUsed && msg.toolsUsed.length > 0;

    return (
      <div className="space-y-2">
        {/* Tools used indicator */}
        {hasTools && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 pb-2 border-b dark:border-gray-700">
            <Wrench className="w-3 h-3" />
            <span>Korišćeni alati:</span>
            <div className="flex gap-1">
              {msg.toolsUsed!.map((tool, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="whitespace-pre-wrap">{msg.content}</div>

        {/* Data preview */}
        {hasData && (
          <div className="mt-3 border-t dark:border-gray-700 pt-3">
            <button
              onClick={() => toggleExpand(index)}
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mb-2"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {isExpanded ? 'Sakrij detalje' : 'Prikaži detalje'}
            </button>
            
            {isExpanded && (
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(msg.data, null, 2)}
                </pre>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(msg.data, null, 2), index)}
                  className="absolute top-2 right-2 p-1.5 bg-gray-800 hover:bg-gray-700 rounded"
                  title="Kopiraj JSON"
                >
                  {copiedIndex === index ? (
                    <CheckCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[700px] border rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">MCP AI Asistent</h3>
              <p className="text-xs text-blue-100">Vaš pametni pomoćnik za sistem</p>
            </div>
          </div>
          
          {userContext && (
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleColors[userContext.role] || roleColors.USER}`}>
                {userContext.role}
              </span>
              <button
                onClick={() => setShowToolsPanel(!showToolsPanel)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Dostupni alati"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tools Panel */}
      {showToolsPanel && userContext && (
        <div className="bg-blue-50 dark:bg-gray-800 border-b p-4">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-2">Dostupni alati ({userContext.availableTools.length})</h4>
              <div className="flex flex-wrap gap-1.5">
                {userContext.availableTools.map((tool, i) => (
                  <span key={i} className="px-2 py-1 bg-white dark:bg-gray-700 border rounded text-xs">
                    {tool}
                  </span>
                ))}
              </div>
              {userContext.recentTools.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs text-gray-600 dark:text-gray-400 mb-1">Nedavno korišćeni:</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {userContext.recentTools.slice(0, 5).map((tool, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 space-y-6">
            <div className="text-5xl">👋</div>
            <div>
              <p className="font-medium text-lg mb-2">Pozdrav! Kako vam mogu pomoći danas?</p>
              <p className="text-sm text-gray-400">
                Imam pristup svim alatima sistema i mogu vam pomoći sa bilo kojim upitom
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-6">
              {quickCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickCommand(cmd.command)}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:shadow-md transition-all"
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.error ? 'bg-red-600' : 'bg-blue-600'
                }`}>
                  {msg.error ? (
                    <AlertCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-white" />
                  )}
                </div>
              )}
              
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                    : msg.error
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-bl-none'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'
                }`}
              >
                {renderMessageContent(msg, idx)}
                <div className={`text-xs mt-2 flex items-center gap-2 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString('sr-RS', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  {msg.role === 'assistant' && !msg.error && (
                    <button
                      onClick={() => copyToClipboard(msg.content, idx + 1000)}
                      className="hover:text-gray-600 dark:hover:text-gray-200"
                      title="Kopiraj odgovor"
                    >
                      {copiedIndex === idx + 1000 ? (
                        <CheckCheck className="w-3 h-3" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
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
              <Bot className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div className="bg-white dark:bg-gray-800 border p-4 rounded-lg rounded-bl-none flex items-center gap-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400 block">Razmišljam...</span>
                <span className="text-xs text-gray-400">Obrađujem vaš zahtev</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Commands Bar */}
      {messages.length > 0 && (
        <div className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-t">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickCommand(cmd.command)}
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 border rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 hover:shadow transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            placeholder="Unesite vašu poruku..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button 
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500">
            💡 Enter za slanje • Shift+Enter za novi red
          </p>
          {userContext && (
            <p className="text-xs text-gray-400">
              {userContext.availableTools.length} dostupnih alata
            </p>
          )}
        </div>
      </div>
    </div>
  );
}