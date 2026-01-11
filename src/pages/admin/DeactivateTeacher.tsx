import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, UserX, UserCheck, AlertTriangle, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSector } from "@/hooks/useAdminSector";
import { useLoginNotification } from "@/hooks/useLoginNotification";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface Teacher {
  id: string;
  name: string;
  email: string;
  teacher_id: string;
  department: string;
  sector: string | null;
  is_active: boolean;
}

const DeactivateTeacher = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isSuperAdmin, adminSector, canManageClassLevel, getSectorFromClassLevel } = useAdminSector();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Task E: Only super admin can deactivate teachers
  useEffect(() => {
    if (!user?.is_super_admin) {
      toast.error("Only Super Admin can deactivate teacher accounts");
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user?.is_super_admin) {
      loadTeachers();
    }
  }, [user]);

  const loadTeachers = async () => {
    try {
      // Get all teachers from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      if (roleError) throw roleError;

      if (!roleData || roleData.length === 0) {
        setTeachers([]);
        setIsLoading(false);
        return;
      }

      const teacherIds = roleData.map(r => r.user_id);

      // Get profiles for these teachers - get ALL teachers regardless of profile completion
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, phone, department, sector, teacher_id, is_suspended')
        .in('id', teacherIds);

      if (profileError) throw profileError;

      // Format the data - show all teachers that have a profile
      // Super admin sees ALL teachers
      const teacherList: Teacher[] = (profileData || []).map(profile => ({
        id: profile.id,
        name: profile.name || 'Teacher',
        email: '',
        teacher_id: profile.teacher_id || 'Not assigned',
        department: profile.department || 'Not assigned',
        sector: profile.sector || null,
        is_active: !profile.is_suspended // Active if not suspended
      }));

      setTeachers(teacherList);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error("Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (teacher: Teacher, newStatus: boolean) => {
    setIsProcessing(true);
    try {
      // Task E: Update is_suspended status (not is_profile_complete)
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_suspended: !newStatus,
          suspended_at: !newStatus ? new Date().toISOString() : null,
          suspended_by: !newStatus ? user?.id : null,
          suspension_reason: !newStatus ? 'Deactivated by Super Admin' : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacher.id);

      if (error) throw error;

      // Update local state
      setTeachers(teachers.map(t => 
        t.id === teacher.id ? { ...t, is_active: newStatus } : t
      ));

      // Task E: Send notification when teacher is deactivated
      if (!newStatus) {
        await supabase.from('admin_notifications').insert({
          title: '👤 Teacher Account Deactivated',
          message: `${teacher.name} (${teacher.teacher_id}) has been deactivated by Super Admin. Sector: ${teacher.sector || 'Not assigned'}`,
          type: 'deactivation'
        });

        // Send email notification
        try {
          await supabase.functions.invoke('send-email-notification', {
            body: {
              type: 'deactivation',
              recipientType: 'all_admins',
              subject: 'Teacher Account Deactivated',
              message: `${teacher.name} has been deactivated from Priscilla Connect`,
              details: {
                'Teacher Name': teacher.name,
                'Teacher ID': teacher.teacher_id,
                'Sector': teacher.sector || 'Not assigned',
                'Deactivated By': 'Super Admin',
                'Time': new Date().toLocaleString()
              }
            }
          });
        } catch {
          // Email is optional
        }
      }

      toast.success(`Teacher ${newStatus ? 'reactivated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update teacher status");
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
      setSelectedTeacher(null);
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.teacher_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (teacher.sector || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to get sector badge
  const getSectorBadge = (sector: string | null) => {
    if (!sector) return <Badge variant="outline">No Sector</Badge>;
    if (sector === 'primary') return <Badge className="bg-blue-500 text-white">Primary</Badge>;
    if (sector === 'secondary') return <Badge className="bg-purple-500 text-white">Secondary</Badge>;
    return <Badge variant="secondary">{sector}</Badge>;
  };

  if (!user?.is_super_admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              Only Super Admin can deactivate teacher accounts.
            </p>
            <Link to="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-red-900 via-rose-800 to-red-900 text-white py-6 px-6 shadow-medium">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <UserX className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Deactivate Teacher Account</h1>
              <p className="text-white/80">Super Admin Only - Manage teacher account status</p>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto p-6">

        {/* Search */}
        <Card className="shadow-soft mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, teacher ID, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Teachers List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5" />
              Teacher Accounts ({filteredTeachers.length})
            </CardTitle>
            <CardDescription>
              Deactivate accounts for teachers who have left the school
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No teachers found matching your search" : "No teachers found"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeachers.map((teacher) => (
                  <div 
                    key={teacher.id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      teacher.is_active ? 'bg-background' : 'bg-destructive/5'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{teacher.name}</p>
                        <Badge variant={teacher.is_active ? "default" : "destructive"}>
                          {teacher.is_active ? "Active" : "Deactivated"}
                        </Badge>
                        {getSectorBadge(teacher.sector)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        ID: {teacher.teacher_id} | Dept: {teacher.department}
                      </p>
                    </div>
                    <Button
                      variant={teacher.is_active ? "destructive" : "default"}
                      size="sm"
                      onClick={() => {
                        setSelectedTeacher(teacher);
                        setDialogOpen(true);
                      }}
                      disabled={isProcessing}
                    >
                      {teacher.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-2" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Reactivate
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                {selectedTeacher?.is_active ? "Deactivate" : "Reactivate"} Teacher Account?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {selectedTeacher?.is_active ? (
                  <>
                    This will prevent <strong>{selectedTeacher?.name}</strong> from logging in 
                    or accessing any school data. Their account data will be preserved.
                  </>
                ) : (
                  <>
                    This will allow <strong>{selectedTeacher?.name}</strong> to log in 
                    and access school resources again.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedTeacher && handleToggleStatus(selectedTeacher, !selectedTeacher.is_active)}
                className={selectedTeacher?.is_active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              >
                {isProcessing ? "Processing..." : (selectedTeacher?.is_active ? "Deactivate" : "Reactivate")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default DeactivateTeacher;
