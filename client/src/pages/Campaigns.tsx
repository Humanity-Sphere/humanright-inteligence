import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Campaign, InsertCampaign } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form schema for campaign creation
const campaignFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(["planning", "active", "drafting", "completed", "archived"]),
  progress: z.number().min(0).max(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  participants: z.number().min(0)
});

type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export default function Campaigns() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Fetch campaigns
  const { 
    data: campaigns,
    isLoading
  } = useQuery<Campaign[]>({
    queryKey: ['/api/campaigns'],
  });
  
  // Create campaign mutation
  const createCampaign = useMutation({
    mutationFn: async (campaign: Omit<InsertCampaign, "userId">) => {
      const response = await apiRequest("POST", "/api/campaigns", campaign);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Create form
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "planning",
      progress: 0,
      participants: 0,
    },
  });
  
  // Handle form submission
  function onSubmit(values: CampaignFormValues) {
    createCampaign.mutate({
      ...values,
      startDate: values.startDate ? new Date(values.startDate) : undefined,
      endDate: values.endDate ? new Date(values.endDate) : undefined,
    });
  }
  
  // Group campaigns by status
  const activeCampaigns = campaigns?.filter(c => c.status === "active") || [];
  const plannedCampaigns = campaigns?.filter(c => c.status === "planning") || [];
  const draftCampaigns = campaigns?.filter(c => c.status === "drafting") || [];
  const completedCampaigns = campaigns?.filter(c => c.status === "completed") || [];
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">Organize and track your advocacy campaigns</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4 md:mt-0">
          <span className="material-icons mr-2 text-sm">add_circle</span>
          New Campaign
        </Button>
      </div>
      
      <Tabs defaultValue="active" className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="drafting">Drafting</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-2 w-full mb-1" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : activeCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">campaign</span>
              <h3 className="text-lg font-medium">No active campaigns</h3>
              <p className="text-muted-foreground">Start a new campaign or activate one from planning</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="planning" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-2 w-full mb-1" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : plannedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">event</span>
              <h3 className="text-lg font-medium">No planned campaigns</h3>
              <p className="text-muted-foreground">Create a new campaign to start planning</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plannedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="drafting" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-2 w-full mb-1" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : draftCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">edit_note</span>
              <h3 className="text-lg font-medium">No draft campaigns</h3>
              <p className="text-muted-foreground">Campaigns in drafting stage will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-4" />
                    <Skeleton className="h-2 w-full mb-1" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-8 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : completedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-icons text-4xl text-muted-foreground mb-2">task_alt</span>
              <h3 className="text-lg font-medium">No completed campaigns</h3>
              <p className="text-muted-foreground">Completed campaigns will be listed here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Campaign Resources</CardTitle>
          <CardDescription>Templates and assets to help you run successful campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Press Release Template</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Standard structure for effective press releases with example content.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Social Media Kit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Templates for social media posts, graphics, and hashtag strategies.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Campaign Planning Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Step-by-step guide to planning and executing effective campaigns.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  <span className="material-icons mr-1 text-sm">download</span>
                  Download
                </Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>
      
      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Set up a new advocacy campaign with goals, timeline, and resources.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the campaign objectives and approach" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="drafting">Drafting</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress (%)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Participants</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCampaign.isPending}>
                  {createCampaign.isPending && (
                    <span className="material-icons animate-spin mr-2 text-sm">refresh</span>
                  )}
                  Create Campaign
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Campaign card component
function CampaignCard({ campaign }: { campaign: Campaign }) {
  // Update campaign mutation
  const updateCampaign = useMutation({
    mutationFn: async (updatedCampaign: Partial<Campaign>) => {
      const response = await apiRequest("PATCH", `/api/campaigns/${campaign.id}`, updatedCampaign);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/campaigns'] });
      toast({
        title: "Campaign updated",
        description: "The campaign was successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update campaign: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleStatusUpdate = (status: string) => {
    updateCampaign.mutate({ status: status as Campaign["status"] });
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "planning":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "drafting":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "archived":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };
  
  const getDaysMessage = () => {
    if (!campaign.endDate) return "No end date set";
    
    const today = new Date();
    const endDate = new Date(campaign.endDate);
    
    const differenceInTime = endDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    if (differenceInDays < 0) {
      return `Ended ${Math.abs(differenceInDays)} days ago`;
    } else if (differenceInDays === 0) {
      return "Ends today";
    } else {
      return `Ends in ${differenceInDays} days`;
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle>{campaign.title}</CardTitle>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(campaign.status)}`}>
            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
          </span>
        </div>
        <CardDescription>{campaign.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mt-3">
          <div className="flex items-center">
            <span className="text-xs text-neutral-500">Progress</span>
            <span className="ml-auto text-xs font-medium">{campaign.progress}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2 mt-1">
            <div className={`${getProgressColor(campaign.progress)} h-2 rounded-full`} style={{ width: `${campaign.progress}%` }}></div>
          </div>
        </div>
        <div className="mt-3 flex items-center text-xs text-neutral-500">
          <span className="material-icons text-sm mr-1">calendar_today</span>
          <span>{getDaysMessage()}</span>
          <span className="ml-auto flex items-center">
            <span className="material-icons text-sm mr-1">person</span>
            <span>{campaign.participants} participants</span>
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-neutral-500">Start:</span> {formatDate(campaign.startDate)}
          </div>
          <div>
            <span className="text-neutral-500">End:</span> {formatDate(campaign.endDate)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Select 
          defaultValue={campaign.status}
          onValueChange={handleStatusUpdate}
          disabled={updateCampaign.isPending}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="drafting">Drafting</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm">
          <span className="material-icons mr-1 text-sm">visibility</span>
          Details
        </Button>
      </CardFooter>
    </Card>
  );
}
