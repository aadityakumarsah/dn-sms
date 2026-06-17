import { cn } from "@/lib/utils";
import { useState } from "react";
import { Send } from "lucide-react";

const THREADS = [
  {
    id: 1,
    name: "Suresh Paudel (Class Teacher)",
    preview: "He is doing well overall...",
    time: "10:45 AM",
    unread: 1,
    messages: [
      { from: "me", text: "Namaste sir, I wanted to check on Aarav's progress this month. He seemed worried about Math.", time: "10:30 AM" },
      { from: "them", text: "Namaste! Aarav has been performing well. He scored 88 in the last Math test.", time: "10:35 AM" },
      { from: "me", text: "That is a relief. Should we do anything extra at home to support him?", time: "10:38 AM" },
      { from: "them", text: "He is doing well overall. Just encourage regular revision of chapters 5 and 6 on quadratic equations.", time: "10:45 AM" },
    ],
  },
  {
    id: 2,
    name: "Nabin Thapa (Math Teacher)",
    preview: "Please remind him about Saturday class.",
    time: "Yesterday",
    unread: 0,
    messages: [
      { from: "them", text: "Namaste, I am writing to let you know that Aarav missed the Saturday revision class last week.", time: "Yesterday 9:00 AM" },
      { from: "me", text: "I am very sorry sir, he had a family function. Will he miss anything important?", time: "Yesterday 10:00 AM" },
      { from: "them", text: "Not to worry. I have shared notes with the class. Please remind him about the Saturday class this coming week.", time: "Yesterday 10:15 AM" },
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
        <p className="text-sm text-gray-500 mt-0.5">Communicate with teachers</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex" style={{ height: 520 }}>
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
                  selected.id === t.id && "bg-teal-50"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                  <span className="text-xs text-gray-400">{t.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 truncate">{t.preview}</span>
                  {t.unread > 0 && (
                    <span className="ml-2 bg-teal-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center shrink-0">
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
                <div className={cn(
                  "max-w-sm rounded-2xl px-4 py-2.5 text-sm",
                  msg.from === "me"
                    ? "bg-teal-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                )}>
                  <p>{msg.text}</p>
                  <p className={cn("text-xs mt-1", msg.from === "me" ? "text-teal-200" : "text-gray-400")}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button onClick={() => setInput("")} className="bg-teal-600 text-white rounded-xl px-4 py-2 hover:bg-teal-700">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
