import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, UserPlus, Edit, Trash2, Key } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth";
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

interface Teacher {
  id: string;
  name: string;
  email: string;
  teacher_id: string;
  phone: string;
  department: string;
  sector: string;
}

const TeacherManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [deleteTeacherId, setDeleteTeacherId] = useState<string | null>(null);

  // Task M: Admin sector filtering - get admin's sector
  const adminSector = user?.sector;

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      // Use the search_teachers RPC function to get teachers
      const { data: teachersData, error: teachersError } = await supabase.rpc('search_teachers', {
        search_term: ''
      });

      if (teachersError) throw teachersError;

      // Get additional profile data
      const teacherIds = (teachersData || []).map((t: any) => t.id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, teacher_id, phone, department, sector')
        .in('id', teacherIds);

      if (profilesError) throw profilesError;

      const teachersWithDetails = (teachersData || []).map((teacher: any) => {
        const profile = profiles?.find(p => p.id === teacher.id);
        return {
          id: teacher.id,
          name: teacher.name || profile?.name || "Unknown",
          email: teacher.email || "",
          teacher_id: profile?.teacher_id || "",
          phone: profile?.phone || "",
          department: profile?.department || "",
          sector: profile?.sector || "primary"
        };
      });

      setTeachers(teachersWithDetails);
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error("Failed to load teachers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTeacherId) return;

    try {
      // Delete user role first
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deleteTeacherId)
        .eq('role', 'teacher');
      
      if (roleError) throw roleError;

      // Mark profile as inactive/deleted (soft delete)
      await supabase
        .from('profiles')
        .update({ is_suspended: true, suspension_reason: 'Account deleted' })
        .eq('id', deleteTeacherId);

      toast.success("Teacher deleted successfully");
      setDeleteTeacherId(null);
      loadTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error("Failed to delete teacher");
    }
  };

  // Task E: Fix password reset - update both profile and show clear instructions
  const handleResetPassword = async (teacherId: string, teacherEmail: string) => {
    try {
      const { data, error } = await supabase.rpc('generate_default_password');
      if (error) throw error;

      const newPassword = data;

      // Update password in profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          default_password: newPassword,
          must_change_password: true 
        })
        .eq('id', teacherId);

      if (profileError) throw profileError;

      // Show the password clearly so admin can share it with teacher
      toast.success(
        `Password reset successful!\n\nNew Password: ${newPassword}\n\nShare this password with the teacher. They will be required to change it on next login.`,
        {
          duration: 15000,
          description: `Email: ${teacherEmail}\nPassword: ${newPassword}`
        }
      );
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error("Failed to reset password");
    }
  };

  // Task I: Filter by Teacher ID, Email, and Phone number
  // Task M: Filter by admin's sector first, then by user-selected filter
  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      teacher.teacher_id.toLowerCase().includes(searchLower) ||
      teacher.email.toLowerCase().includes(searchLower) ||
      (teacher.phone || '').toLowerCase().includes(searchLower);
    
    // If admin has a sector, only show teachers from that sector
    const matchesAdminSector = !adminSector || adminSector === 'both' || teacher.sector === adminSector || teacher.sector === 'both';
    
    // Then apply user's filter selection
    const matchesSectorFilter = sectorFilter === "all" || teacher.sector === sectorFilter;
    
    return matchesSearch && matchesAdminSector && matchesSectorFilter;
  });

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Teacher Management</h1>
              <p className="text-muted-foreground">Manage teacher accounts and assignments</p>
            </div>
          </div>
          <Button onClick={() => navigate('/admin/teacher-creation')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Teacher
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>All Teachers ({filteredTeachers.length})</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Sectors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, Email or Phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <Badge variant="outline">{teacher.teacher_id}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.phone || "N/A"}</TableCell>
                    <TableCell className="capitalize">{teacher.sector || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPassword(teacher.id, teacher.email)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTeacherId(teacher.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredTeachers.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No teachers found
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!deleteTeacherId} onOpenChange={() => setDeleteTeacherId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this teacher? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default TeacherManagement;
