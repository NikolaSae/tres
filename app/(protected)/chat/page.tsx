// app/chat/page.tsx
import ChatBox from '@/components/ChatBox'; // ili '../components/ChatBox' ako nije pod 'src/app'

export default function ChatPage() {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat sa AI</h1>
      <ChatBox />
    </div>
  );
}
