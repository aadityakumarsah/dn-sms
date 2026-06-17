import { Users, CalendarCheck, DollarSign, Truck } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";

export default function StaffDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Administrative overview</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Staff" value="42" icon={Users} color="orange" />
        <StatCard title="Present Today" value="38" icon={CalendarCheck} change="4 absent" color="green" />
        <StatCard title="Payroll Due" value="NPR 6.8L" icon={DollarSign} color="blue" />
        <StatCard title="Inventory Items" value="156" icon={Truck} color="purple" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Tasks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {["Mark Attendance", "Process Payroll", "Order Supplies", "Generate Report"].map((t) => (
            <button key={t} className="bg-orange-50 text-orange-700 text-sm font-medium rounded-lg px-4 py-3 hover:bg-orange-100 transition-colors text-left">
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
