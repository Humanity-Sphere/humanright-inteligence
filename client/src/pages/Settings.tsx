import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const [appearanceTab, setAppearanceTab] = useState('dark');
  const [languageSettings, setLanguageSettings] = useState({ 
    appLanguage: 'de', 
    contentLanguage: 'auto'
  });
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    dataEncryption: true,
    sessionTimeout: '30m'
  });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    documentAlerts: true,
    securityAlerts: true,
    campaignUpdates: true
  });

  const handleSaveSettings = () => {
    toast({
      title: "Einstellungen gespeichert",
      description: "Ihre Einstellungen wurden erfolgreich aktualisiert.",
    });
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
        <p className="text-muted-foreground">Verwalten Sie Ihre Konto- und Anwendungseinstellungen</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="appearance">Erscheinungsbild</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profil</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Profilinformationen und Präferenzen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Vollständiger Name</Label>
                  <Input id="fullName" defaultValue={user?.fullName} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Benutzername</Label>
                  <Input id="username" defaultValue={user?.username} disabled />
                  <p className="text-sm text-muted-foreground">
                    Der Benutzername kann nicht geändert werden.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input id="email" type="email" defaultValue={user?.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rolle</Label>
                  <Select defaultValue={user?.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Rolle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="researcher">Forscher</SelectItem>
                      <SelectItem value="activist">Aktivist</SelectItem>
                      <SelectItem value="lawyer">Anwalt</SelectItem>
                      <SelectItem value="journalist">Journalist</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organisation</Label>
                  <Input id="organization" defaultValue={user?.organization || ''} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Select defaultValue={user?.country || 'de'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Land auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="de">Deutschland</SelectItem>
                      <SelectItem value="at">Österreich</SelectItem>
                      <SelectItem value="ch">Schweiz</SelectItem>
                      <SelectItem value="other">Anderes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografie</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Erzählen Sie etwas über sich selbst und Ihre Arbeit" 
                  defaultValue={user?.bio || ''}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Expertise</CardTitle>
              <CardDescription>
                Geben Sie Ihre Fachgebiete und Interessenbereiche an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Fachgebiete</Label>
                <div className="flex flex-wrap gap-2">
                  {['Menschenrechte', 'Digitale Rechte', 'Umweltrecht', 'Frauenrechte', 'Kinderrechte', 'Pressefreiheit', 'Flüchtlingsrechte'].map((tag) => (
                    <div 
                      key={tag}
                      className={`px-3 py-1 rounded-full text-sm ${
                        (user?.expertise || []).includes(tag.toLowerCase()) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      } cursor-pointer hover:opacity-90`}
                    >
                      {tag}
                    </div>
                  ))}
                  <div className="px-3 py-1 rounded-full text-sm border border-dashed border-muted-foreground text-muted-foreground cursor-pointer hover:opacity-90">
                    + Neues Fachgebiet
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erscheinungsbild</CardTitle>
              <CardDescription>
                Passen Sie das Aussehen der Anwendung an Ihre Vorlieben an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Thema</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${appearanceTab === 'light' ? 'border-primary' : 'border-border'}`}
                    onClick={() => setAppearanceTab('light')}
                  >
                    <div className="h-20 bg-white rounded-md mb-2 border"></div>
                    <span className="text-sm font-medium">Hell</span>
                  </div>
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${appearanceTab === 'dark' ? 'border-primary' : 'border-border'}`}
                    onClick={() => setAppearanceTab('dark')}
                  >
                    <div className="h-20 bg-neutral-900 rounded-md mb-2 border border-neutral-800"></div>
                    <span className="text-sm font-medium">Dunkel</span>
                  </div>
                  <div 
                    className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${appearanceTab === 'system' ? 'border-primary' : 'border-border'}`}
                    onClick={() => setAppearanceTab('system')}
                  >
                    <div className="h-20 bg-gradient-to-r from-white to-neutral-900 rounded-md mb-2 border"></div>
                    <span className="text-sm font-medium">Systemeinstellung</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label>Sprache der Benutzeroberfläche</Label>
                <Select 
                  value={languageSettings.appLanguage} 
                  onValueChange={(value) => setLanguageSettings({...languageSettings, appLanguage: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sprache wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">Englisch</SelectItem>
                    <SelectItem value="fr">Französisch</SelectItem>
                    <SelectItem value="es">Spanisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Sprache für generierte Inhalte</Label>
                <Select 
                  value={languageSettings.contentLanguage} 
                  onValueChange={(value) => setLanguageSettings({...languageSettings, contentLanguage: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Inhaltssprache wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatisch (wie Benutzeroberfläche)</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">Englisch</SelectItem>
                    <SelectItem value="fr">Französisch</SelectItem>
                    <SelectItem value="es">Spanisch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie, wie und wann Sie Benachrichtigungen erhalten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-Mail-Benachrichtigungen</Label>
                  <p className="text-muted-foreground text-sm">Erhalten Sie wichtige Updates per E-Mail</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, emailNotifications: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dokument-Benachrichtigungen</Label>
                  <p className="text-muted-foreground text-sm">Benachrichtigungen bei neuen oder geteilten Dokumenten</p>
                </div>
                <Switch
                  checked={notificationSettings.documentAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, documentAlerts: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sicherheitsbenachrichtigungen</Label>
                  <p className="text-muted-foreground text-sm">Wichtige Sicherheitshinweise und Warnungen</p>
                </div>
                <Switch
                  checked={notificationSettings.securityAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, securityAlerts: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Kampagnen-Updates</Label>
                  <p className="text-muted-foreground text-sm">Updates zu laufenden Kampagnen und neuen Initiativen</p>
                </div>
                <Switch
                  checked={notificationSettings.campaignUpdates}
                  onCheckedChange={(checked) => 
                    setNotificationSettings({...notificationSettings, campaignUpdates: checked})
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sicherheit</CardTitle>
              <CardDescription>
                Verwalten Sie die Sicherheitseinstellungen Ihres Kontos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="current-password">Passwort ändern</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Input id="current-password" type="password" placeholder="Aktuelles Passwort" />
                  </div>
                  <div className="space-y-2">
                    <Input type="password" placeholder="Neues Passwort" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Zwei-Faktor-Authentifizierung</Label>
                  <p className="text-muted-foreground text-sm">Zusätzliche Sicherheitsebene für Ihr Konto</p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, twoFactorEnabled: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Datenverschlüsselung</Label>
                  <p className="text-muted-foreground text-sm">End-to-End-Verschlüsselung für sensible Dokumente</p>
                </div>
                <Switch
                  checked={securitySettings.dataEncryption}
                  onCheckedChange={(checked) => 
                    setSecuritySettings({...securitySettings, dataEncryption: checked})
                  }
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Sitzungs-Timeout</Label>
                <Select 
                  value={securitySettings.sessionTimeout} 
                  onValueChange={(value) => 
                    setSecuritySettings({...securitySettings, sessionTimeout: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Timeout wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">15 Minuten</SelectItem>
                    <SelectItem value="30m">30 Minuten</SelectItem>
                    <SelectItem value="1h">1 Stunde</SelectItem>
                    <SelectItem value="4h">4 Stunden</SelectItem>
                    <SelectItem value="1d">1 Tag</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Button variant="destructive" className="w-full md:w-auto">
                  Notfallzugriff deaktivieren
                </Button>
                <p className="text-sm text-muted-foreground">
                  Im Notfall können Sie den Zugriff auf Ihr Konto vorübergehend sperren.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings}>Speichern</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
