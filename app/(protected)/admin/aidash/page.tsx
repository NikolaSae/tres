////app/(protected)/admin/aidash/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  MessageCircle, 
  Database, 
  Users, 
  Activity, 
  AlertCircle, 
  TrendingUp,
  RefreshCw,
  Bot,
  Search,
  BarChart3,
  FileText,
  Settings,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface McpStats {
  totalQueries: number;
  topTools: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    userId: string;
    userName: string;
    toolName: string;
    timestamp: string;
    count: number;
  }>;
}

interface SystemHealth {
  users: { total: number; active: number };
  contracts: { total: number; active: number };
  complaints: { pending: number };
  humanitarians: Array<{
    name: string;
    shortNumber: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    mission: string | null;
  }>;
}

// 3D Box Loader Component
const BoxLoader = () => {
  return (
    <div className="box-loader-wrapper">
      <style>{`
        .box-loader-wrapper {
          width: 200px;
          height: 320px;
          position: relative;
          transform-style: preserve-3d;
        }

        @media(max-width: 480px) {
          .box-loader-wrapper {
            zoom: 0.44;
          }
        }

        .box-loader-wrapper:before,
        .box-loader-wrapper:after {
          --r: 20.5deg;
          content: '';
          width: 320px;
          height: 140px;
          position: absolute;
          right: 32%;
          bottom: -11px;
          background: #121621;
          transform: translateZ(200px) rotate(var(--r));
          animation: mask 3s linear forwards infinite;
        }

        .box-loader-wrapper:after {
          --r: -20.5deg;
          right: auto;
          left: 32%;
        }

        .loader-ground {
          position: absolute;
          left: -50px;
          bottom: -120px;
          transform-style: preserve-3d;
          transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1);
        }

        .loader-ground > div {
          transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0);
          width: 200px;
          height: 200px;
          background: linear-gradient(45deg, rgba(39, 94, 254, 1) 0%, rgba(39, 94, 254, 1) 50%, #2f71ff 50%, #2f71ff 100%);
          transform-style: preserve-3d;
          animation: ground 3s linear forwards infinite;
        }

        .loader-ground > div:before,
        .loader-ground > div:after {
          --rx: 90deg;
          --ry: 0deg;
          --x: 44px;
          --y: 162px;
          --z: -50px;
          content: '';
          width: 156px;
          height: 300px;
          opacity: 0;
          background: linear-gradient(rgba(39, 94, 254, 1), rgba(39, 94, 254, 0));
          position: absolute;
          transform: rotateX(var(--rx)) rotateY(var(--ry)) translate(var(--x), var(--y)) translateZ(var(--z));
          animation: ground-shine 3s linear forwards infinite;
        }

        .loader-ground > div:after {
          --rx: 90deg;
          --ry: 90deg;
          --x: 0;
          --y: 177px;
          --z: 150px;
        }

        .loader-box {
          position: absolute;
          animation: 3s linear forwards infinite;
          transform: translate(var(--x), var(--y));
        }

        .loader-box > div {
          background-color: rgba(39, 94, 254, 1);
          width: 48px;
          height: 48px;
          position: relative;
          transform-style: preserve-3d;
          animation: 3s ease forwards infinite;
          transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0);
        }

        .loader-box > div:before,
        .loader-box > div:after {
          content: '';
          position: absolute;
          background-color: inherit;
          width: inherit;
          height: inherit;
        }

        .loader-box > div:before {
          transform: rotateX(90deg) rotateY(0deg) translate(0, -24px) translateZ(24px);
          filter: brightness(1.2);
        }

        .loader-box > div:after {
          transform: rotateX(0deg) rotateY(90deg) translate(24px, 0) translateZ(24px);
          filter: brightness(1.4);
        }

        .loader-box.box0 { --x: -220px; --y: -120px; left: 58px; top: 108px; animation-name: box-move0; }
        .loader-box.box1 { --x: -260px; --y: 120px; left: 25px; top: 120px; animation-name: box-move1; }
        .loader-box.box2 { --x: 120px; --y: -190px; left: 58px; top: 64px; animation-name: box-move2; }
        .loader-box.box3 { --x: 280px; --y: -40px; left: 91px; top: 120px; animation-name: box-move3; }
        .loader-box.box4 { --x: 60px; --y: 200px; left: 58px; top: 132px; animation-name: box-move4; }
        .loader-box.box5 { --x: -220px; --y: -120px; left: 25px; top: 76px; animation-name: box-move5; }
        .loader-box.box6 { --x: -260px; --y: 120px; left: 91px; top: 76px; animation-name: box-move6; }
        .loader-box.box7 { --x: -240px; --y: 200px; left: 58px; top: 87px; animation-name: box-move7; }

        .loader-box.box0 > div { animation-name: box-scale0; }
        .loader-box.box1 > div { animation-name: box-scale1; }
        .loader-box.box2 > div { animation-name: box-scale2; }
        .loader-box.box3 > div { animation-name: box-scale3; }
        .loader-box.box4 > div { animation-name: box-scale4; }
        .loader-box.box5 > div { animation-name: box-scale5; }
        .loader-box.box6 > div { animation-name: box-scale6; }
        .loader-box.box7 > div { animation-name: box-scale7; }

        @keyframes box-move0 { 12% { transform: translate(var(--x), var(--y)); } 25%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move1 { 16% { transform: translate(var(--x), var(--y)); } 29%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move2 { 20% { transform: translate(var(--x), var(--y)); } 33%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move3 { 24% { transform: translate(var(--x), var(--y)); } 37%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move4 { 28% { transform: translate(var(--x), var(--y)); } 41%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move5 { 32% { transform: translate(var(--x), var(--y)); } 45%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move6 { 36% { transform: translate(var(--x), var(--y)); } 49%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }
        @keyframes box-move7 { 40% { transform: translate(var(--x), var(--y)); } 53%, 52% { transform: translate(0, 0); } 80% { transform: translate(0, -32px); } 90%, 100% { transform: translate(0, 188px); } }

        @keyframes box-scale0 { 6% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 14%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale1 { 10% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 18%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale2 { 14% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 22%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale3 { 18% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 26%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale4 { 22% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 30%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale5 { 26% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 34%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale6 { 30% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 38%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }
        @keyframes box-scale7 { 34% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(0); } 42%, 100% { transform: rotateY(-47deg) rotateX(-15deg) rotateZ(15deg) scale(1); } }

        @keyframes ground {
          0%, 65% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0); }
          75%, 90% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(1); }
          100% { transform: rotateX(90deg) rotateY(0deg) translate(-48px, -120px) translateZ(100px) scale(0); }
        }

        @keyframes ground-shine {
          0%, 70% { opacity: 0; }
          75%, 87% { opacity: 0.2; }
          100% { opacity: 0; }
        }

        @keyframes mask {
          0%, 65% { opacity: 0; }
          66%, 100% { opacity: 1; }
        }
      `}</style>
      
      <div className="box-loader-wrapper">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className={`loader-box box${i}`}>
            <div></div>
          </div>
        ))}
        <div className="loader-ground">
          <div></div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = "default" }: {
  title: string;
  value: number;
  subtitle?: string;
  icon: any;
  color?: "default" | "success" | "warning" | "error";
}) => {
  const colorClasses = {
    default: "text-blue-600 bg-blue-50 dark:bg-blue-950",
    success: "text-green-600 bg-green-50 dark:bg-green-950",
    warning: "text-orange-600 bg-orange-50 dark:bg-orange-950",
    error: "text-red-600 bg-red-50 dark:bg-red-950"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold tracking-tight">{value.toLocaleString()}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ChatMessage = ({ message, index }: { message?: { role?: string; content?: string }, index: number }) => {
  if (!message || !message.role) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: message.role === 'user' ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
        message.role === 'user' 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-foreground border'
      }`}>
        <div className="flex items-start gap-3">
          {message.role === 'assistant' && (
            <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white">
              <Bot className="h-4 w-4" />
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function AiDashboard() {
  const [stats, setStats] = useState<McpStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [userLogs, setUserLogs] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: 'assistant',
      content: 'Dobrodošli u AI Dashboard! 🚀\n\nMožete me pitati o:\n• Aktivnim ugovorima\n• Provajderima\n• Žalbama\n• Statistikama sistema\n• Upravljanju korisnicima\n• Humanitarnim organizacijama\n\nNapišite vaš upit...'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [toolsUsage, setToolsUsage] = useState<any[]>([]);
  
  const fetchDashboardData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setRefreshing(true);
      else setLoading(true);
      
      const [statsRes, healthRes, toolsRes] = await Promise.all([
        fetch('/api/admin/mcp/stats'),
        fetch('/api/admin/mcp/system-health'),
        fetch('/api/admin/mcp/tools-usage')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        console.log('Stats API response:', statsData);
      } else {
        console.error('Stats API failed:', await statsRes.text());
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth({
          users: healthData.users,
          contracts: healthData.contracts,
          complaints: healthData.complaints,
          humanitarians: healthData.humanitarians
        });
      } else {
        console.error('Health API failed:', await healthRes.text());
      }

      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setToolsUsage(toolsData.tools || []);
        console.log('Tools usage API response:', toolsData);
      } else {
        console.error('Tools API failed:', await toolsRes.text());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchUserLogs = async () => {
    if (!searchEmail) return;

    try {
      const userRes = await fetch(`/api/admin/mcp/users?email=${encodeURIComponent(searchEmail)}`);
      if (!userRes.ok) throw new Error('Korisnik nije pronađen');
      const userData = await userRes.json();
      const userId = userData.user?.id;
      if (!userId) {
        setUserLogs([]);
        return;
      }

      const response = await fetch(`/api/admin/mcp/users/${encodeURIComponent(userId)}/logs`);
      if (response.ok) {
        const data = await response.json();
        setUserLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error searching user logs:', error);
      setUserLogs([]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || chatLoading) return;

    const userMessage = inputMessage;
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInputMessage('');
    setChatLoading(true);

    try {
      const lowerInput = userMessage.toLowerCase();
      
      if (lowerInput.includes('humanitarne') || lowerInput.includes('kratki brojevi')) {
        const response = await fetch(`/api/admin/mcp/search-humanitarian-orgs?q=&limit=50`);
        if (response.ok) {
          const data = await response.json();
          const results = data.results || [];
          const content = results.length
            ? results
                .map(
                  (org: any, idx: number) =>
                    `${idx + 1}. ${org.name} - Kratki broj: ${org.shortNumber || 'N/A'}${
                      org.phone ? ` - Telefon: ${org.phone}` : ''
                    }`
                )
                .join('\n')
            : 'Nema pronađenih humanitarnih organizacija sa kratkim brojevima.';
          setMessages([...newMessages, { role: 'assistant', content }]);
        } else {
          setMessages([...newMessages, { role: 'assistant', content: 'Greška pri dohvaćanju humanitarnih organizacija.' }]);
        }
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage
          })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Chat API response:', data);
          
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: data.response || 'Nema odgovora' 
          }]);
        } else {
          const errorData = await response.text();
          console.error('Chat API error:', response.status, errorData);
          setMessages([...newMessages, { 
            role: 'assistant', 
            content: 'Greška, pokušajte ponovo.' 
          }]);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Greška u komunikaciji.' 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center space-y-8">
          <BoxLoader />
          <p className="text-gray-400 text-lg">Učitavam dashboard...</p>
        </div>
      </div>
    );
  }

  const availableTools = toolsUsage.length > 0 
    ? toolsUsage 
    : [
        { name: 'get_active_contracts', count: 0 },
        { name: 'search_providers', count: 0 },
        { name: 'pending_complaints', count: 0 },
        { name: 'system_statistics', count: 0 },
        { name: 'search_humanitarian_orgs', count: 0 }
      ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 space-y-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Dashboard
            </h1>
            <p className="text-lg text-muted-foreground">
              Upravljanje i monitoring AI sistema za upravljanje ugovorima
            </p>
          </div>
          <Button 
            onClick={() => fetchDashboardData(true)} 
            variant="outline" 
            size="lg"
            disabled={refreshing}
            className="shadow-sm hover:shadow-md transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Osvežavam...' : 'Osveži podatke'}
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ukupno upita"
            value={stats?.totalQueries || 0}
            icon={MessageCircle}
            color="default"
          />
          <StatCard
            title="Aktivni korisnici"
            value={health?.users.active || 0}
            subtitle={`od ${health?.users.total || 0} ukupno`}
            icon={Users}
            color="success"
          />
          <StatCard
            title="Aktivni ugovori"
            value={health?.contracts.active || 0}
            subtitle={`od ${health?.contracts.total || 0} ukupno`}
            icon={Database}
            color="default"
          />
          <StatCard
            title="Žalbe na čekanju"
            value={health?.complaints.pending || 0}
            icon={AlertCircle}
            color="warning"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="chat" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 p-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl border">
              <TabsTrigger value="chat" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-sm">
                <Bot className="h-4 w-4" />
                AI Chat
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-sm">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" />
                Logovi
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center gap-2 rounded-lg data-[state=active]:shadow-sm">
                <Settings className="h-4 w-4" />
                Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat">
              <Card className="shadow-xl border-0 bg-white dark:bg-gray-800 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      <Bot className="h-5 w-5" />
                    </div>
                    AI Chat Interface
                  </CardTitle>
                  <CardDescription className="text-base">
                    Testirajte AI funkcionalnosti direktno preko chat interfejsa
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-800/50 dark:to-gray-800">
                    {messages.map((msg, idx) => (
                      <ChatMessage key={`msg-${idx}`} message={msg} index={idx} />
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl px-4 py-3 shadow-sm border">
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                              <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex space-x-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef}></div>
                  </div>
                  <div className="p-6 border-t bg-white dark:bg-gray-800">
                    <div className="flex gap-3">
                      <Input
                        placeholder="Unesite poruku..."
                        value={inputMessage}
                        onChange={e => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        className="flex-1 rounded-xl border-2 focus:border-blue-500 transition-colors"
                      />
                      <Button 
                        onClick={sendMessage} 
                        disabled={chatLoading}
                        size="lg"
                        className="px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        {chatLoading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Pošalji'
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      Najpopularniji tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.topTools && stats.topTools.length > 0 ? (
                        stats.topTools.map((tool, idx) => (
                          <motion.div 
                            key={`topTool-${tool.name}-${idx}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 border hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                <Zap className="h-4 w-4" />
                              </div>
                              <span className="font-medium">{tool.name}</span>
                            </div>
                            <Badge variant="secondary" className="bg-white dark:bg-gray-800 shadow-sm">
                              {tool.count} korišćenja
                            </Badge>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">Nema podataka o tools-ima</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
                        <Activity className="h-5 w-5" />
                      </div>
                      Nedavne aktivnosti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recentActivity?.length ? (
                        stats.recentActivity.map((activity, idx) => (
                          <motion.div
                            key={`activity-${activity.userId}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-4 rounded-xl border bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white">
                                  <CheckCircle className="h-3 w-3" />
                                </div>
                                <div>
                                  <div className="font-medium text-sm">
                                    {activity.toolName} ({activity.count} upita)
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {activity.userName} - {new Date(activity.timestamp).toLocaleString('sr-RS')}
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                Uspešno
                              </Badge>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">Nema nedavnih aktivnosti</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      <Search className="h-5 w-5" />
                    </div>
                    Pretraga logova korisnika
                  </CardTitle>
                  <CardDescription>Pretražite aktivnosti specifičnog korisnika po email adresi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 mb-6">
                    <Input
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Unesite email adresu korisnika..."
                      className="flex-1 rounded-xl"
                    />
                    <Button 
                      onClick={searchUserLogs}
                      className="px-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Pretraži
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {userLogs.length ? (
                      userLogs.map((log, idx) => {
                        let toolName = 'Nepoznat';
                        let args: any = null;

                        try {
                          const details = JSON.parse(log.details || '{}');
                          toolName = details.toolName || 'Nepoznat';
                          args = details.parameters || null;
                        } catch (err) {
                          console.error('Error parsing log details:', err);
                        }

                        return (
                          <motion.div 
                            key={`userLog-${log.id}-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="border rounded-xl p-4 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  <Zap className="h-4 w-4" />
                                </div>
                                <span className="font-medium">{toolName}</span>
                              </div>
                              <span className="text-sm text-muted-foreground bg-white dark:bg-gray-800 px-3 py-1 rounded-full border">
                                {new Date(log.createdAt).toLocaleString('sr-RS')}
                              </span>
                            </div>
                            {args && (
                              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded-lg overflow-auto border">
                                {JSON.stringify(args, null, 2)}
                              </pre>
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Nema pronađenih logova za ovog korisnika</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools">
              <Card className="shadow-lg border-0 bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                      <Settings className="h-5 w-5" />
                    </div>
                    Dostupni MCP Tools
                  </CardTitle>
                  <CardDescription>Pregled svih alata koje AI može koristiti za rad sa bazom</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableTools.map((tool, idx) => (
                      <motion.div 
                        key={`tool-${tool.name}-${idx}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            <Zap className="h-4 w-4" />
                          </div>
                          <div className="font-medium">{tool.name}</div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">Ukupno korišćenja:</p>
                          <Badge variant="outline" className="bg-white dark:bg-gray-800">
                            {tool.count}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}