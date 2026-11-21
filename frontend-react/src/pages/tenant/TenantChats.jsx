import { useEffect, useState } from 'react';
import Navbar from '../../components/common/Navbar';
import BottomNav from '../../components/common/BottomNav';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { MessageCircle } from 'lucide-react';

export default function TenantChats() {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  // Demo conversation: Rahul (seed owner) about seed property R01
  const propertyId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const ownerId = '22222222-2222-2222-2222-222222222222';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!socket || !user) return undefined;
    socket.emit('join:property', { propertyId });
    socket.emit('message:history', { propertyId, withUserId: ownerId });
    const onHistory = ({ messages: rows }) => setMessages(rows.map((r) => ({ from: r.sender_id === user.id ? 'me' : 'them', text: r.message, at: r.created_at })));
    const onNew = (m) => { if (m.propertyId === propertyId) setMessages((prev) => [...prev, { from: m.senderId === user.id ? 'me' : 'them', text: m.message, at: m.createdAt }]); };
    socket.on('message:history', onHistory);
    socket.on('message:new', onNew);
    return () => { socket.off('message:history', onHistory); socket.off('message:new', onNew); };
  }, [socket, user]);

  const send = () => {
    const text = input.trim();
    if (!text || !socket) return;
    socket.emit('message:send', { propertyId, receiverId: ownerId, message: text });
    setInput('');
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface pb-20 md:pb-0">
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-trust font-black text-white">R</div>
            <div>
              <p className="font-bold text-slate-800">Rahul Sharma</p>
              <p className="text-[11px] text-slate-400">Owner · “Cozy Single Room in Salt Lake” (R01)</p>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />{connected ? 'Live' : 'Offline'}
          </span>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto py-4" style={{ maxHeight: '55vh' }}>
          {messages.length === 0 && <p className="pt-8 text-center text-xs text-slate-400">Say hello to the owner 👋</p>}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <p className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${m.from === 'me' ? 'rounded-br-md bg-trust text-white' : 'rounded-bl-md bg-white text-slate-700'}`}>{m.text}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message…" className="input flex-1" aria-label="Chat message" />
          <button onClick={send} className="btn-primary !px-4" aria-label="Send"><MessageCircle size={18} /></button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
