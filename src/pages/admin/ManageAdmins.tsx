import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, Shield, Users, Search, Edit, Trash2, 
  UserCheck, UserX, Building, School, AlertTriangle
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Admin {
  id: string;
  name: string;
  email?: string;
  sector: string | null;
  is_suspended: boolean;
  created_at: string;
}

const ManageAdmins = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [newSector, setNewSector] = useState<string>('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Check if user is super admin - wait for loading to complete
  useEffect(() => {
    // Debug log for super admin access
    console.log('[ManageAdmins] Checking super admin access:', {
      user_id: user?.id,
      is_super_admin: user?.is_super_admin,
      role: user?.role
    });
    
    // Only redirect if we have user data AND they're not a super admin
    if (user && !user.is_super_admin) {
      toast.error('Access denied. Super admin privileges required.');
      navigate('/');
    }
  }, [user, navigate]);

  // Load admins
  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      // Get all admin roles
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (!adminRoles || adminRoles.length === 0) {
        setAdmins([]);
        setIsLoading(false);
        return;
      }

      const adminIds = adminRoles.map(r => r.user_id);

      // Get profiles for these admins
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, sector, is_suspended, created_at')
        .in('id', adminIds);

      if (profiles) {
        setAdmins(profiles.map(p => ({
          id: p.id,
          name: p.name || 'Unknown Admin',
          sector: p.sector,
          is_suspended: p.is_suspended || false,
          created_at: p.created_at
        })));
      }
    } catch (error) {
      console.error('Error loading admins:', error);
      toast.error('Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspendAdmin = async (adminId: string, suspend: boolean) => {
    // Prevent suspending yourself
    if (adminId === user?.id) {
      toast.error("You cannot suspend yourself!");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: suspend,
          suspended_at: suspend ? new Date().toISOString() : null,
          suspended_by: suspend ? user?.id : null,
          suspension_reason: suspend ? 'Suspended by super admin' : null
        })
        .eq('id', adminId);

      if (error) throw error;
      
      setAdmins(prev => prev.map(a => 
        a.id === adminId ? { ...a, is_suspended: suspend } : a
      ));
      toast.success(`Admin ${suspend ? 'suspended' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin status');
    }
  };

  const handleEditSector = async () => {
    if (!editingAdmin) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ sector: newSector || null })
        .eq('id', editingAdmin.id);

      if (error) throw error;
      
      setAdmins(prev => prev.map(a => 
        a.id === editingAdmin.id ? { ...a, sector: newSector || null } : a
      ));
      toast.success('Admin sector updated successfully');
      setIsEditDialogOpen(false);
      setEditingAdmin(null);
    } catch (error) {
      console.error('Error updating admin sector:', error);
      toast.error('Failed to update admin sector');
    }
  };

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin);
    setNewSector(admin.sector || '');
    setIsEditDialogOpen(true);
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = sectorFilter === 'all' || admin.sector === sectorFilter || (sectorFilter === 'none' && !admin.sector);
    return matchesSearch && matchesSector;
  });

  const getSectorBadge = (sector: string | null) => {
    if (!sector) return <Badge variant="outline">No Sector</Badge>;
    if (sector === 'primary') return <Badge className="bg-blue-500">Primary</Badge>;
    if (sector === 'secondary') return <Badge className="bg-purple-500">Secondary</Badge>;
    return <Badge variant="secondary">{sector}</Badge>;
  };

  // Show loading state while checking super admin status
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  if (!user.is_super_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Super admin privileges required to access this page.
            </p>
            <Link to="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white py-4 sm:py-6 px-4 sm:px-6 shadow-lg overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
            <Link to="/admin/super-admin-dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 w-fit">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Super Admin</span>
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
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Manage Admins</h1>
                <p className="text-white/80 text-sm sm:text-base truncate">
                  Manage primary and secondary school administrators
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Admins</p>
                  <p className="text-xl sm:text-2xl font-bold">{admins.length}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Primary Admins</p>
                  <p className="text-xl sm:text-2xl font-bold">{admins.filter(a => a.sector === 'primary').length}</p>
                </div>
                <School className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Secondary Admins</p>
                  <p className="text-xl sm:text-2xl font-bold">{admins.filter(a => a.sector === 'secondary').length}</p>
                </div>
                <Building className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Suspended</p>
                  <p className="text-xl sm:text-2xl font-bold">{admins.filter(a => a.is_suspended).length}</p>
                </div>
                <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search admins by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="primary">Primary Only</SelectItem>
                  <SelectItem value="secondary">Secondary Only</SelectItem>
                  <SelectItem value="none">No Sector Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        </Card>

        {/* Admins List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">All Administrators</CardTitle>
            <CardDescription>
              Manage admin accounts, assign sectors, and control access
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading administrators...
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No administrators found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAdmins.map((admin) => (
                    <div 
                      key={admin.id} 
                      className={`p-4 sm:p-5 hover:bg-muted/50 transition-colors ${admin.is_suspended ? 'bg-destructive/5' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${admin.is_suspended ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                            <Shield className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-medium">{admin.name}</h4>
                              {admin.id === user?.id && (
                                <Badge variant="outline" className="text-xs">You</Badge>
                              )}
                              {admin.is_suspended && (
                                <Badge variant="destructive" className="text-xs">Suspended</Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {getSectorBadge(admin.sector)}
                              <span className="text-xs text-muted-foreground">
                                Added {new Date(admin.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 ml-auto sm:ml-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(admin)}
                            className="text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit Sector
                          </Button>
                          {admin.id !== user?.id && (
                            <Button
                              variant={admin.is_suspended ? 'default' : 'destructive'}
                              size="sm"
                              onClick={() => handleSuspendAdmin(admin.id, !admin.is_suspended)}
                              className="text-xs"
                            >
                              {admin.is_suspended ? (
                                <>
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Activate
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3 w-3 mr-1" />
                                  Suspend
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Warning Card */}
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-700">Important Notes</p>
              <ul className="text-sm text-yellow-600 mt-1 space-y-1">
                <li>• Primary admins can only manage primary section users</li>
                <li>• Secondary admins can only manage secondary section users</li>
                <li>• Suspended admins cannot access the platform</li>
                <li>• You cannot suspend yourself</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Sector Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md z-[1000]">
          <DialogHeader>
            <DialogTitle>Edit Admin Sector</DialogTitle>
            <DialogDescription>
              Assign this admin to a specific school sector
            </DialogDescription>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-sm font-medium">Admin Name</Label>
                <p className="text-sm text-muted-foreground">{editingAdmin.name}</p>
              </div>
              <div>
                <Label htmlFor="sector">School Sector</Label>
                <Select value={newSector || 'none'} onValueChange={(v) => setNewSector(v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent className="z-[1001]">
                    <SelectItem value="none">No Sector (Super Access)</SelectItem>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {newSector === 'primary' && 'This admin will only manage Play Group to Primary 6'}
                  {newSector === 'secondary' && 'This admin will only manage JSS 1 to SSS 3'}
                  {(!newSector || newSector === 'none') && 'This admin will have access to both sectors'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSector}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageAdmins;
