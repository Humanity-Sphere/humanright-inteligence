import { Activity } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-6">
        <span className="material-icons text-4xl text-neutral-400 dark:text-neutral-600">history</span>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">No recent activities</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "analysis":
        return { icon: "smart_toy", bgClass: "bg-info/10", textClass: "text-info" };
      case "campaign":
        return { icon: "campaign", bgClass: "bg-secondary/10", textClass: "text-secondary" };
      case "share":
        return { icon: "people", bgClass: "bg-primary/10", textClass: "text-primary" };
      case "alert":
        return { icon: "warning", bgClass: "bg-accent/10", textClass: "text-accent" };
      case "upload":
        return { icon: "upload_file", bgClass: "bg-purple-500/10", textClass: "text-purple-500" };
      case "content":
        return { icon: "article", bgClass: "bg-green-500/10", textClass: "text-green-500" };
      default:
        return { icon: "info", bgClass: "bg-neutral-500/10", textClass: "text-neutral-500" };
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return "just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityDate.toLocaleDateString();
    }
  };

  return (
    <ul className="space-y-4">
      {activities.map((activity) => {
        const { icon, bgClass, textClass } = getActivityIcon(activity.type);
        const timeAgo = formatTimeAgo(activity.createdAt);
        const metadata = activity.metadata as any;
        
        return (
          <li key={activity.id} className={`border-l-2 ${activity.type === 'analysis' ? 'border-info' : activity.type === 'campaign' ? 'border-secondary' : activity.type === 'share' ? 'border-primary' : 'border-accent'} pl-4 pb-4`}>
            <div className="flex items-start">
              <span className={`${bgClass} ${textClass} p-1 rounded`}>
                <span className="material-icons">{icon}</span>
              </span>
              <div className="ml-3">
                <p className="text-sm">
                  <span className="font-medium">{activity.description}</span>
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {metadata?.detailText || ""}
                </p>
                <div className="flex mt-2">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-primary hover:text-primary-dark mr-3">
                    {activity.type === 'analysis' ? 'View Analysis' : 
                     activity.type === 'campaign' ? 'View Campaign' : 
                     activity.type === 'share' ? 'Review Documents' : 'View Details'}
                  </Button>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
                    {activity.type === 'analysis' ? 'Generate Report' : 
                     activity.type === 'campaign' ? 'Share Content' : 
                     activity.type === 'share' ? 'Send Message' : 'Dismiss'}
                  </Button>
                </div>
              </div>
              <span className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
                {timeAgo}
              </span>
            </div>
          </li>
        );
      })}
      
      <div className="mt-4 text-center">
        <Button variant="link" className="text-sm text-primary hover:text-primary-dark font-medium">
          View All Activity
        </Button>
      </div>
    </ul>
  );
}
