import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SystemHealthCardProps {
  userRole: 'student' | 'teacher' | 'admin';
}

const SystemHealthCard = ({ userRole }: SystemHealthCardProps) => {
  const [healthPercentage, setHealthPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateSystemHealth();
  }, [userRole]);

  const calculateSystemHealth = async () => {
    try {
      let totalChecks = 0;
      let passedChecks = 0;

      // Check 1: Database connectivity
      totalChecks++;
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      if (!dbError) passedChecks++;

      // Check 2: Auth service
      totalChecks++;
      const { data: session } = await supabase.auth.getSession();
      if (session) passedChecks++;

      // Check 3: User profile exists
      totalChecks++;
      const { data: user } = await supabase.auth.getUser();
      if (user?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.user.id)
          .single();
        if (profile) passedChecks++;
      }

      // Check 4: Announcements table accessible
      totalChecks++;
      const { error: announcementError } = await supabase.from('announcements').select('id').limit(1);
      if (!announcementError) passedChecks++;

      // Check 5: Events table accessible
      totalChecks++;
      const { error: eventsError } = await supabase.from('events').select('id').limit(1);
      if (!eventsError) passedChecks++;

      // For teachers - additional checks
      if (userRole === 'teacher') {
        // Check homework table
        totalChecks++;
        const { error: homeworkError } = await supabase.from('homework').select('id').limit(1);
        if (!homeworkError) passedChecks++;

        // Check exams table
        totalChecks++;
        const { error: examsError } = await supabase.from('exams').select('id').limit(1);
        if (!examsError) passedChecks++;
      }

      // For admins - additional checks
      if (userRole === 'admin') {
        // Check store items
        totalChecks++;
        const { error: storeError } = await supabase.from('store_items').select('id').limit(1);
        if (!storeError) passedChecks++;

        // Check classes table
        totalChecks++;
        const { error: classesError } = await supabase.from('classes').select('id').limit(1);
        if (!classesError) passedChecks++;

        // Check teacher assignments
        totalChecks++;
        const { error: assignmentsError } = await supabase.from('teacher_assignments').select('id').limit(1);
        if (!assignmentsError) passedChecks++;

        // Check maintenance mode is set properly
        totalChecks++;
        const maintenanceMode = localStorage.getItem('maintenanceMode');
        if (maintenanceMode !== null) passedChecks++;
      }

      const percentage = Math.round((passedChecks / totalChecks) * 100);
      setHealthPercentage(percentage);
    } catch (error) {
      console.error('Error calculating system health:', error);
      setHealthPercentage(50);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = () => {
    if (healthPercentage <= 40) return 'text-red-500';
    if (healthPercentage <= 49.9) return 'text-orange-500';
    return 'text-green-500';
  };

  const getHealthIcon = () => {
    if (healthPercentage <= 40) return <XCircle className="h-4 w-4 text-red-500" />;
    if (healthPercentage <= 49.9) return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getHealthLabel = () => {
    if (healthPercentage <= 40) return 'Critical';
    if (healthPercentage <= 49.9) return 'Warning';
    if (healthPercentage <= 70) return 'Good';
    return 'Excellent';
  };

  return (
    <Card className="shadow-soft hover:shadow-medium transition-shadow sm:col-span-2 md:col-span-1">
      <CardHeader className="pb-2 p-3 sm:p-4">
        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center">
          <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-secondary" />
          Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-16 mb-1"></div>
            <div className="h-4 bg-muted rounded w-24"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className={`text-xl sm:text-2xl md:text-3xl font-bold ${getHealthColor()} mb-1`}>
                {healthPercentage}%
              </div>
              {getHealthIcon()}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
              {userRole === 'teacher' ? 'Class average' : 'System health'} - {getHealthLabel()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
