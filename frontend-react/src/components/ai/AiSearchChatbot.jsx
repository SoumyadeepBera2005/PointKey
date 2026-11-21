import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function AiSearchChatbot({ onFiltersParsed }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! Tell me what you need — e.g. "Female student looking for single PG with food near Salt Lake under ₹8,500".' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setBusy(true);
    try {
      const aiUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
      const res = await fetch(`${aiUrl}/ai-chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', text: data.reply || 'Here you go.' }]);
      if (data.filters && Object.keys(data.filters).length) {
        if (onFiltersParsed) onFiltersParsed(data.filters);
        else navigate(`/tenant/search?${new URLSearchParams(data.filters).toString()}`);
      }
    } catch {
      // AI service down — degrade to keyword echo with a helpful message
      setMessages((m) => [...m, { role: 'assistant', text: 'AI service is unreachable right now — try the manual filters above.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-card flex h-96 flex-col overflow-hidden bg-beige border border-beige-border shadow-lg">
      <div className="flex items-center gap-2 border-b border-navy-dark/30 bg-navy px-4 py-2.5 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-white"><Bot size={18} /></div>
        <div>
          <p className="text-sm font-bold text-white">pRent AI Assistant</p>
          <p className="text-[10px] text-beige-light/75">Natural-language search &amp; support</p>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 bg-cream/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-forest text-white' : 'bg-white border border-beige-border text-navy'}`}>
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </span>
            <p className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${m.role === 'user' ? 'bg-forest text-white' : 'bg-white border border-beige-border text-slate-800'}`}>{m.text}</p>
          </div>
        ))}
        {busy && <Loader2 className="animate-spin text-forest" size={18} />}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 border-t border-beige-border bg-beige p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ask pRent AI…"
          className="input flex-1 bg-white"
          aria-label="Message the pRent AI assistant"
        />
        <button onClick={send} disabled={busy} className="btn-primary !px-3" aria-label="Send">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
