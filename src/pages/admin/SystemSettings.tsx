import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Settings, Database, Mail, Shield, Bell, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    // General Settings
    systemName: "Priscilla Education System",
    allowRegistration: true,
    maintenanceMode: false,
    
    // Email Settings
    emailNotifications: true,
    welcomeEmail: true,
    examReminders: true,
    
    // Security Settings
    sessionTimeout: 30,
    passwordMinLength: 8,
    enableTwoFactor: false,
    
    // Notification Settings
    pushNotifications: true,
    emailDigest: true,
    announcementBroadcast: true
  });

  // Load maintenance mode from localStorage on mount
  useEffect(() => {
    const maintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    setSettings(prev => ({ ...prev, maintenanceMode }));
  }, []);

  const handleMaintenanceModeToggle = (checked: boolean) => {
    setSettings(prev => ({ ...prev, maintenanceMode: checked }));
    localStorage.setItem('maintenanceMode', String(checked));
    toast.success(checked ? 'Maintenance mode enabled. Students and teachers cannot log in.' : 'Maintenance mode disabled. All users can log in.');
  };

  const handleSaveSettings = async (category: string) => {
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`${category} settings saved successfully`);
  };

  const handleResetDatabase = () => {
    toast.error('Database reset is not available in demo mode');
  };

  const handleBackupDatabase = () => {
    toast.success('Database backup initiated');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <Settings className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">System Settings</h1>
              <p className="text-white/80">Configure system-wide settings and preferences</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto space-y-6 p-4">

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure basic system settings and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="system-name">System Name</Label>
                  <Input
                    id="system-name"
                    value={settings.systemName}
                    onChange={(e) => setSettings({...settings, systemName: e.target.value})}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow New User Registration</Label>
                    <p className="text-sm text-slate-500">
                      Allow new users to create accounts
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowRegistration}
                    onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-slate-500">
                      Put the system into maintenance mode (blocks student/teacher login)
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={handleMaintenanceModeToggle}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('General')}>
                    Save General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Settings */}
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Management
                </CardTitle>
                <CardDescription>
                  Manage database operations and backups
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Database Backup</CardTitle>
                      <CardDescription>
                        Create a backup of the current database
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={handleBackupDatabase} className="w-full">
                        Create Backup
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Reset Database</CardTitle>
                      <CardDescription>
                        Reset all data (use with extreme caution)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="destructive" 
                        onClick={handleResetDatabase}
                        className="w-full"
                      >
                        Reset Database
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Warning:</strong> Database operations cannot be undone. Always create a backup before making changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure email notifications and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Enable system-wide email notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Welcome Email</Label>
                    <p className="text-sm text-slate-500">
                      Send welcome email to new users
                    </p>
                  </div>
                  <Switch
                    checked={settings.welcomeEmail}
                    onCheckedChange={(checked) => setSettings({...settings, welcomeEmail: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exam Reminders</Label>
                    <p className="text-sm text-slate-500">
                      Send email reminders for upcoming exams
                    </p>
                  </div>
                  <Switch
                    checked={settings.examReminders}
                    onCheckedChange={(checked) => setSettings({...settings, examReminders: checked})}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('Email')}>
                    Save Email Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security settings and policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-length">Minimum Password Length</Label>
                  <Input
                    id="password-length"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({...settings, passwordMinLength: parseInt(e.target.value)})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-500">
                      Require 2FA for all users
                    </p>
                  </div>
                  <Switch
                    checked={settings.enableTwoFactor}
                    onCheckedChange={(checked) => setSettings({...settings, enableTwoFactor: checked})}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('Security')}>
                    Save Security Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure system notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-slate-500">
                      Enable browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Digest</Label>
                    <p className="text-sm text-slate-500">
                      Send daily email digest to users
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailDigest}
                    onCheckedChange={(checked) => setSettings({...settings, emailDigest: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Announcement Broadcast</Label>
                    <p className="text-sm text-slate-500">
                      Broadcast announcements to all users
                    </p>
                  </div>
                  <Switch
                    checked={settings.announcementBroadcast}
                    onCheckedChange={(checked) => setSettings({...settings, announcementBroadcast: checked})}
                  />
                </div>

                <div className="pt-4">
                  <Button onClick={() => handleSaveSettings('Notification')}>
                    Save Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemSettings;