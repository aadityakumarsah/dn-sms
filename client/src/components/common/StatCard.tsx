import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  positive?: boolean;
  color?: string;
}

export function StatCard({ title, value, icon: Icon, change, positive, color = "blue" }: StatCardProps) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    teal: "bg-teal-50 text-teal-600",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
    navy: "bg-primary/8 text-primary",
    brandBlue: "bg-secondary/10 text-secondary",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={cn("text-xs mt-1 font-medium", positive ? "text-green-600" : "text-red-500")}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color] ?? colorMap.blue)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
