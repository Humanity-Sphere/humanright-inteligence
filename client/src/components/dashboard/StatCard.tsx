import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  count: number;
  trend: string;
  icon: string;
  color: string;
  iconBg?: string;
  darkIconBg?: string;
  trendColor?: string;
}

export default function StatCard({
  title,
  count,
  trend,
  icon,
  color,
  iconBg = `${color}-100`,
  darkIconBg = `${color}-900/30`,
  trendColor = "green-500"
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${iconBg} dark:bg-${darkIconBg} text-${color}`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold">{count}</p>
            <span className={`ml-2 text-xs text-${trendColor}`}>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
