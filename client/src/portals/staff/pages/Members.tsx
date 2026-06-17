import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const MEMBERS = [
  { name: "Ramesh Dhakal", role: "Accountant", dept: "Finance", phone: "9841234567", joined: "Shrawan 1, 2075", status: "Active" },
  { name: "Sunita Oli", role: "Librarian", dept: "Library", phone: "9852345678", joined: "Bhadra 15, 2076", status: "Active" },
  { name: "Kalu Bahadur Thapa", role: "Peon", dept: "Administration", phone: "9863456789", joined: "Ashadh 10, 2073", status: "Active" },
  { name: "Bikram Bohara", role: "Security", dept: "Security", phone: "9874567890", joined: "Kartik 5, 2078", status: "Active" },
  { name: "Mina Khatri", role: "Lab Assistant", dept: "Science", phone: "9885678901", joined: "Magh 20, 2079", status: "Active" },
  { name: "Hari Prasad Koirala", role: "Peon", dept: "Administration", phone: "9896789012", joined: "Chaitra 1, 2074", status: "Active" },
  { name: "Saraswati Bhandari", role: "Accountant", dept: "Finance", phone: "9807890123", joined: "Jestha 12, 2077", status: "On Leave" },
  { name: "Prakash Sah", role: "Security", dept: "Security", phone: "9818901234", joined: "Poush 8, 2080", status: "Active" },
];

const ROLES = ["Accountant", "Librarian", "Peon", "Security", "Lab Assistant"];

const roleColor = (r: string) => {
  const map: Record<string, string> = {
    Accountant: "bg-blue-50 text-blue-700",
    Librarian: "bg-purple-50 text-purple-700",
    Peon: "bg-gray-100 text-gray-600",
    Security: "bg-amber-50 text-amber-700",
    "Lab Assistant": "bg-teal-50 text-teal-700",
  };
  return map[r] ?? "bg-gray-100 text-gray-600";
};

export default function Members() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Staff Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">Non-teaching staff directory</p>
        </div>
        <button className="bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-orange-600 flex items-center gap-2">
          <Plus size={15} />
          Add Staff
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {ROLES.map((role) => {
          const count = MEMBERS.filter((m) => m.role === role).length;
          return (
            <span key={role} className={cn("text-xs px-3 py-1.5 rounded-xl font-medium", roleColor(role))}>
              {role} ({count})
            </span>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">All Staff ({MEMBERS.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Role", "Department", "Phone", "Join Date", "Status"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEMBERS.map((m, i) => (
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/60">
                <td className="px-5 py-3.5 font-medium text-gray-900">{m.name}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", roleColor(m.role))}>{m.role}</span>
                </td>
                <td className="px-5 py-3.5 text-gray-600">{m.dept}</td>
                <td className="px-5 py-3.5 text-gray-500">{m.phone}</td>
                <td className="px-5 py-3.5 text-gray-500">{m.joined}</td>
                <td className="px-5 py-3.5">
                  <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", m.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
