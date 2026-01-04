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
  | 'video_rejected'
  | 'order_placed'
  | 'content_alert'
  | 'teacher_created'
  | 'student_created'
  | 'admin_created'
  | 'result_uploaded'
  | 'announcement_created'
  | 'event_approved'
  | 'event_deleted'
  | 'teacher_deactivated'
  | 'event_reminder'
  | 'class_created'
  | 'suspension_requested'
  | 'suspension_approved'
  | 'call_notification'
  | 'message_notification'
  | 'new_user';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  userId?: string;
  username?: string;
  severity?: 'low' | 'medium' | 'high';
  relatedId?: string;
  targetUserId?: string; // For notifications to specific users
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
          related_order_id: payload.relatedId || null,
          target_admin_id: payload.targetUserId || null
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

  // I. Once an event has been approved by an admin
  const notifyEventApproved = useCallback((eventTitle: string, approvedBy: string) => {
    sendNotification({
      type: 'event_approved',
      title: 'Event Approved',
      message: `Event "${eventTitle}" has been approved by ${approvedBy}`,
      severity: 'low'
    });
  }, [sendNotification]);

  // II. Once a user deletes an event
  const notifyEventDeleted = useCallback((eventTitle: string, deletedBy: string) => {
    sendNotification({
      type: 'event_deleted',
      title: 'Event Deleted',
      message: `Event "${eventTitle}" has been deleted by ${deletedBy}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  // III. When a student creates an account
  const notifyStudentSignup = useCallback((studentName: string) => {
    sendNotification({
      type: 'signup',
      title: 'New Student Registration',
      message: `New student account created: ${studentName}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  // IV. When an admin creates an account
  const notifyAdminCreated = useCallback((adminName: string, createdBy: string) => {
    sendNotification({
      type: 'admin_created',
      title: 'New Admin Account',
      message: `${createdBy} created a new admin account: ${adminName}`,
      severity: 'high'
    });
  }, [sendNotification]);

  // V. When a user logs in (students, teacher or admin)
  const notifyLogin = useCallback((username: string, role: string, device?: string, location?: string) => {
    sendNotification({
      type: 'login',
      title: 'User Login',
      message: `${username} (${role}) logged in${device ? ` from ${device}` : ''}${location ? ` (${location})` : ''}`,
      severity: 'low'
    });
  }, [sendNotification]);

  // VI. When a teacher account has been created
  const notifyTeacherCreated = useCallback((teacherName: string, createdBy: string) => {
    sendNotification({
      type: 'teacher_created',
      title: 'Teacher Account Created',
      message: `${createdBy} created a new teacher account: ${teacherName}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  // VII. When an admin deactivates a teacher account
  const notifyTeacherDeactivated = useCallback((teacherName: string, adminName: string, teacherId?: string) => {
    sendNotification({
      type: 'teacher_deactivated',
      title: 'Teacher Account Deactivated',
      message: `${adminName} deactivated teacher account: ${teacherName}`,
      severity: 'high',
      targetUserId: teacherId
    });
  }, [sendNotification]);

  // VIII. When an admin approves or rejects a video
  const notifyVideoApproved = useCallback((videoTitle: string, teacherId?: string) => {
    sendNotification({
      type: 'video_approved',
      title: 'Video Approved',
      message: `Video "${videoTitle}" has been approved and is now live for students`,
      severity: 'low',
      targetUserId: teacherId
    });
  }, [sendNotification]);

  const notifyVideoRejected = useCallback((videoTitle: string, reason: string, teacherId?: string) => {
    sendNotification({
      type: 'video_rejected',
      title: 'Video Rejected',
      message: `Video "${videoTitle}" was rejected. Reason: ${reason}`,
      severity: 'medium',
      targetUserId: teacherId
    });
  }, [sendNotification]);

  // IX. Reminder of upcoming events
  const notifyEventReminder = useCallback((eventTitle: string, eventTime: string, eventLocation: string) => {
    sendNotification({
      type: 'event_reminder',
      title: 'Upcoming Event Reminder',
      message: `Reminder: "${eventTitle}" is scheduled for ${eventTime} at ${eventLocation}`,
      severity: 'medium'
    });
  }, [sendNotification]);

  // X. When a teacher assigns homework
  const notifyHomeworkAssigned = useCallback((teacherName: string, subject: string, classLevel: string) => {
    sendNotification({
      type: 'homework_assigned',
      title: 'Homework Assigned',
      message: `${teacherName} assigned homework for ${subject} (${classLevel})`,
      severity: 'low'
    });
  }, [sendNotification]);

  // XI. When an admin creates a class
  const notifyClassCreated = useCallback((className: string, classLevel: string, adminName: string) => {
    sendNotification({
      type: 'class_created',
      title: 'New Class Created',
      message: `${adminName} created a new class: ${className} (${classLevel})`,
      severity: 'low'
    });
  }, [sendNotification]);

  // XII. When a teacher creates a student
  const notifyStudentCreated = useCallback((studentName: string, teacherName: string, classLevel: string) => {
    sendNotification({
      type: 'student_created',
      title: 'New Student Created',
      message: `${teacherName} created a new student: ${studentName} in ${classLevel}`,
      severity: 'low'
    });
  }, [sendNotification]);

  // XIII. When a new user comes into Priscilla Connect
  const notifyNewUser = useCallback((username: string, action: 'signup' | 'signin', role: string) => {
    sendNotification({
      type: 'new_user',
      title: action === 'signup' ? 'New User Signup' : 'User Sign In',
      message: `${username} (${role}) ${action === 'signup' ? 'signed up to' : 'signed into'} Priscilla Connect`,
      severity: action === 'signup' ? 'medium' : 'low'
    });
  }, [sendNotification]);

  // XIV. When a teacher requests suspension on a student
  const notifySuspensionRequested = useCallback((studentName: string, teacherName: string, reason: string) => {
    sendNotification({
      type: 'suspension_requested',
      title: 'Student Suspension Requested',
      message: `${teacherName} requested suspension for ${studentName}. Reason: ${reason}`,
      severity: 'high'
    });
  }, [sendNotification]);

  // XV. When an admin approves suspension
  const notifySuspensionApproved = useCallback((studentName: string, adminName: string) => {
    sendNotification({
      type: 'suspension_approved',
      title: 'Student Suspension Approved',
      message: `${adminName} approved suspension for ${studentName}`,
      severity: 'high'
    });
  }, [sendNotification]);

  // XVI. When a user calls another user
  const notifyCall = useCallback((callerName: string, receiverName: string, callType: 'audio' | 'video') => {
    sendNotification({
      type: 'call_notification',
      title: `${callType === 'video' ? 'Video' : 'Voice'} Call`,
      message: `${callerName} made a ${callType} call to ${receiverName}`,
      severity: 'low'
    });
  }, [sendNotification]);

  // XVII. When a user sends a message
  const notifyMessage = useCallback((senderName: string, receiverName: string) => {
    sendNotification({
      type: 'message_notification',
      title: 'New Message',
      message: `${senderName} sent a message to ${receiverName}`,
      severity: 'low'
    });
  }, [sendNotification]);

  // XVIII. When a teacher creates an examination
  const notifyExamCreated = useCallback((teacherName: string, examTitle: string) => {
    sendNotification({
      type: 'exam_created',
      title: 'New Exam Created',
      message: `${teacherName} created a new exam: "${examTitle}"`,
      severity: 'medium'
    });
  }, [sendNotification]);

  // XIX. When a student finishes an exam
  const notifyExamCompleted = useCallback((studentName: string, examTitle: string, score: number) => {
    sendNotification({
      type: 'exam_completed',
      title: 'Exam Completed',
      message: `${studentName} completed "${examTitle}" with score: ${score}%`,
      severity: 'low'
    });
  }, [sendNotification]);

  // Additional helpers from before
  const notifySignup = useCallback((username: string, role: string) => {
    sendNotification({
      type: 'signup',
      title: 'New User Registration',
      message: `New ${role} account created: ${username}`,
      severity: 'medium'
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

  const notifyOrderPlaced = useCallback((customerName: string, totalAmount: number, orderId: string) => {
    sendNotification({
      type: 'order_placed',
      title: 'New Store Order',
      message: `${customerName} placed an order for ₦${totalAmount.toLocaleString()}`,
      severity: 'medium',
      relatedId: orderId
    });
  }, [sendNotification]);

  const notifyContentAlert = useCallback((username: string, content: string, level?: string) => {
    sendNotification({
      type: 'content_alert',
      title: `Content Alert${level ? ` (${level})` : ''}`,
      message: `${username} used inappropriate content: "${content}"`,
      severity: 'high'
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
    notifyStudentSignup,
    notifyAdminCreated,
    notifyExamCompleted,
    notifyExamCreated,
    notifyHomeworkAssigned,
    notifyHomeworkSubmitted,
    notifyVideoUploaded,
    notifyVideoApproved,
    notifyVideoRejected,
    notifyOrderPlaced,
    notifyContentAlert,
    notifyTeacherCreated,
    notifyTeacherDeactivated,
    notifyResultUploaded,
    notifyAnnouncementCreated,
    notifyEventApproved,
    notifyEventDeleted,
    notifyEventReminder,
    notifyClassCreated,
    notifyStudentCreated,
    notifyNewUser,
    notifySuspensionRequested,
    notifySuspensionApproved,
    notifyCall,
    notifyMessage
  };
};
