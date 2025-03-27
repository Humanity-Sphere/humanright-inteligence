import { Link } from "wouter";

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  href: string;
}

export default function QuickAccessCard({ title, description, icon, color, href }: QuickAccessCardProps) {
  let iconBg = "purple-100";
  let darkIconBg = "purple-900/30";
  
  if (color === "primary") {
    iconBg = "blue-100";
    darkIconBg = "blue-900/30";
  } else if (color === "secondary") {
    iconBg = "green-100";
    darkIconBg = "green-900/30";
  } else if (color === "danger") {
    iconBg = "red-100";
    darkIconBg = "red-900/30";
  } else if (color === "accent") {
    iconBg = "yellow-100";
    darkIconBg = "yellow-900/30";
  }
  
  return (
    <Link href={href}>
      <div className="bg-white dark:bg-neutral-800 shadow rounded-lg p-6 flex hover:shadow-md transition-shadow cursor-pointer">
        <div className={`p-3 rounded-full bg-${iconBg} dark:bg-${darkIconBg} text-${color}`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
