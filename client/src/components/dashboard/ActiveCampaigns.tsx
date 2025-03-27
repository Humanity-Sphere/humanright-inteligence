import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function ActiveCampaigns() {
  const { data: campaigns, isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });

  return (
    <div className="lg:col-span-1 bg-white dark:bg-neutral-800 rounded-lg shadow">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
        <h2 className="text-lg font-heading font-medium">Active Campaigns</h2>
        <Link href="/campaigns">
          <button className="text-primary hover:text-primary-dark">
            <span className="material-icons">add_circle</span>
          </button>
        </Link>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="mt-3">
                  <div className="flex items-center">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </div>
                  <Skeleton className="h-2 w-full mt-1" />
                </div>
                <div className="mt-3 flex items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : !campaigns || campaigns.length === 0 ? (
          <div className="text-center py-6">
            <span className="material-icons text-4xl text-neutral-400 dark:text-neutral-600">campaign</span>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">No active campaigns</p>
            <Link href="/campaigns">
              <Button className="mt-4">Create Campaign</Button>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {campaigns.slice(0, 3).map((campaign) => (
              <li key={campaign.id} className="bg-neutral-50 dark:bg-neutral-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{campaign.title}</h3>
                  <span className={`
                    text-xs px-2 py-1 rounded-full
                    ${campaign.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                      campaign.status === 'planning' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                      campaign.status === 'drafting' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}
                  `}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex items-center">
                    <span className="text-xs text-neutral-500">Progress</span>
                    <span className="ml-auto text-xs font-medium">{campaign.progress}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2 mt-1">
                    <div className={`
                      h-2 rounded-full
                      ${campaign.status === 'active' ? 'bg-secondary' : 
                        campaign.status === 'planning' ? 'bg-primary' : 
                        campaign.status === 'drafting' ? 'bg-purple-500' : 
                        'bg-gray-500'}
                    `} style={{ width: `${campaign.progress}%` }}></div>
                  </div>
                </div>
                <div className="mt-3 flex items-center text-xs text-neutral-500">
                  <span className="material-icons text-sm mr-1">calendar_today</span>
                  <span>
                    {campaign.endDate 
                      ? `Ends in ${Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'No end date'}
                  </span>
                  <span className="ml-auto flex items-center">
                    <span className="material-icons text-sm mr-1">person</span>
                    <span>{campaign.participants} participants</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        
        <Link href="/campaigns">
          <button className="mt-4 w-full py-2 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-sm">
            View All Campaigns
          </button>
        </Link>
      </div>
    </div>
  );
}
