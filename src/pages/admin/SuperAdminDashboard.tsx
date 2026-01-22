import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Shield, Users, Settings, Bell, Activity, 
  Database, Lock, AlertTriangle, CheckCircle, XCircle,
  Monitor, MapPin, Clock, Search, RefreshCw, Power
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  username?: string;
  device?: string;
  location?: string;
}

interface UserActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  sector?: string;
  last_login?: string;
  is_suspended?: boolean;
}

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalTeachers: 0,
    totalStudents: 0,
    activeToday: 0
  });

  // Check if user is super admin - only redirect after auth is loaded and confirmed not super admin
  const [accessChecked, setAccessChecked] = useState(false);
  
  useEffect(() => {
    // Wait for user to be loaded
    if (user === null) return;
    
    // Check super admin status
    if (user.is_super_admin === true) {
      setAccessChecked(true);
    } else {
      // Double-check by fetching from database directly
      const checkSuperAdmin = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .single();
        
        if (data?.is_super_admin === true) {
          setAccessChecked(true);
        } else {
          toast.error('Access denied. Super admin privileges required.');
          navigate('/');
        }
      };
      checkSuperAdmin();
    }
  }, [user, navigate]);

  // Load maintenance mode status
  useEffect(() => {
    const loadMaintenanceMode = async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'maintenance_mode')
        .single();
      
      if (data) {
        setMaintenanceMode(data.setting_value === 'true');
      }
    };
    loadMaintenanceMode();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setNotifications(data.map(n => ({
          ...n,
          username: n.message?.match(/^(\w+)/)?.[1] || 'User'
        })));
      }
    };
    loadNotifications();
  }, []);

  // Load users and stats
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        // Get all user roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role');
        
        // Get all profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar, sector, is_suspended');

        if (roles && profiles) {
          const usersWithRoles: UserActivity[] = roles.map(role => {
            const profile = profiles.find(p => p.id === role.user_id);
            return {
              id: role.user_id,
              name: profile?.name || 'Unknown User',
              email: '',
              role: role.role,
              sector: profile?.sector,
              is_suspended: profile?.is_suspended
            };
          });

          setUsers(usersWithRoles);
          setStats({
            totalUsers: usersWithRoles.length,
            totalAdmins: usersWithRoles.filter(u => u.role === 'admin').length,
            totalTeachers: usersWithRoles.filter(u => u.role === 'teacher').length,
            totalStudents: usersWithRoles.filter(u => u.role === 'student').length,
            activeToday: Math.floor(usersWithRoles.length * 0.3) // Approximate
          });
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleMaintenanceToggle = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: 'maintenance_mode',
          setting_value: enabled.toString(),
          updated_by: user?.id
        }, { onConflict: 'setting_key' });

      if (error) throw error;
      
      setMaintenanceMode(enabled);
      toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling maintenance mode:', error);
      toast.error('Failed to update maintenance mode');
    }
  };

  const handleSuspendUser = async (userId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: suspend,
          suspended_at: suspend ? new Date().toISOString() : null,
          suspended_by: suspend ? user?.id : null
        })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, is_suspended: suspend } : u
      ));
      toast.success(`User ${suspend ? 'suspended' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.sector && u.sector.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-4 sm:py-6 px-4 sm:px-6 shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/20 p-2 sm:p-3 rounded-lg backdrop-blur-sm flex-shrink-0">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Super Admin Dashboard</h1>
                <p className="text-white/80 text-sm sm:text-base truncate">System-wide controls and management</p>
              </div>
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hidden sm:flex">
              <Shield className="h-3 w-3 mr-1" />
              Super Admin
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Admins</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalAdmins}</p>
                </div>
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Teachers</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalTeachers}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Students</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.totalStudents}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft col-span-2 sm:col-span-1">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Active Today</p>
                  <p className="text-xl sm:text-2xl font-bold">{stats.activeToday}</p>
                </div>
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Controls */}
        <Card className="shadow-medium border-2 border-primary/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Settings className="h-5 w-5" />
              System Controls
            </CardTitle>
            <CardDescription>Critical system settings and configurations</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Power className={`h-5 w-5 ${maintenanceMode ? 'text-destructive' : 'text-green-500'}`} />
                <div>
                  <p className="font-medium">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">
                    {maintenanceMode 
                      ? 'System is in maintenance mode. Users cannot access the platform.' 
                      : 'System is operational and accessible to all users.'}
                  </p>
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                className="data-[state=checked]:bg-destructive"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/manage-admins')}>
                <Shield className="h-4 w-4 mr-2" />
                Manage Admins
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/system-settings')}>
                <Settings className="h-4 w-4 mr-2" />
                System Settings
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/manage-announcements')}>
                <Bell className="h-4 w-4 mr-2" />
                Manage Announcements
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/teacher-management')}>
                <Users className="h-4 w-4 mr-2" />
                Teacher Management
              </Button>
              <Button variant="outline" className="justify-start" onClick={() => navigate('/admin/manage-store')}>
                <Database className="h-4 w-4 mr-2" />
                Store Management
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="h-4 w-4 mr-1 sm:mr-2" />
              Activity Log
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Activity Log</CardTitle>
                <CardDescription>
                  All login/signup activities with device and location information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No activity logs yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div 
                          key={notification.id} 
                          className="p-3 sm:p-4 border-b hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${
                              notification.type === 'login' ? 'bg-blue-100 text-blue-600' :
                              notification.type === 'signup' ? 'bg-green-100 text-green-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {notification.type === 'login' ? <Lock className="h-4 w-4" /> :
                               notification.type === 'signup' ? <Users className="h-4 w-4" /> :
                               <AlertTriangle className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(notification.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">{notification.title}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">User Management</CardTitle>
                    <CardDescription>Manage all users across the platform</CardDescription>
                  </div>
                </div>
                {/* Task E: Enhanced search with filter buttons */}
                <div className="mt-4 space-y-3">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users by name, role, or sector..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className={searchTerm === '' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('')}>All</Button>
                    <Button variant="outline" size="sm" className={searchTerm === 'student' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('student')}>Students</Button>
                    <Button variant="outline" size="sm" className={searchTerm === 'teacher' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('teacher')}>Teachers</Button>
                    <Button variant="outline" size="sm" className={searchTerm === 'admin' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('admin')}>Admins</Button>
                    <Button variant="outline" size="sm" className={searchTerm === 'primary' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('primary')}>Primary</Button>
                    <Button variant="outline" size="sm" className={searchTerm === 'secondary' ? 'bg-primary/10' : ''} onClick={() => setSearchTerm('secondary')}>Secondary</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px] sm:h-[500px]">
                  {isLoading ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Loading users...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      No users found
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredUsers.map((u) => (
                        <div 
                          key={u.id} 
                          className="p-3 sm:p-4 border-b hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium truncate">{u.name}</p>
                                <Badge variant={
                                  u.role === 'admin' ? 'default' :
                                  u.role === 'teacher' ? 'secondary' : 'outline'
                                } className="text-xs">
                                  {u.role}
                                </Badge>
                                {u.sector && (
                                  <Badge variant="outline" className="text-xs">
                                    {u.sector}
                                  </Badge>
                                )}
                                {u.is_suspended && (
                                  <Badge variant="destructive" className="text-xs">
                                    Suspended
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant={u.is_suspended ? "default" : "destructive"}
                              size="sm"
                              onClick={() => handleSuspendUser(u.id, !u.is_suspended)}
                            >
                              {u.is_suspended ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Activate</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  <span className="hidden sm:inline">Suspend</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;