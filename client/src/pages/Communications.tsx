import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export default function Communications() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ id: number; sender: string; text: string; timestamp: Date; isUser: boolean }[]>([
    { id: 1, sender: "Elena Rodriguez", text: "Hello, I've shared some documents with you about the new water rights case.", timestamp: new Date(Date.now() - 3600000), isUser: false },
    { id: 2, sender: "You", text: "Thanks, Elena. I'll take a look at them and get back to you with my thoughts.", timestamp: new Date(Date.now() - 3000000), isUser: true },
    { id: 3, sender: "Elena Rodriguez", text: "Great! Let me know if you need any additional information or context.", timestamp: new Date(Date.now() - 600000), isUser: false },
  ]);
  
  // Fetch user info
  const { data: user } = useQuery({
    queryKey: ['/api/user/current'],
  });
  
  const sendMessage = () => {
    if (!message.trim()) return;
    
    setMessages([
      ...messages,
      { id: messages.length + 1, sender: "You", text: message, timestamp: new Date(), isUser: true }
    ]);
    setMessage("");
    
    // Simulate a response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: prev.length + 1, 
          sender: "Elena Rodriguez", 
          text: "I received your message. I'll respond as soon as possible.", 
          timestamp: new Date(), 
          isUser: false 
        }
      ]);
    }, 1500);
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleStartMeeting = () => {
    toast({
      title: "Feature in development",
      description: "Video conferencing will be available in a future update.",
    });
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secure Communications</h1>
          <p className="text-muted-foreground">Encrypted chat, forums and video conferencing</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button onClick={handleStartMeeting}>
            <span className="material-icons mr-2 text-sm">videocam</span>
            Start Meeting
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Your secure communication channels</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border-b">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-neutral-400 text-sm">search</span>
                </span>
                <Input placeholder="Search contacts..." className="pl-10 rounded-none border-x-0" />
              </div>
            </div>
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30">
                <div className="flex items-center">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Elena Rodriguez" className="h-10 w-10 rounded-full" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Elena Rodriguez</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Online</p>
                  </div>
                  <div className="ml-auto flex items-center">
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">2</span>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer">
                <div className="flex items-center">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Marcus Chen" className="h-10 w-10 rounded-full" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-neutral-300 rounded-full border-2 border-white dark:border-neutral-800"></span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Marcus Chen</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Away</p>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer">
                <div className="flex items-center">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Aisha Johnson" className="h-10 w-10 rounded-full" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Aisha Johnson</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Online</p>
                  </div>
                </div>
              </div>
              <div className="p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 cursor-pointer">
                <div className="flex items-center">
                  <div className="relative">
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="David Kim" className="h-10 w-10 rounded-full" />
                    <span className="absolute bottom-0 right-0 h-3 w-3 bg-neutral-300 rounded-full border-2 border-white dark:border-neutral-800"></span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">David Kim</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Last seen 2h ago</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="outline" className="w-full">
              <span className="material-icons mr-2 text-sm">person_add</span>
              Add Contact
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-3 h-[600px] flex flex-col">
          <CardHeader className="border-b px-4 py-3">
            <div className="flex items-center">
              <div className="relative">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-1.2.1&auto=format&fit=crop&w=100&q=80" alt="Elena Rodriguez" className="h-10 w-10 rounded-full" />
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-neutral-800"></span>
              </div>
              <div className="ml-3">
                <CardTitle className="text-md">Elena Rodriguez</CardTitle>
                <CardDescription className="text-xs">Human Rights Lawyer • Online</CardDescription>
              </div>
              <div className="ml-auto flex space-x-2">
                <Button variant="ghost" size="icon" onClick={handleStartMeeting}>
                  <span className="material-icons">videocam</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleStartMeeting}>
                  <span className="material-icons">call</span>
                </Button>
                <Button variant="ghost" size="icon">
                  <span className="material-icons">more_vert</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <Tabs defaultValue="chat" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-2 mb-0">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col p-4 overflow-hidden data-[state=active]:flex">
              <div className="flex-1 overflow-y-auto space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${msg.isUser ? 'bg-primary text-white' : 'bg-neutral-100 dark:bg-neutral-700'} rounded-lg px-4 py-2`}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{msg.sender}</span>
                        <span className="text-xs opacity-75">{formatTime(msg.timestamp)}</span>
                      </div>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex items-end gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                  <span className="material-icons">add</span>
                </Button>
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a secure message..."
                    className="pr-10"
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full aspect-square" disabled={!message}>
                    <span className="material-icons">sentiment_satisfied</span>
                  </Button>
                </div>
                <Button onClick={sendMessage} disabled={!message} className="rounded-full" size="icon">
                  <span className="material-icons">send</span>
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="p-4 data-[state=active]:flex flex-col flex-1">
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <span className="material-icons text-neutral-400 text-5xl mb-4">folder_shared</span>
                <h3 className="text-lg font-medium">Shared Files</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
                  Documents shared between you and Elena will appear here. All files are end-to-end encrypted.
                </p>
                <Button className="mt-4">
                  <span className="material-icons mr-2 text-sm">upload_file</span>
                  Share a Document
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="tasks" className="p-4 data-[state=active]:flex flex-col flex-1">
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <span className="material-icons text-neutral-400 text-5xl mb-4">task_alt</span>
                <h3 className="text-lg font-medium">Collaborative Tasks</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-sm mt-2">
                  Create and track shared tasks for your collaborative projects.
                </p>
                <Button className="mt-4">
                  <span className="material-icons mr-2 text-sm">add_task</span>
                  Create New Task
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <CardFooter className="border-t p-2 text-xs text-neutral-500 flex justify-between items-center">
            <div className="flex items-center">
              <span className="material-icons text-green-500 text-sm mr-1">lock</span>
              End-to-end encrypted
            </div>
            <div>All messages are securely stored</div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Forums</CardTitle>
            <CardDescription>Secure discussion groups</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Water Rights Coalition</h3>
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">32 members • 12 new posts</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Legal Defense Network</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded-full">
                    Private
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">18 members • 5 new posts</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Forums
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Encrypted Video</CardTitle>
            <CardDescription>Secure video conferencing</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="font-medium">Weekly Team Meeting</h3>
                <p className="text-xs text-neutral-500 mt-1">Scheduled for today, 3:00 PM</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleStartMeeting}>
                Join
              </Button>
            </div>
            <div className="mt-2 text-center p-3">
              <Button onClick={handleStartMeeting} className="w-full">
                <span className="material-icons mr-2">videocam</span>
                Start New Meeting
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full text-xs text-neutral-500 text-center">
              All video calls are end-to-end encrypted
            </div>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Security Status</CardTitle>
            <CardDescription>Your communication security</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              <div className="py-2 flex justify-between">
                <span className="text-sm">Encryption</span>
                <span className="flex items-center text-green-500 text-sm">
                  <span className="material-icons text-sm mr-1">check_circle</span>
                  Active
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-sm">Last Security Audit</span>
                <span className="text-sm">May 15, 2023</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-sm">2FA Authentication</span>
                <span className="flex items-center text-green-500 text-sm">
                  <span className="material-icons text-sm mr-1">check_circle</span>
                  Enabled
                </span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-sm">Trusted Devices</span>
                <span className="text-sm">3 devices</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Security Settings
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
