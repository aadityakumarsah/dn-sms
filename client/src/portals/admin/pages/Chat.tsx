import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Search, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export default function Chat() {
  const [convos, setConvos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [active, setActive] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvos = () => { api.admin.chatMessages().then(setConvos).catch(() => setConvos([])).finally(() => setLoading(false)); };
  useEffect(() => { loadConvos(); api.admin.chatUsers().then(setUsers).catch(() => {}); }, []);

  const openThread = (userId: string, name: string, role: string) => {
    setActive({ userId, name, role }); setShowNew(false);
    api.admin.chatMessages(userId).then(setMessages).catch(() => setMessages([]));
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!text.trim() || !active) return;
    const content = text.trim(); setText("");
    setMessages((m) => [...m, { id: `tmp-${m.length}`, content, mine: true, createdAt: new Date().toISOString() }]);
    await api.admin.sendMessage({ recipientId: active.userId, content });
    api.admin.chatMessages(active.userId).then(setMessages);
    loadConvos();
  };

  const filteredUsers = users.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex" style={{ height: "calc(100vh - 8rem)" }}>
        {/* Sidebar */}
        <div className={cn("w-full sm:w-80 border-r border-gray-100 flex flex-col", active && "hidden sm:flex")}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Messages</h2>
            <button onClick={() => setShowNew((s) => !s)} className="text-xs text-blue-600 hover:underline">{showNew ? "Back" : "New chat"}</button>
          </div>
          {showNew ? (
            <>
              <div className="p-3 border-b border-gray-50">
                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" /></div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredUsers.map((u) => (
                  <button key={u.id} onClick={() => openThread(u.id, u.name, u.role)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50">
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{u.role} · {u.email}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {loading ? <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />)}</div>
                : convos.length === 0 ? <div className="p-8 text-center text-sm text-gray-400">No conversations yet.<br /><button onClick={() => setShowNew(true)} className="text-blue-600 hover:underline mt-2">Start one</button></div>
                : convos.map((c) => (
                  <button key={c.userId} onClick={() => openThread(c.userId, c.name, c.role)}
                    className={cn("w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 flex items-center gap-3", active?.userId === c.userId && "bg-blue-50")}>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{c.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>{c.unread > 0 && <span className="bg-blue-600 text-white text-xs px-1.5 rounded-full">{c.unread}</span>}</div>
                      <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Thread */}
        <div className={cn("flex-1 flex flex-col", !active && "hidden sm:flex")}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <MessageCircle className="w-12 h-12 mb-2" />
              <p className="text-sm">Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                <button onClick={() => setActive(null)} className="sm:hidden text-gray-400"><ArrowLeft className="w-4 h-4" /></button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">{active.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}</div>
                <div><p className="text-sm font-semibold text-gray-900">{active.name}</p><p className="text-xs text-gray-400 capitalize">{active.role}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50/50">
                {messages.length === 0 ? <p className="text-center text-sm text-gray-400 mt-8">No messages yet. Say hello 👋</p>
                  : messages.map((m) => (
                    <div key={m.id} className={cn("flex", m.mine ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[70%] px-3 py-2 rounded-2xl text-sm", m.mine ? "bg-blue-600 text-white rounded-br-sm" : "bg-white border border-gray-100 text-gray-700 rounded-bl-sm")}>
                        {m.content}
                        <div className={cn("text-[10px] mt-0.5", m.mine ? "text-blue-100" : "text-gray-400")}>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                      </div>
                    </div>
                  ))}
                <div ref={endRef} />
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                  placeholder="Type a message…" className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
                <button onClick={send} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Send className="w-4 h-4" /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
