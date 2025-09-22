import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Eye, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_roles: string[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const ManageAnnouncements = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'student';
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingAnnouncements, setPendingAnnouncements] = useState<Announcement[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    content: "",
    target_roles: ["student", "teacher"] as string[]
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // For demo purposes, split announcements based on is_active
      const active = data?.filter(ann => ann.is_active) || [];
      const pending = data?.filter(ann => !ann.is_active) || [];
      
      setAnnouncements(active);
      setPendingAnnouncements(pending);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          target_roles: newAnnouncement.target_roles,
          created_by: user?.id || 'demo-user',
          is_active: userRole === 'admin' // Auto-approve for admin, pending for teacher
        });

      if (error) throw error;

      toast.success(userRole === 'admin' ? 'Announcement created successfully' : 'Announcement submitted for approval');
      setNewAnnouncement({ title: "", content: "", target_roles: ["student", "teacher"] });
      setIsCreateOpen(false);
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleApproveAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement approved');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error approving announcement:', error);
      toast.error('Failed to approve announcement');
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const canManageAll = userRole === 'admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Manage Announcements
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {canManageAll ? 'Create and manage all announcements' : 'Create announcements for approval'}
              </p>
            </div>
          </div>
          
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
                <DialogDescription>
                  Create a new announcement {canManageAll ? 'that will be immediately active' : 'for admin approval'}
                </DialogDescription>
            </CardHeader>
          </Card>
        )}

        {/* All Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {canManageAll ? 'All Active Announcements' : 'My Announcements'}
            </CardTitle>
            <CardDescription>
              {canManageAll ? 'Manage all published announcements' : 'View your created announcements'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No announcements found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{announcement.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={announcement.is_active ? "default" : "secondary"}>
                            {announcement.is_active ? 'Active' : 'Pending'}
                          </Badge>
                          <Badge variant="outline">
                            {announcement.target_roles.join(', ')}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Created {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      {canManageAll && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
        </div>

        {/* Pending Approvals (Admin only) */}
        {canManageAll && pendingAnnouncements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                Announcements waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{announcement.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {announcement.target_roles.join(', ')}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Created {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveAnnouncement(announcement.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {canManageAll ? 'All Active Announcements' : 'My Announcements'}
            </CardTitle>
            <CardDescription>
              {canManageAll ? 'Manage all published announcements' : 'View your created announcements'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No announcements found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{announcement.title}</h3>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{announcement.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={announcement.is_active ? "default" : "secondary"}>
                            {announcement.is_active ? 'Active' : 'Pending'}
                          </Badge>
                          <Badge variant="outline">
                            {announcement.target_roles.join(', ')}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            Created {format(new Date(announcement.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      {canManageAll && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageAnnouncements;