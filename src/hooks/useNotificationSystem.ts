import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type NotificationType = 
  | 'login'
  | 'signup'
  | 'exam_completed'
  | 'exam_created'
  | 'homework_assigned'
  | 'homework_submitted'
  | 'video_uploaded'
  | 'video_approved'
  | 'order_placed'
  | 'content_alert'
  | 'teacher_created'
  | 'result_uploaded'
  | 'announcement_created';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  username?: string;
  severity?: 'low' | 'medium' | 'high';
  relatedId?: string;
}

export const useNotificationSystem = () => {
  const { user } = useAuth();

  const sendNotification = useCallback(async (payload: NotificationPayload) => {
    try {
      // Store in Supabase admin_notifications table
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          title: payload.title,
          message: payload.message,
          type: payload.type,
          is_read: false,
          related_order_id: payload.relatedId || null
        });

      if (error) {
        console.error('Error storing notification:', error);
      }

      // Also dispatch local event for immediate UI update
      const notification = {
        id: crypto.randomUUID(),
        type: payload.type,
        message: payload.message,
        timestamp: new Date().toISOString(),
        userId: payload.userId || user?.id,
        username: payload.username || user?.name,
        read: false,
        severity: payload.severity || 'medium'
      };

      window.dispatchEvent(new CustomEvent('admin-notification', { detail: notification }));
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [user]);

  // Specific notification helpers
  const notifyLogin = useCallback((username: string, device?: string, location?: string) => {
    sendNotification({
      type: 'login',
      title: 'User Login',
      message: `${username} logged in${device ? ` from ${device}` : ''}${location ? ` (${location})` : ''}`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifySignup = useCallback((username: string, role: string) => {
    sendNotification({
      type: 'signup',
      title: 'New User Registration',
      message: `New ${role} account created: ${username}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  const notifyExamCompleted = useCallback((studentName: string, examTitle: string, score: number) => {
    sendNotification({
      type: 'exam_completed',
      title: 'Exam Completed',
      message: `${studentName} completed "${examTitle}" with score: ${score}%`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyExamCreated = useCallback((teacherName: string, examTitle: string) => {
    sendNotification({
      type: 'exam_created',
      title: 'New Exam Created',
      message: `${teacherName} created a new exam: "${examTitle}"`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyHomeworkAssigned = useCallback((teacherName: string, subject: string, classLevel: string) => {
    sendNotification({
      type: 'homework_assigned',
      title: 'Homework Assigned',
      message: `${teacherName} assigned homework for ${subject} (${classLevel})`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyHomeworkSubmitted = useCallback((studentName: string, homeworkTitle: string) => {
    sendNotification({
      type: 'homework_submitted',
      title: 'Homework Submitted',
      message: `${studentName} submitted homework: "${homeworkTitle}"`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyVideoUploaded = useCallback((teacherName: string, videoTitle: string) => {
    sendNotification({
      type: 'video_uploaded',
      title: 'Video Uploaded',
      message: `${teacherName} uploaded a video: "${videoTitle}" (pending approval)`,
      severity: 'medium'
    });
  }, [sendNotification]);

  const notifyVideoApproved = useCallback((videoTitle: string) => {
    sendNotification({
      type: 'video_approved',
      title: 'Video Approved',
      message: `Video "${videoTitle}" has been approved and is now live`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyOrderPlaced = useCallback((customerName: string, totalAmount: number, orderId: string) => {
    sendNotification({
      type: 'order_placed',
      title: 'New Store Order',
      message: `${customerName} placed an order for ₦${totalAmount.toLocaleString()}`,
      severity: 'medium',
      relatedId: orderId
    });
  }, [sendNotification]);

  const notifyContentAlert = useCallback((username: string, content: string) => {
    sendNotification({
      type: 'content_alert',
      title: 'Content Alert',
      message: `${username} used inappropriate content: "${content}"`,
      severity: 'high'
    });
  }, [sendNotification]);

  const notifyTeacherCreated = useCallback((teacherName: string, createdBy: string) => {
    sendNotification({
      type: 'teacher_created',
      title: 'Teacher Account Created',
      message: `${createdBy} created a new teacher account: ${teacherName}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  const notifyResultUploaded = useCallback((teacherName: string, classLevel: string, subject: string) => {
    sendNotification({
      type: 'result_uploaded',
      title: 'Results Uploaded',
      message: `${teacherName} uploaded ${subject} results for ${classLevel}`,
      severity: 'low'
    });
  }, [sendNotification]);

  const notifyAnnouncementCreated = useCallback((creatorName: string, title: string) => {
    sendNotification({
      type: 'announcement_created',
      title: 'New Announcement',
      message: `${creatorName} created an announcement: "${title}"`,
      severity: 'medium'
    });
  }, [sendNotification]);

  return {
    sendNotification,
    notifyLogin,
    notifySignup,
    notifyExamCompleted,
    notifyExamCreated,
    notifyHomeworkAssigned,
    notifyHomeworkSubmitted,
    notifyVideoUploaded,
    notifyVideoApproved,
    notifyOrderPlaced,
    notifyContentAlert,
    notifyTeacherCreated,
    notifyResultUploaded,
    notifyAnnouncementCreated
  };
};
