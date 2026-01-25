import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Send, Phone, Video, MoreVertical, CheckCheck, Check, Mic, Paperclip, MessageSquare, AlertTriangle, Trash2, PhoneMissed, PhoneIncoming, X, Users, Plus, UserMinus, UserPlus, Edit2, VideoIcon, PhoneCall, Download, Play, Pause, FileText, Image, Music } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import FileUpload from '@/components/chat/FileUpload';
import CallInterface from '@/components/chat/CallInterface';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { checkContent, getLevelColor, getLevelLabel } from '@/lib/contentMonitoring';

interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'voice' | 'file' | 'image';
  is_read: boolean;
  created_at: string;
  file_url?: string;
  file_name?: string;
  is_deleted_by_sender?: boolean;
  is_deleted_by_receiver?: boolean;
}

interface IncomingCall {
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  callType: 'audio' | 'video';
}

interface MissedCall {
  id: string;
  caller_id: string;
  caller_name: string;
  call_type: string;
  created_at: string;
  is_seen: boolean;
}

interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  created_by: string;
  avatar_url?: string;
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  user_id: string;
  is_admin: boolean;
  user_name?: string;
}

interface GroupMessage {
  id: string;
  group_id: string;
  sender_id: string;
  sender_name?: string;
  content: string;
  message_type: string;
  created_at: string;
}

const Messages = () => {
  const { user } = useAuth();
  const { notifyContentAlert, notifyCall, notifyMessage } = useNotificationSystem();
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    contact: ChatUser;
    type: 'audio' | 'video';
    status: 'calling' | 'ringing' | 'active' | 'ended';
  } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [missedCalls, setMissedCalls] = useState<MissedCall[]>([]);
  const [showMissedCalls, setShowMissedCalls] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [contentWarning, setContentWarning] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('chats');
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [groupCallActive, setGroupCallActive] = useState<{ type: 'audio' | 'video' } | null>(null);
  const [showGroupVoiceRecorder, setShowGroupVoiceRecorder] = useState(false);
  const [showGroupFileUpload, setShowGroupFileUpload] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [groupUnreadCounts, setGroupUnreadCounts] = useState<Record<string, number>>({});
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Task G: Fetch all users from the system - Get ALL users with profiles
  // Fixed to show ALL users (students, teachers, admins) to everyone for chat
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        // First get all user roles
        const { data: allRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }

        if (!allRoles || allRoles.length === 0) {
          console.log('No user roles found');
          setIsLoading(false);
          return;
        }

        // Get all profiles
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, avatar, is_suspended');

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        // Create a map of profiles for quick lookup
        const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || []);

        // Task G FIX: Combine profiles with roles - include ALL users regardless of role
        // Students, teachers, and admins should all be able to see each other
        const usersWithRoles: ChatUser[] = [];
        
        for (const role of allRoles) {
          // Skip current user (they don't need to chat with themselves)
          if (role.user_id === user.id) continue;
          
          const profile = profileMap.get(role.user_id);
          
          // Skip suspended users - they shouldn't appear in chat
          if (profile?.is_suspended === true) continue;
          
          // Include ALL users with valid roles (student, teacher, admin)
          usersWithRoles.push({
            id: role.user_id,
            name: profile?.name || 'User',
            email: '',
            avatar: profile?.avatar || undefined,
            role: role.role || 'student',
            isOnline: false
          });
        }

        console.log('Priscilla Chat - Loaded users:', usersWithRoles.length, 'users (excluding current user and suspended)');
        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
    fetchGroups();
    // Task E: Fetch unread counts
    fetchUnreadCounts();
    // Task D: Fetch group unread counts
    fetchGroupUnreadCounts();
  }, [user]);

  // Task D: Fetch group unread message counts
  const fetchGroupUnreadCounts = async () => {
    if (!user) return;
    
    try {
      // Get all group memberships
      const { data: memberData } = await supabase
        .from('chat_group_members')
        .select('group_id, joined_at')
        .eq('user_id', user.id);

      if (!memberData || memberData.length === 0) return;

      const counts: Record<string, number> = {};
      const lastReadKey = 'priscilla_group_last_read';
      const lastReadData = JSON.parse(localStorage.getItem(lastReadKey) || '{}');

      for (const membership of memberData) {
        const lastRead = lastReadData[membership.group_id] || membership.joined_at;
        
        const { count, error } = await supabase
          .from('chat_group_messages')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', membership.group_id)
          .neq('sender_id', user.id)
          .gt('created_at', lastRead);

        if (!error && count && count > 0) {
          counts[membership.group_id] = count;
        }
      }

      setGroupUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching group unread counts:', error);
    }
  };

  // Task D: Mark group as read
  const markGroupAsRead = (groupId: string) => {
    const lastReadKey = 'priscilla_group_last_read';
    const lastReadData = JSON.parse(localStorage.getItem(lastReadKey) || '{}');
    lastReadData[groupId] = new Date().toISOString();
    localStorage.setItem(lastReadKey, JSON.stringify(lastReadData));
    
    setGroupUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[groupId];
      return newCounts;
    });
  };

  // Task E: Fetch unread message counts for each user
  const fetchUnreadCounts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('sender_id')
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .eq('is_deleted_by_receiver', false);
      
      if (error) throw error;
      
      // Count unread messages per sender
      const counts: Record<string, number> = {};
      (data || []).forEach(msg => {
        counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
      });
      
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('chat_group_members')
        .select('group_id, is_admin')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (memberData && memberData.length > 0) {
        const groupIds = memberData.map(m => m.group_id);
        
        const { data: groupsData, error: groupsError } = await supabase
          .from('chat_groups')
          .select('*')
          .in('id', groupIds);

        if (groupsError) throw groupsError;

        const groupsWithMembers: ChatGroup[] = [];
        for (const group of groupsData || []) {
          const { data: members } = await supabase
            .from('chat_group_members')
            .select('id, user_id, is_admin')
            .eq('group_id', group.id);

          groupsWithMembers.push({
            ...group,
            members: members || []
          });
        }

        setGroups(groupsWithMembers);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  // Fetch missed calls
  useEffect(() => {
    const fetchMissedCalls = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('missed_calls')
          .select('*')
          .eq('receiver_id', user.id)
          .eq('is_seen', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        const missedCallsWithNames: MissedCall[] = [];
        for (const call of data || []) {
          const caller = users.find(u => u.id === call.caller_id);
          missedCallsWithNames.push({
            ...call,
            caller_name: caller?.name || 'Unknown'
          });
        }
        setMissedCalls(missedCallsWithNames);
      } catch (error) {
        console.error('Error fetching missed calls:', error);
      }
    };

    if (users.length > 0) {
      fetchMissedCalls();
    }
  }, [user, users]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Task M: Real-time presence tracking using Supabase Realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence: any) => {
            if (presence.user_id && presence.user_id !== user.id) {
              onlineIds.add(presence.user_id);
            }
          });
        });
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        newPresences.forEach((presence: any) => {
          if (presence.user_id && presence.user_id !== user.id) {
            setOnlineUsers(prev => new Set([...prev, presence.user_id]));
          }
        });
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        leftPresences.forEach((presence: any) => {
          if (presence.user_id) {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(presence.user_id);
              return newSet;
            });
          }
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load messages when user is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser || !user) return;

      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          setMessages([]);
          return;
        }

        const filteredMessages: Message[] = (data || []).filter((msg: any) => {
          if (msg.sender_id === user.id && msg.is_deleted_by_sender) return false;
          if (msg.receiver_id === user.id && msg.is_deleted_by_receiver) return false;
          return true;
        }).map((msg: any) => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'voice' | 'file' | 'image'
        }));

        setMessages(filteredMessages);
        
        // Task E: Mark messages as read when chat is opened and clear unread count
        const unreadMessageIds = (data || [])
          .filter((msg: any) => msg.receiver_id === user.id && !msg.is_read)
          .map((msg: any) => msg.id);
        
        if (unreadMessageIds.length > 0) {
          await supabase
            .from('chat_messages')
            .update({ is_read: true })
            .in('id', unreadMessageIds);
          
          // Clear unread count for this user
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser.id];
            return newCounts;
          });
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
  }, [selectedUser, user]);

  // Content monitoring function with 4-level classification
  const checkMessageContent = useCallback((content: string): boolean => {
    const result = checkContent(content);

    if (result.isBlocked) {
      setContentWarning(result.message);
      notifyContentAlert(user?.name || 'Unknown', result.foundWords.join(', '), 'Critical');
      return false;
    }

    if (result.level === 'high') {
      setContentWarning(result.message);
      notifyContentAlert(user?.name || 'Unknown', result.foundWords.join(', '), 'High');
      // Still allow sending but show warning
      return true;
    }

    if (result.level === 'moderate') {
      setContentWarning(result.message);
      notifyContentAlert(user?.name || 'Unknown', result.foundWords.join(', '), 'Moderate');
      return true;
    }

    if (result.level === 'sensitive') {
      setContentWarning(result.message);
      notifyContentAlert(user?.name || 'Unknown', result.foundWords.join(', '), 'Sensitive');
      return true;
    }

    return true;
  }, [user, notifyContentAlert]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !user) return;

    const contentResult = checkContent(newMessage);
    
    // Block critical content
    if (contentResult.isBlocked) {
      setContentWarning(contentResult.message);
      notifyContentAlert(user.name || 'Unknown', contentResult.foundWords.join(', '), 'Critical');
      toast.error('Message blocked due to inappropriate content');
      return;
    }

    // Show warning for other levels but allow sending
    if (contentResult.level) {
      setContentWarning(contentResult.message);
      notifyContentAlert(user.name || 'Unknown', contentResult.foundWords.join(', '), getLevelLabel(contentResult.level));
    }

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: newMessage,
      message_type: 'text',
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        is_read: false
      });

      // Send notification
      notifyMessage(user.name || 'User', selectedUser.name);
    } catch (error) {
      console.error('Error saving message:', error);
    }

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    setNewMessage('');

    setTimeout(() => {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, is_read: true } : m
      ));
    }, 2000);
  };

  const handleSendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedUser || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: `Voice message (${Math.round(duration)}s)`,
      message_type: 'voice',
      is_read: false,
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        is_read: false
      });
    } catch (error) {
      console.error('Error saving voice message:', error);
    }

    setMessages(prev => [...prev, message]);
    setShowVoiceRecorder(false);
  };

  const handleSendFile = async (file: File, fileInfo: any) => {
    if (!selectedUser || !user) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: `Sent a file: ${fileInfo.name}`,
      message_type: 'file',
      is_read: false,
      created_at: new Date().toISOString(),
      file_name: fileInfo.name
    };

    try {
      await supabase.from('chat_messages').insert({
        id: message.id,
        sender_id: message.sender_id,
        receiver_id: message.receiver_id,
        content: message.content,
        message_type: message.message_type,
        file_name: message.file_name,
        is_read: false
      });
    } catch (error) {
      console.error('Error saving file message:', error);
    }

    setMessages(prev => [...prev, message]);
    setShowFileUpload(false);
  };

  const handleDeleteChat = async () => {
    if (!selectedUser || !user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_deleted_by_sender: true })
        .eq('sender_id', user.id)
        .eq('receiver_id', selectedUser.id);

      await supabase
        .from('chat_messages')
        .update({ is_deleted_by_receiver: true })
        .eq('sender_id', selectedUser.id)
        .eq('receiver_id', user.id);

      setMessages([]);
      setShowDeleteDialog(false);
      toast.success('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  // Task G: Delete individual message (soft delete for security)
  const handleDeleteSingleMessage = async (messageId: string) => {
    if (!user) return;

    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      if (message.sender_id === user.id) {
        await supabase
          .from('chat_messages')
          .update({ is_deleted_by_sender: true })
          .eq('id', messageId);
      } else {
        await supabase
          .from('chat_messages')
          .update({ is_deleted_by_receiver: true })
          .eq('id', messageId);
      }

      // Remove from UI immediately (silent delete - Task I)
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  // Task J: Check if message can be edited (within 10 minutes of sending)
  const canEditMessage = (message: Message): boolean => {
    if (message.sender_id !== user?.id) return false;
    const messageTime = new Date(message.created_at).getTime();
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    return (now - messageTime) < tenMinutes;
  };

  // Task J: Handle editing a message
  const handleStartEdit = (message: Message) => {
    if (!canEditMessage(message)) return;
    setEditingMessageId(message.id);
    setEditedContent(message.content);
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editedContent.trim() || !user) return;

    // Check content monitoring
    const contentResult = checkContent(editedContent);
    if (contentResult.isBlocked) {
      setContentWarning(contentResult.message);
      toast.error('Message blocked due to inappropriate content');
      return;
    }

    try {
      await supabase
        .from('chat_messages')
        .update({ content: editedContent.trim() })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: editedContent.trim() } : m
      ));
      setEditingMessageId(null);
      setEditedContent('');
      toast.success('Message updated');
    } catch (error) {
      console.error('Error editing message:', error);
      toast.error('Failed to edit message');
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const startCall = (type: 'audio' | 'video') => {
    if (!selectedUser || !user) return;
    
    // Notify about the call
    notifyCall(user.name || 'User', selectedUser.name, type);
    
    // Check if user is online - show "Calling..." or "Ringing..."
    const isReceiverOnline = onlineUsers.has(selectedUser.id);
    
    setActiveCall({
      contact: selectedUser,
      type,
      status: 'calling'
    });

    // Task F: No auto end call - only update status based on online state
    // User controls when to end the call manually
    setTimeout(() => {
      if (isReceiverOnline) {
        setActiveCall(prev => prev ? { ...prev, status: 'ringing' } : null);
      } else {
        // Record missed call but do NOT auto-end the call
        supabase.from('missed_calls').insert({
          caller_id: user?.id,
          receiver_id: selectedUser.id,
          call_type: type
        }).then(() => {
          toast.info(`${selectedUser.name} is offline. They will see a missed call notification.`);
        });
        // Keep showing calling status - user can manually end the call
        setActiveCall(prev => prev ? { ...prev, status: 'calling' } : null);
      }
    }, 2000);
  };

  const answerCall = () => {
    if (!incomingCall) return;

    const caller = users.find(u => u.id === incomingCall.callerId);
    if (!caller) return;

    setActiveCall({
      contact: caller,
      type: incomingCall.callType,
      status: 'active'
    });
    setIncomingCall(null);
  };

  const declineCall = async () => {
    if (!incomingCall || !user) return;

    try {
      await supabase.from('missed_calls').insert({
        caller_id: incomingCall.callerId,
        receiver_id: user.id,
        call_type: incomingCall.callType
      });
    } catch (error) {
      console.error('Error recording missed call:', error);
    }

    setIncomingCall(null);
  };

  const endCall = () => {
    setActiveCall(null);
  };

  const markMissedCallsSeen = async () => {
    if (!user) return;

    try {
      await supabase
        .from('missed_calls')
        .update({ is_seen: true })
        .eq('receiver_id', user.id)
        .eq('is_seen', false);

      setMissedCalls([]);
      setShowMissedCalls(false);
    } catch (error) {
      console.error('Error marking missed calls as seen:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary text-primary-foreground';
      case 'teacher': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateGroup = async () => {
    if (!user || !newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      const { data: groupData, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      await supabase.from('chat_group_members').insert({
        group_id: groupData.id,
        user_id: user.id,
        is_admin: true
      });

      for (const memberId of selectedMembers) {
        await supabase.from('chat_group_members').insert({
          group_id: groupData.id,
          user_id: memberId,
          is_admin: false
        });
      }

      toast.success('Group created successfully!');
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedMembers([]);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleAddMemberToGroup = async (memberId: string) => {
    if (!selectedGroup || !user) return;

    // Check if current user is admin
    const currentUserMember = selectedGroup.members.find(m => m.user_id === user.id);
    const isAdmin = user.role === 'admin' || currentUserMember?.is_admin;

    if (!isAdmin) {
      toast.error('Only group admins can add members');
      return;
    }

    // Check if already member
    if (selectedGroup.members.some(m => m.user_id === memberId)) {
      toast.error('User is already a member');
      return;
    }

    try {
      await supabase.from('chat_group_members').insert({
        group_id: selectedGroup.id,
        user_id: memberId,
        is_admin: false
      });

      toast.success('Member added successfully');
      setShowAddMembers(false);
      setAddMemberSearch('');
      fetchGroups();
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (memberId: string, groupId: string) => {
    if (!user) return;

    const group = groups.find(g => g.id === groupId);
    const currentUserMember = group?.members.find(m => m.user_id === user.id);
    const isAdmin = user.role === 'admin' || currentUserMember?.is_admin;

    if (!isAdmin) {
      toast.error('Only group admins can remove members');
      return;
    }

    try {
      await supabase
        .from('chat_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      toast.success('Member removed');
      fetchGroups();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleMakeAdmin = async (memberId: string, groupId: string) => {
    if (!user) return;

    const group = groups.find(g => g.id === groupId);
    const currentUserMember = group?.members.find(m => m.user_id === user.id);
    const isAdmin = user.role === 'admin' || currentUserMember?.is_admin;

    if (!isAdmin) {
      toast.error('Only group admins can promote members');
      return;
    }

    try {
      await supabase
        .from('chat_group_members')
        .update({ is_admin: true })
        .eq('group_id', groupId)
        .eq('user_id', memberId);

      toast.success('Member promoted to admin');
      fetchGroups();
    } catch (error) {
      console.error('Error promoting member:', error);
      toast.error('Failed to promote member');
    }
  };

  const loadGroupMessages = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_group_messages')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames: GroupMessage[] = [];
      for (const msg of data || []) {
        const sender = users.find(u => u.id === msg.sender_id);
        messagesWithNames.push({
          ...msg,
          sender_name: sender?.name || 'Unknown'
        });
      }

      setGroupMessages(messagesWithNames);
    } catch (error) {
      console.error('Error loading group messages:', error);
    }
  };

  const handleSendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || !user) return;

    // Content monitoring for group chat
    const contentResult = checkContent(newMessage);
    
    if (contentResult.isBlocked) {
      setContentWarning(contentResult.message);
      notifyContentAlert(user.name || 'Unknown', contentResult.foundWords.join(', '), 'Critical');
      toast.error('Message blocked due to inappropriate content');
      return;
    }

    if (contentResult.level) {
      setContentWarning(contentResult.message);
      notifyContentAlert(user.name || 'Unknown', contentResult.foundWords.join(', '), getLevelLabel(contentResult.level));
    }

    try {
      const { error } = await supabase.from('chat_group_messages').insert({
        group_id: selectedGroup.id,
        sender_id: user.id,
        content: newMessage,
        message_type: 'text'
      });

      if (error) throw error;

      setNewMessage('');
      setContentWarning(null);
      loadGroupMessages(selectedGroup.id);
    } catch (error) {
      console.error('Error sending group message:', error);
      toast.error('Failed to send message');
    }
  };

  // Task H: Handle voice message for groups
  const handleSendGroupVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedGroup || !user) return;

    try {
      const { error } = await supabase.from('chat_group_messages').insert({
        group_id: selectedGroup.id,
        sender_id: user.id,
        content: `Voice message (${Math.round(duration)}s)`,
        message_type: 'voice'
      });

      if (error) throw error;

      setShowGroupVoiceRecorder(false);
      loadGroupMessages(selectedGroup.id);
      toast.success('Voice message sent!');
    } catch (error) {
      console.error('Error sending group voice message:', error);
      toast.error('Failed to send voice message');
    }
  };

  // Task H: Handle file upload for groups
  const handleSendGroupFile = async (file: File, fileInfo: any) => {
    if (!selectedGroup || !user) return;

    try {
      const { error } = await supabase.from('chat_group_messages').insert({
        group_id: selectedGroup.id,
        sender_id: user.id,
        content: `Sent a file: ${fileInfo.name}`,
        message_type: 'file',
        file_name: fileInfo.name
      });

      if (error) throw error;

      setShowGroupFileUpload(false);
      loadGroupMessages(selectedGroup.id);
      toast.success('File sent!');
    } catch (error) {
      console.error('Error sending group file:', error);
      toast.error('Failed to send file');
    }
  };

  // Task A: Delete group handler
  const handleDeleteGroup = async () => {
    if (!selectedGroup || !user) return;
    
    // Only creator can delete
    if (selectedGroup.created_by !== user.id) {
      toast.error('Only the group creator can delete this group');
      return;
    }

    try {
      // Delete all members first
      await supabase.from('chat_group_members').delete().eq('group_id', selectedGroup.id);
      
      // Delete all messages
      await supabase.from('chat_group_messages').delete().eq('group_id', selectedGroup.id);
      
      // Delete the group
      const { error } = await supabase.from('chat_groups').delete().eq('id', selectedGroup.id);
      
      if (error) throw error;
      
      toast.success('Group deleted successfully');
      setSelectedGroup(null);
      setShowDeleteGroupDialog(false);
      fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  // Task B: Start group call
  const startGroupCall = (type: 'audio' | 'video') => {
    if (!selectedGroup) return;
    
    toast.info(`Starting ${type} call with ${selectedGroup.members.length} members...`);
    setGroupCallActive({ type });
    
    // In a real implementation, this would integrate with WebRTC or a calling service
    // For now, show a notification to all group members
    notifyCall(user?.name || 'User', selectedGroup.name, type);
  };

  // Get available users for adding to group
  const getAvailableUsersForGroup = () => {
    if (!selectedGroup) return [];
    const memberIds = selectedGroup.members.map(m => m.user_id);
    return users.filter(u => 
      !memberIds.includes(u.id) && 
      u.name.toLowerCase().includes(addMemberSearch.toLowerCase())
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Please log in to access Priscilla Chat</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading Priscilla Chat...</p>
        </div>
      </div>
    );
  }

  // Active Call View
  if (activeCall) {
    return (
      <CallInterface
        contact={{
          id: activeCall.contact.id,
          name: activeCall.contact.name,
          phone: '',
          avatar: activeCall.contact.avatar
        }}
        callType={activeCall.type}
        callStatus={activeCall.status}
        onEndCall={endCall}
        onToggleMic={() => {}}
        onToggleVideo={() => {}}
      />
    );
  }

  // Contact list view
  if (!selectedUser && !selectedGroup) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-gradient-hero text-white py-4 px-4 sm:py-6 sm:px-6 shadow-medium sticky top-0 z-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 px-2 sm:px-3">
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                  </Button>
                </Link>
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                  <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-3xl font-bold">Priscilla Chat</h1>
                  <p className="text-white/80 text-xs sm:text-sm">Connect with teachers, students & admins</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                  onClick={() => setShowCreateGroup(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">New Group</span>
                </Button>

                {missedCalls.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20 relative"
                    onClick={() => setShowMissedCalls(true)}
                  >
                    <PhoneMissed className="h-5 w-5" />
                    <Badge className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs h-5 w-5 p-0 flex items-center justify-center">
                      {missedCalls.length}
                    </Badge>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <section className="py-4 sm:py-6 px-4 sm:px-6 flex-1">
          <div className="max-w-2xl mx-auto">
            <div className="mb-4 sm:mb-6">
              <Input
                placeholder="Search users or groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="chats" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chats ({users.length})
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groups ({groups.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chats">
                <Card className="shadow-soft">
                  <CardHeader className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold">Available Users</h2>
                    <p className="text-sm text-muted-foreground">{users.length} users on Priscilla Chat</p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredUsers.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          {users.length === 0 
                            ? "No other users found. Users will appear here once they complete their profile."
                            : "No users match your search."}
                        </div>
                      ) : (
                        filteredUsers.map((chatUser) => (
                          <div
                            key={chatUser.id}
                            className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedUser(chatUser)}
                          >
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                              <AvatarImage src={chatUser.avatar} />
                              <AvatarFallback className="text-sm">
                                {chatUser.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-foreground text-sm sm:text-base truncate">{chatUser.name}</p>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Task E: Unread message badge with soft pink color and pulse animation */}
                                  {unreadCounts[chatUser.id] > 0 && (
                                    <Badge 
                                      className="bg-pink-400 text-white animate-pulse text-xs min-w-[20px] h-5 flex items-center justify-center"
                                    >
                                      {unreadCounts[chatUser.id]}
                                    </Badge>
                                  )}
                                  <Badge className={getRoleBadgeColor(chatUser.role)} variant="secondary">
                                    {chatUser.role}
                                  </Badge>
                                  {onlineUsers.has(chatUser.id) && (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 text-xs">
                                      Online
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {unreadCounts[chatUser.id] > 0 
                                  ? `${unreadCounts[chatUser.id]} new message${unreadCounts[chatUser.id] > 1 ? 's' : ''}`
                                  : 'Click to start chatting'}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups">
                <Card className="shadow-soft">
                  <CardHeader className="p-4 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-semibold">Your Groups</h2>
                    <p className="text-sm text-muted-foreground">
                      {groups.length === 0 ? 'Create a group to start chatting!' : `${groups.length} group(s)`}
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {filteredGroups.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No groups yet. Click "New Group" to create one!</p>
                        </div>
                      ) : (
                        filteredGroups.map((group) => (
                          <div
                            key={group.id}
                            className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedGroup(group);
                              loadGroupMessages(group.id);
                              markGroupAsRead(group.id);
                            }}
                          >
                            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-primary">
                              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                                <Users className="h-5 w-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-foreground text-sm sm:text-base truncate">{group.name}</p>
                                <div className="flex items-center gap-2">
                                  {/* Task D: Group unread badge */}
                                  {groupUnreadCounts[group.id] > 0 && (
                                    <Badge 
                                      className="bg-pink-400 text-white animate-pulse text-xs min-w-[20px] h-5 flex items-center justify-center"
                                    >
                                      {groupUnreadCounts[group.id]}
                                    </Badge>
                                  )}
                                  <Badge variant="secondary" className="text-xs">
                                    {group.members?.length || 0} members
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                {groupUnreadCounts[group.id] > 0 
                                  ? `${groupUnreadCounts[group.id]} new message${groupUnreadCounts[group.id] > 1 ? 's' : ''}`
                                  : (group.description || 'Group chat')}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Create Group Dialog */}
        <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Create New Group
              </DialogTitle>
              <DialogDescription>Create a study group or connect with your classmates</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Group Name *</label>
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., WAEC Study Group"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Add Members</label>
                <ScrollArea className="h-40 border rounded-md p-2">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {u.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{u.name}</span>
                        <Badge variant="outline" className="text-xs">{u.role}</Badge>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, u.id]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Missed Calls Dialog */}
        <Dialog open={showMissedCalls} onOpenChange={setShowMissedCalls}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PhoneMissed className="h-5 w-5 text-destructive" />
                Missed Calls
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {missedCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <PhoneIncoming className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="font-medium">{call.caller_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {call.call_type} call • {new Date(call.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={markMissedCallsSeen}>Mark all as seen</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Group Chat view
  if (selectedGroup) {
    const currentUserMember = selectedGroup.members.find(m => m.user_id === user.id);
    const isGroupAdmin = user.role === 'admin' || currentUserMember?.is_admin;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-gradient-hero text-white py-4 px-6 shadow-medium sticky top-0 z-50">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setSelectedGroup(null)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10 bg-white/20">
              <AvatarFallback>
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">{selectedGroup.name}</h2>
                <Badge variant="secondary" className="text-xs">
                  {selectedGroup.members?.length || 0} members
                </Badge>
              </div>
              <p className="text-sm text-white/80">
                {selectedGroup.description || 'Group chat'}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowManageMembers(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
              {isGroupAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => setShowAddMembers(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Members
                    </DropdownMenuItem>
                    {/* Task B: Group calls */}
                    <DropdownMenuItem onClick={() => startGroupCall('audio')}>
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Voice Call
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => startGroupCall('video')}>
                      <VideoIcon className="h-4 w-4 mr-2" />
                      Video Call
                    </DropdownMenuItem>
                    {/* Task A: Delete group option for creator/admin */}
                    {selectedGroup.created_by === user.id && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setShowDeleteGroupDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {contentWarning && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{contentWarning}</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-auto text-destructive"
              onClick={() => setContentWarning(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {groupMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              groupMessages.map((message) => {
                const isVoiceMessage = message.message_type === 'voice';
                const isFileMessage = message.message_type === 'file';
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        message.sender_id === user.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {message.sender_id !== user.id && (
                        <p className="text-xs font-medium mb-1 opacity-70">{message.sender_name}</p>
                      )}
                      
                      {/* Task D: Voice message with playback */}
                      {isVoiceMessage ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-full"
                            onClick={() => toast.info('Voice playback feature - audio data not stored')}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">{message.content}</span>
                        </div>
                      ) : isFileMessage ? (
                        /* Task B: File message with download info */
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{message.content}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toast.info('File download - file_url storage required')}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        message.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        <span className="text-xs">
                          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Task H: Group voice recorder */}
        {showGroupVoiceRecorder && (
          <div className="border-t p-2">
            <VoiceRecorder
              onSendVoiceMessage={handleSendGroupVoiceMessage}
              onCancel={() => setShowGroupVoiceRecorder(false)}
            />
          </div>
        )}

        {/* Task H: Group file upload */}
        {showGroupFileUpload && (
          <div className="border-t p-2">
            <FileUpload
              onSendFile={handleSendGroupFile}
              onCancel={() => setShowGroupFileUpload(false)}
            />
          </div>
        )}

        {!showGroupVoiceRecorder && !showGroupFileUpload && (
          <div className="border-t p-4">
            <form onSubmit={handleSendGroupMessage} className="flex space-x-2">
              {/* Task H: Voice and file buttons for groups */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupVoiceRecorder(true)}
                className="flex-shrink-0"
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowGroupFileUpload(true)}
                className="flex-shrink-0"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button 
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Manage Members Dialog */}
        <Dialog open={showManageMembers} onOpenChange={setShowManageMembers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Group Members</DialogTitle>
              <DialogDescription>
                {isGroupAdmin ? 'Manage group members and admins' : 'View group members'}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-60">
              <div className="space-y-2">
                {selectedGroup.members.map((member) => {
                  const memberUser = users.find(u => u.id === member.user_id);
                  const isCreator = selectedGroup.created_by === member.user_id;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {memberUser?.name?.split(' ').map(n => n[0]).join('') || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {memberUser?.name || 'Unknown'}
                            {member.user_id === user.id && ' (You)'}
                          </p>
                          <div className="flex items-center gap-1">
                            {member.is_admin && (
                              <Badge variant="secondary" className="text-xs">Admin</Badge>
                            )}
                            {isCreator && (
                              <Badge variant="outline" className="text-xs">Creator</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {isGroupAdmin && member.user_id !== user.id && !isCreator && (
                        <div className="flex gap-1">
                          {!member.is_admin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMakeAdmin(member.user_id, selectedGroup.id)}
                            >
                              Make Admin
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.user_id, selectedGroup.id)}
                          >
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowManageMembers(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Members Dialog */}
        <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Add Members
              </DialogTitle>
              <DialogDescription>Add new members to this group</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Search users..."
                value={addMemberSearch}
                onChange={(e) => setAddMemberSearch(e.target.value)}
              />
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {getAvailableUsersForGroup().length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No users available to add</p>
                  ) : (
                    getAvailableUsersForGroup().map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {u.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{u.name}</p>
                            <Badge variant="outline" className="text-xs">{u.role}</Badge>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleAddMemberToGroup(u.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddMembers(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task A: Delete Group Dialog */}
        <Dialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Group
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedGroup?.name}"? This will remove all messages and members permanently. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteGroupDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteGroup}>Delete Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Task B: Group Call Active Indicator */}
        {groupCallActive && (
          <Dialog open={!!groupCallActive} onOpenChange={() => setGroupCallActive(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {groupCallActive.type === 'video' ? <VideoIcon className="h-5 w-5" /> : <PhoneCall className="h-5 w-5" />}
                  Group {groupCallActive.type === 'video' ? 'Video' : 'Voice'} Call
                </DialogTitle>
                <DialogDescription>
                  {selectedGroup?.members.length || 0} participants in this call
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center py-6">
                <div className="animate-pulse">
                  <Avatar className="h-24 w-24 bg-primary">
                    <AvatarFallback className="text-primary-foreground">
                      <Users className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <h3 className="text-xl font-semibold mt-4">{selectedGroup?.name}</h3>
                <p className="text-muted-foreground">Call in progress...</p>
              </div>
              <DialogFooter className="flex justify-center">
                <Button variant="destructive" onClick={() => setGroupCallActive(null)} className="rounded-full h-14 w-14">
                  <X className="h-6 w-6" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  // Chat view with selected user
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-gradient-hero text-white py-4 px-6 shadow-medium sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
            onClick={() => setSelectedUser(null)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-10 w-10">
            <AvatarImage src={selectedUser?.avatar} />
            <AvatarFallback>
              {selectedUser?.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{selectedUser?.name}</h2>
              <Badge className={getRoleBadgeColor(selectedUser?.role || '')} variant="secondary">
                {selectedUser?.role}
              </Badge>
            </div>
            <p className="text-sm text-white/80">
              {selectedUser && onlineUsers.has(selectedUser.id) ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => startCall('audio')}
            >
              <Phone className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white hover:bg-white/20"
              onClick={() => startCall('video')}
            >
              <Video className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {contentWarning && (
        <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{contentWarning}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="ml-auto text-destructive"
            onClick={() => setContentWarning(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => {
              // Task H: Check if this is a missed call indicator
              const isMissedCallMessage = message.content.startsWith('📞 Missed') || message.content.startsWith('📹 Missed');
              const isEditable = canEditMessage(message);
              const isEditing = editingMessageId === message.id;
              const isVoiceMessage = message.message_type === 'voice';
              const isFileMessage = message.message_type === 'file';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  {isEditing ? (
                    // Edit mode
                    <div className="max-w-[75%] space-y-2">
                      <Input
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-w-[200px]"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={() => handleSaveEdit(message.id)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 cursor-pointer ${
                            message.sender_id === user.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          } ${isMissedCallMessage ? 'bg-destructive/20 text-destructive border border-destructive/30' : ''}`}
                        >
                          {isMissedCallMessage && (
                            <div className="flex items-center gap-2 mb-1">
                              <PhoneMissed className="h-4 w-4" />
                            </div>
                          )}
                          
                          {/* Task D: Voice message with playback indicator */}
                          {isVoiceMessage ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 rounded-full ${
                                  message.sender_id === user.id 
                                    ? 'hover:bg-primary-foreground/20' 
                                    : 'hover:bg-muted-foreground/20'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info('Voice playback - audio data not stored in database');
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <span className="text-sm">{message.content}</span>
                            </div>
                          ) : isFileMessage ? (
                            /* Task B: File message with download button */
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span className="text-sm flex-1">{message.content}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-6 w-6 p-0 ${
                                  message.sender_id === user.id 
                                    ? 'hover:bg-primary-foreground/20' 
                                    : 'hover:bg-muted-foreground/20'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info('File download requires storage bucket setup');
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 ${
                            message.sender_id === user.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            <span className="text-xs">
                              {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.sender_id === user.id && !isMissedCallMessage && (
                              message.is_read 
                                ? <CheckCheck className="h-3 w-3" />
                                : <Check className="h-3 w-3" />
                            )}
                          </div>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {isEditable && (
                          <DropdownMenuItem onClick={() => handleStartEdit(message)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Message
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteSingleMessage(message.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        {showVoiceRecorder && (
          <div className="mb-3">
            <VoiceRecorder 
              onSendVoiceMessage={handleSendVoiceMessage}
              onCancel={() => setShowVoiceRecorder(false)}
            />
          </div>
        )}
        
        {showFileUpload && (
          <div className="mb-3">
            <FileUpload 
              onSendFile={handleSendFile}
              onCancel={() => setShowFileUpload(false)}
            />
          </div>
        )}

        {!showVoiceRecorder && !showFileUpload && (
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceRecorder(true)}
              className="text-muted-foreground hover:text-primary"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button 
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}
      </div>

      {/* Delete Chat Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete this chat? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteChat}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incoming Call Dialog */}
      {incomingCall && (
        <Dialog open={!!incomingCall} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Incoming {incomingCall.callType} Call</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={incomingCall.callerAvatar} />
                <AvatarFallback className="text-2xl">
                  {incomingCall.callerName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{incomingCall.callerName}</h3>
              <p className="text-muted-foreground">is calling you...</p>
            </div>
            <div className="flex justify-center gap-6">
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={declineCall}
              >
                <X className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                onClick={answerCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Messages;
