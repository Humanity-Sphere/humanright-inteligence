import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Training() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleStartCourse = () => {
    toast({
      title: "Course started",
      description: "You've been enrolled in this training module."
    });
  };

  const handleDownload = () => {
    toast({
      title: "Download started",
      description: "Your training materials are being prepared for download."
    });
  };

  const handleCertificate = () => {
    toast({
      title: "Certificate generated",
      description: "Your certificate has been generated and added to your profile."
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training & Education</h1>
          <p className="text-muted-foreground">Build skills and knowledge for effective advocacy</p>
        </div>
        <div className="relative mt-4 md:mt-0 w-full md:w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="material-icons text-neutral-400 text-sm">search</span>
          </span>
          <Input
            placeholder="Search training materials..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Featured Learning Path */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Human Rights Defender Certification</CardTitle>
              <CardDescription>Comprehensive training path for advocacy and protection</CardDescription>
            </div>
            <Badge className="bg-primary ml-2">Featured</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2">
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                This comprehensive learning path covers the essential knowledge and skills needed for effective human rights advocacy. Complete all modules to earn your certification as a Human Rights Defender.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary mr-3 mt-1">
                    <span className="material-icons">schedule</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Duration</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      8 modules • Approximately 20 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary mr-3 mt-1">
                    <span className="material-icons">verified</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Certification</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Digital certificate upon completion
                    </p>
                  </div>
                </div>
              </div>
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm">35%</span>
                </div>
                <Progress value={35} className="h-2" />
              </div>
            </div>
            <div className="flex flex-col justify-between">
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="material-icons text-green-500 mr-2 text-sm">check_circle</span>
                  <span>Introduction to Human Rights</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 mr-2 text-sm">check_circle</span>
                  <span>Digital Security Basics</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-green-500 mr-2 text-sm">check_circle</span>
                  <span>Documentation Techniques</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-neutral-400 mr-2 text-sm">circle</span>
                  <span className="text-neutral-500">Advocacy Strategies</span>
                </div>
                <div className="flex items-center">
                  <span className="material-icons text-neutral-400 mr-2 text-sm">circle</span>
                  <span className="text-neutral-500">International Mechanisms</span>
                </div>
              </div>
              <Button onClick={handleStartCourse} className="mt-4">
                <span className="material-icons mr-2 text-sm">play_arrow</span>
                Continue Learning
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Categories */}
      <Tabs defaultValue="courses" className="w-full mb-8">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="workshops">Workshops</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Digital Security for Activists</CardTitle>
                  <span className="material-icons text-primary">security</span>
                </div>
                <CardDescription>Intermediate • 4 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Learn essential digital security practices to protect your work and communications from surveillance and attacks.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Security</Badge>
                  <Badge variant="secondary">Digital</Badge>
                  <Badge variant="secondary">Protection</Badge>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-neutral-500">Progress</span>
                    <span className="text-xs">0%</span>
                  </div>
                  <Progress value={0} className="h-1" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleStartCourse}>
                  <span className="material-icons mr-1 text-sm">play_arrow</span>
                  Start
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documentation of Human Rights Violations</CardTitle>
                  <span className="material-icons text-primary">fact_check</span>
                </div>
                <CardDescription>Advanced • 6 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Comprehensive guide to documenting human rights violations with proper techniques and methodology.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Documentation</Badge>
                  <Badge variant="secondary">Evidence</Badge>
                  <Badge variant="secondary">Field Work</Badge>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-neutral-500">Progress</span>
                    <span className="text-xs">65%</span>
                  </div>
                  <Progress value={65} className="h-1" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleStartCourse}>
                  <span className="material-icons mr-1 text-sm">play_arrow</span>
                  Continue
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Strategic Litigation</CardTitle>
                  <span className="material-icons text-primary">gavel</span>
                </div>
                <CardDescription>Advanced • 8 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Learn how to develop and execute strategic litigation to advance human rights through legal systems.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Legal</Badge>
                  <Badge variant="secondary">Strategy</Badge>
                  <Badge variant="secondary">Courts</Badge>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-neutral-500">Progress</span>
                    <span className="text-xs">0%</span>
                  </div>
                  <Progress value={0} className="h-1" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleStartCourse}>
                  <span className="material-icons mr-1 text-sm">play_arrow</span>
                  Start
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="workshops" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Digital Storytelling Workshop</CardTitle>
                  <Badge className="bg-blue-500">Live</Badge>
                </div>
                <CardDescription>June 15, 2023 • 2 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Create compelling digital stories for advocacy campaigns using multimedia tools and platforms.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">person</span>
                  <span>Maria Gonzalez, Digital Media Specialist</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">people</span>
                  <span>45 participants registered</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <span className="material-icons mr-2 text-sm">event</span>
                  Register
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Crisis Response Planning</CardTitle>
                  <Badge className="bg-green-500">Upcoming</Badge>
                </div>
                <CardDescription>July 8, 2023 • 3 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Develop protocols and procedures for responding to human rights emergencies and crises.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">person</span>
                  <span>Dr. James Kibo, Emergency Response Expert</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">people</span>
                  <span>32 participants registered</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <span className="material-icons mr-2 text-sm">event</span>
                  Register
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fundraising for Rights Organizations</CardTitle>
                  <Badge className="bg-purple-500">Recording</Badge>
                </div>
                <CardDescription>May 20, 2023 • 2.5 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Strategies and techniques for sustainable fundraising for human rights organizations.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">person</span>
                  <span>Alicia Thompson, Development Director</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-neutral-500 mr-2 text-sm">people</span>
                  <span>78 participants attended</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <span className="material-icons mr-2 text-sm">play_circle</span>
                  Watch Recording
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Field Guides</CardTitle>
                <CardDescription>Practical handbooks and manuals</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">description</span>
                    <div>
                      <p className="text-sm font-medium">Interviewing Survivors of Trauma</p>
                      <p className="text-xs text-neutral-500">PDF • 42 pages</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">description</span>
                    <div>
                      <p className="text-sm font-medium">Digital Evidence Collection</p>
                      <p className="text-xs text-neutral-500">PDF • 36 pages</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">description</span>
                    <div>
                      <p className="text-sm font-medium">Protest Monitoring Field Guide</p>
                      <p className="text-xs text-neutral-500">PDF • 28 pages</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Field Guides
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Video Tutorials</CardTitle>
                <CardDescription>Step-by-step visual guides</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">videocam</span>
                    <div>
                      <p className="text-sm font-medium">Secure Communication Tools</p>
                      <p className="text-xs text-neutral-500">Video • 18 minutes</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <span className="material-icons text-sm">play_arrow</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">videocam</span>
                    <div>
                      <p className="text-sm font-medium">Using Maps for Advocacy</p>
                      <p className="text-xs text-neutral-500">Video • 24 minutes</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <span className="material-icons text-sm">play_arrow</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">videocam</span>
                    <div>
                      <p className="text-sm font-medium">Risk Assessment Methodology</p>
                      <p className="text-xs text-neutral-500">Video • 22 minutes</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <span className="material-icons text-sm">play_arrow</span>
                    </Button>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Video Tutorials
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Templates & Tools</CardTitle>
                <CardDescription>Ready-to-use resources</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">file_present</span>
                    <div>
                      <p className="text-sm font-medium">Security Incident Log Template</p>
                      <p className="text-xs text-neutral-500">XLSX • Spreadsheet</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">file_present</span>
                    <div>
                      <p className="text-sm font-medium">Witness Interview Form</p>
                      <p className="text-xs text-neutral-500">DOCX • Word document</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                  <li className="flex items-start">
                    <span className="material-icons text-primary mr-2 text-sm mt-0.5">file_present</span>
                    <div>
                      <p className="text-sm font-medium">Advocacy Campaign Planner</p>
                      <p className="text-xs text-neutral-500">PDF • Fillable form</p>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-auto" onClick={handleDownload}>
                      <span className="material-icons text-sm">download</span>
                    </Button>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  View All Templates
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Introduction to Human Rights</CardTitle>
                  <span className="material-icons text-green-500">verified</span>
                </div>
                <CardDescription>Completed on May 12, 2023</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Fundamental concepts and principles of international human rights law and advocacy.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-green-500 mr-2 text-sm">grade</span>
                  <span>Score: 92%</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-green-500 mr-2 text-sm">schedule</span>
                  <span>Time spent: 4.5 hours</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleCertificate}>
                  <span className="material-icons mr-1 text-sm">verified</span>
                  Certificate
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Digital Security Basics</CardTitle>
                  <span className="material-icons text-green-500">verified</span>
                </div>
                <CardDescription>Completed on April 28, 2023</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Essential practices for maintaining digital security for human rights work.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-green-500 mr-2 text-sm">grade</span>
                  <span>Score: 88%</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-green-500 mr-2 text-sm">schedule</span>
                  <span>Time spent: 3 hours</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleCertificate}>
                  <span className="material-icons mr-1 text-sm">verified</span>
                  Certificate
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Documentation Techniques</CardTitle>
                  <span className="material-icons text-green-500">verified</span>
                </div>
                <CardDescription>Completed on March 15, 2023</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
                  Basic methods and standards for documenting human rights violations.
                </p>
                <div className="flex items-center text-sm mb-2">
                  <span className="material-icons text-green-500 mr-2 text-sm">grade</span>
                  <span>Score: 95%</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="material-icons text-green-500 mr-2 text-sm">schedule</span>
                  <span>Time spent: 5 hours</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleDownload}>
                  <span className="material-icons mr-1 text-sm">download</span>
                  Materials
                </Button>
                <Button onClick={handleCertificate}>
                  <span className="material-icons mr-1 text-sm">verified</span>
                  Certificate
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Learning Support</CardTitle>
            <CardDescription>Get help with your training needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary mr-3">
                  <span className="material-icons">support_agent</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Personal Mentoring</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Connect with experienced human rights defenders for one-on-one guidance and advice
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary hover:text-primary-dark mt-1">
                    Request a mentor
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-secondary mr-3">
                  <span className="material-icons">groups</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Study Groups</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Join or create collaborative learning groups for shared knowledge and support
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary hover:text-primary-dark mt-1">
                    Find a study group
                  </Button>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 mr-3">
                  <span className="material-icons">chat</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium">Expert Consultation</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Schedule video calls with subject matter experts on specific human rights topics
                  </p>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary hover:text-primary-dark mt-1">
                    Book a consultation
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Learning Statistics</CardTitle>
            <CardDescription>Track your educational progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Courses Completed</h4>
                <p className="font-medium text-2xl mt-1">7</p>
                <p className="text-xs text-green-500">+3 this quarter</p>
              </div>
              <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-lg">
                <h4 className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">Total Learning Hours</h4>
                <p className="font-medium text-2xl mt-1">42</p>
                <p className="text-xs text-green-500">12.5 hours this month</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium mb-2">Skills Developed</h3>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Documentation</span>
                  <span className="text-xs">Advanced</span>
                </div>
                <Progress value={85} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Digital Security</span>
                  <span className="text-xs">Intermediate</span>
                </div>
                <Progress value={65} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Legal Knowledge</span>
                  <span className="text-xs">Basic</span>
                </div>
                <Progress value={40} className="h-1" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs">Advocacy Strategies</span>
                  <span className="text-xs">Intermediate</span>
                </div>
                <Progress value={60} className="h-1" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View Complete Learning Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
