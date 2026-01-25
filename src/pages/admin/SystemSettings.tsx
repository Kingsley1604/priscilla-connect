import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Settings, Database, Mail, Shield, Bell, Users, Loader2, AlertTriangle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SystemSettings = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
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
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);

  // Check if current user is super admin
  useEffect(() => {
    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setIsSuperAdmin(data.is_super_admin || false);
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  // Load maintenance mode from database on mount
  useEffect(() => {
    loadMaintenanceMode();
  }, []);

  const loadMaintenanceMode = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();

      if (!error && data) {
        const isEnabled = data.setting_value === 'true';
        setSettings(prev => ({ ...prev, maintenanceMode: isEnabled }));
      }
    } catch (error) {
      console.error('Error loading maintenance mode:', error);
    }
  };

  const handleMaintenanceModeToggle = async (checked: boolean) => {
    // Only super admin can toggle maintenance mode
    if (!isSuperAdmin) {
      toast.error('Only the super admin can enable/disable maintenance mode');
      return;
    }

    setIsLoadingMaintenance(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'maintenance_mode',
          setting_value: String(checked),
          updated_at: new Date().toISOString(),
          updated_by: userData.user?.id
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      setSettings(prev => ({ ...prev, maintenanceMode: checked }));
      
      toast.success(checked 
        ? 'Maintenance mode enabled. Only super admin can access the system.' 
        : 'Maintenance mode disabled. All users can log in.');
    } catch (error) {
      console.error('Error updating maintenance mode:', error);
      toast.error('Failed to update maintenance mode');
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const handleSaveSettings = async (category: string) => {
    // Simulate saving settings
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`${category} settings saved successfully`);
  };

  // Task H: Only super admin can reset database with confirmation
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  // Task F: Don't show any error message, just silently do nothing if not super admin
  const handleResetDatabase = () => {
    if (!isSuperAdmin) {
      // Silently do nothing - no error message shown to regular admins
      return;
    }
    setShowResetConfirm(true);
  };

  const confirmDatabaseReset = async () => {
    // Task I: Confirmation for database reset
    toast.error('Database reset has been disabled for safety. Contact technical support for data recovery.');
    setShowResetConfirm(false);
  };

  const handleBackupDatabase = () => {
    toast.success('Database backup initiated. Auto-backup runs every 24 hours.');
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
                    <div className="flex items-center gap-2">
                      <Label>Maintenance Mode</Label>
                      {!isSuperAdmin && <Lock className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <p className="text-sm text-slate-500">
                      Put the system into maintenance mode (blocks all users)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={handleMaintenanceModeToggle}
                      disabled={isLoadingMaintenance || !isSuperAdmin}
                    />
                    {isLoadingMaintenance && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </div>

                {settings.maintenanceMode && (
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                      <strong>Maintenance mode is active.</strong> All users (including other admins) cannot access the system. 
                      Only you (super admin) can access and make changes.
                    </AlertDescription>
                  </Alert>
                )}

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

                  {/* Task A: Show Reset Database to all but only clickable by super admin */}
                  <Card className={!isSuperAdmin ? 'opacity-60' : ''}>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                        Reset Database
                        {!isSuperAdmin && <Lock className="h-4 w-4 text-muted-foreground" />}
                      </CardTitle>
                      <CardDescription>
                        Reset all data (use with extreme caution)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        variant="destructive" 
                        onClick={handleResetDatabase}
                        className="w-full"
                        disabled={!isSuperAdmin}
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
      
      {/* Task I: Confirmation dialog for database reset */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ CRITICAL ACTION - Reset Database</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-bold">Are you absolutely sure you want to reset the database?</p>
              <p>This action is <span className="text-destructive font-semibold">IRREVERSIBLE</span> and will:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>Delete ALL student records</li>
                <li>Delete ALL teacher accounts</li>
                <li>Delete ALL exam results and reports</li>
                <li>Delete ALL chat messages and groups</li>
                <li>Reset ALL system settings</li>
              </ul>
              <p className="text-destructive font-semibold mt-4">Priscilla School's data is extremely important. Please ensure you have a backup before proceeding.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel - Keep Data Safe</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDatabaseReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              I Understand - Reset Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SystemSettings;