import { cn } from "@/lib/utils";
import { useState } from "react";
import { Send } from "lucide-react";

const THREADS = [
  {
    id: 1,
    name: "Sita Sharma (Parent)",
    preview: "Thank you sir, I will make sure...",
    time: "10:32 AM",
    unread: 2,
    messages: [
      { from: "them", text: "Namaste sir, I wanted to ask about Aarav's performance in maths this month.", time: "10:15 AM" },
      { from: "me", text: "Namaste! Aarav has been doing well overall. He scored 88 in the last test. However, he needs more practice on quadratic equations.", time: "10:20 AM" },
      { from: "them", text: "Oh that's good to hear. Should we arrange extra tuition for him?", time: "10:28 AM" },
      { from: "me", text: "I have started a weekly revision class on Saturdays. Please send him if possible.", time: "10:30 AM" },
      { from: "them", text: "Thank you sir, I will make sure he attends.", time: "10:32 AM" },
    ],
  },
  {
    id: 2,
    name: "Ram KC (Parent)",
    preview: "He has been missing homework...",
    time: "Yesterday",
    unread: 0,
    messages: [
      { from: "me", text: "Namaste, I am writing regarding Bibek's homework submission. He has missed 3 assignments this month.", time: "Yesterday 2:00 PM" },
      { from: "them", text: "I am very sorry sir. He has been unwell. Can he submit them this week?", time: "Yesterday 3:15 PM" },
      { from: "me", text: "Yes, please have him submit by Falgun 5. No penalty this time.", time: "Yesterday 3:30 PM" },
      { from: "them", text: "He has been missing homework recently, I will talk to him tonight.", time: "Yesterday 4:00 PM" },
    ],
  },
  {
    id: 3,
    name: "Goma Thapa (Parent)",
    preview: "When are the results published?",
    time: "Magh 27",
    unread: 1,
    messages: [
      { from: "them", text: "Sir, Chhaya says the exam results will come out soon. When are the results published?", time: "Magh 27, 11:00 AM" },
      { from: "me", text: "The Second Terminal results will be published by Falgun 10. We will notify all parents via SMS.", time: "Magh 27, 11:20 AM" },
      { from: "them", text: "Thank you sir. She is very anxious about her Science marks.", time: "Magh 27, 11:25 AM" },
    ],
  },
];

export default function Messages() {
  const [selected, setSelected] = useState(THREADS[0]);
  const [input, setInput] = useState("");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500 mt-0.5">Communicate with parents and staff</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex" style={{ height: 560 }}>
        <div className="w-72 border-r border-gray-100 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {THREADS.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={cn(
                  "w-full text-left px-4 py-3.5 hover:bg-gray-50/60 transition-colors",
                  selected.id === t.id && "bg-green-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-400">{t.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{t.preview}</span>
                  {t.unread > 0 && (
                    <span className="ml-2 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
                      {t.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{selected.name}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {selected.messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-sm rounded-2xl px-4 py-2.5 text-sm",
                    msg.from === "me"
                      ? "bg-green-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                >
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1", msg.from === "me" ? "text-green-200" : "text-gray-400")}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={() => setInput("")}
              className="bg-green-600 text-white rounded-xl px-4 py-2 hover:bg-green-700"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
