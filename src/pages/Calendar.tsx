import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Calendar from 'react-calendar';
import { supabase } from "@/integrations/supabase/client";
import { format } from 'date-fns';
import 'react-calendar/dist/Calendar.css';
import { eventSchema } from "@/lib/validation";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  type: string;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const CalendarPage = () => {
  const { user } = useAuth();
  // Use the role from useAuth which correctly fetches from user_roles table
  const userRole = user?.role || 'student';
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    type: "event",
    description: ""
  });
  
  const canManageEvents = userRole === 'admin' || userRole === 'teacher';

  // Load events from database
  useEffect(() => {
    loadEvents();
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
        
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading events:', error);
        }
        toast.error("Failed to load events");
        return;
      }
      
      // Type cast the status field to match our interface
      const typedEvents = (data || []).map(event => ({
        ...event,
        status: event.status as 'pending' | 'approved' | 'rejected'
      }));
      
      setEvents(typedEvents);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error loading events:', error);
      }
      toast.error("Failed to load events");
    }
  };

  const handleDateClick = (date: Date) => {
    if (canManageEvents) {
      setSelectedDate(date);
      setNewEvent({
        ...newEvent,
        date: format(date, 'yyyy-MM-dd')
      });
      setIsAddEventOpen(true);
      
      // Show immediate feedback
      toast.success(`Creating event for ${format(date, 'MMMM d, yyyy')}`);
    } else {
      toast.info("Only teachers and admins can create events");
    }
  };

  const handleAddEvent = async () => {
    if (!user) {
      toast.error("You must be logged in to create events");
      return;
    }
    
    // Validate event data
    try {
      eventSchema.parse(newEvent);
    } catch (validationError: any) {
      toast.error(validationError.errors?.[0]?.message || "Invalid event data");
      return;
    }
    
    try {
      const eventData = {
        title: newEvent.title,
        description: newEvent.description || null,
        date: newEvent.date,
        time: newEvent.time || null,
        location: newEvent.location || null,
        type: newEvent.type,
        created_by: user.id,
        status: userRole === 'admin' ? 'approved' : 'pending'
      };

      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .maybeSingle();
        
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error creating event:', error);
        }
        toast.error("Failed to create event");
        return;
      }
      
      // Type cast the response to match our interface
      const typedEvent = {
        ...data,
        status: data.status as 'pending' | 'approved' | 'rejected'
      };
      
      setEvents([...events, typedEvent]);
      setNewEvent({
        title: "",
        date: "",
        time: "",
        location: "",
        type: "event",
        description: ""
      });
      setIsAddEventOpen(false);
      setSelectedDate(null);
      
      toast.success(userRole === 'admin' ? "Event created and approved!" : "Event created, pending approval");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error creating event:', error);
      }
      toast.error("Failed to create event");
    }
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);
        
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error deleting event:', error);
        }
        toast.error("Failed to delete event");
        return;
      }
      
      setEvents(events.filter(event => event.id !== eventId));
      toast.success("Event deleted successfully!");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error deleting event:', error);
      }
      toast.error("Failed to delete event");
    }
  };

  const handleApproveEvent = async (eventId: string) => {
    if (userRole !== 'admin') return;
    
    try {
      const { error } = await supabase
        .from('events')
        .update({ 
          status: 'approved', 
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', eventId);
        
      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error approving event:', error);
        }
        toast.error("Failed to approve event");
        return;
      }
      
      setEvents(events.map(event => 
        event.id === eventId 
          ? { ...event, status: 'approved' as const, approved_by: user?.id || null, approved_at: new Date().toISOString() }
          : event
      ));
      toast.success("Event approved!");
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error approving event:', error);
      }
      toast.error("Failed to approve event");
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'event': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Filter events based on user role and status
  const visibleEvents = events.filter(event => {
    if (userRole === 'admin') return true;
    if (event.created_by === user?.id) return true;
    if (userRole === 'student' && event.status === 'approved') return true;
    if (userRole === 'teacher' && event.status === 'approved') return true;
    return false;
  });

  const pendingEvents = events.filter(event => event.status === 'pending');
  const thisWeekEvents = visibleEvents.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate >= today && eventDate <= weekFromNow;
  });
  const todayEvents = visibleEvents.filter(event => {
    const eventDate = new Date(event.date);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });
  const examEvents = visibleEvents.filter(event => event.type === 'exam');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-6 px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <CalendarIcon className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Calendar</h1>
                <p className="text-white/90">School events and schedules</p>
              </div>
            </div>
            
            {canManageEvents && (
              <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Event</DialogTitle>
                    <DialogDescription>
                      {selectedDate ? `Create event for ${format(selectedDate, 'MMMM d, yyyy')}` : 'Create a new calendar event'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="title" className="text-right text-sm font-medium">
                        Title *
                      </label>
                      <Input
                        id="title"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        className="col-span-3"
                        placeholder="Event title"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="date" className="text-right text-sm font-medium">
                        Date *
                      </label>
                      <Input
                        id="date"
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="time" className="text-right text-sm font-medium">
                        Time
                      </label>
                      <Input
                        id="time"
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="location" className="text-right text-sm font-medium">
                        Location
                      </label>
                      <Input
                        id="location"
                        value={newEvent.location}
                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                        className="col-span-3"
                        placeholder="Event location"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="type" className="text-right text-sm font-medium">
                        Type
                      </label>
                      <Select value={newEvent.type} onValueChange={(value) => setNewEvent({...newEvent, type: value})}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="meeting">Meeting</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="description" className="text-right text-sm font-medium">
                        Description
                      </label>
                      <Textarea
                        id="description"
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        className="col-span-3"
                        placeholder="Event description"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddEvent}>Add Event</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <CalendarIcon className="h-5 w-5 mr-2 text-primary" />
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-1">{thisWeekEvents.length}</div>
                <p className="text-sm text-muted-foreground">Upcoming events</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-secondary" />
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary mb-1">{todayEvents.length}</div>
                <p className="text-sm text-muted-foreground">Scheduled activities</p>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Users className="h-5 w-5 mr-2 text-accent" />
                  Exams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent mb-1">{examEvents.length}</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Calendar */}
          <Card className="mb-8 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Monthly View</CardTitle>
              <CardDescription>
                {canManageEvents 
                  ? "Click on any date to create an event" 
                  : "View all approved events"
                }
              </CardDescription>
            </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <div className="calendar-container w-full max-w-2xl">
                <Calendar
                  onClickDay={handleDateClick}
                  className="react-calendar w-full border rounded-lg shadow-sm"
                  tileClassName={({ date, view }) => {
                    const baseClasses = "relative min-h-[60px] p-2 text-center transition-all duration-200";
                    if (view === 'month' && canManageEvents) {
                      return `${baseClasses} hover:bg-primary/10 cursor-pointer hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 border border-transparent`;
                    }
                    return `${baseClasses} border border-transparent`;
                  }}
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const dayEvents = visibleEvents.filter(event => 
                        new Date(event.date).toDateString() === date.toDateString()
                      );
                      if (dayEvents.length > 0) {
                        return (
                          <div className="flex flex-wrap gap-1 mt-1 pointer-events-none absolute bottom-1 left-1 right-1">
                            {dayEvents.slice(0, 3).map((event, index) => (
                              <div
                                key={event.id}
                                className={`w-2 h-2 rounded-full ${
                                  event.type === 'exam' ? 'bg-red-500' :
                                  event.type === 'meeting' ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                title={event.title}
                              />
                            ))}
                            {dayEvents.length > 3 && (
                              <div className="w-2 h-2 rounded-full bg-gray-400" title={`+${dayEvents.length - 3} more`} />
                            )}
                          </div>
                        );
                      }
                    }
                    return null;
                  }}
                />
              </div>
            </div>
            {canManageEvents && (
              <div className="text-center mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                  💡 Click on any date above to create an event for that day
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Events created by teachers need admin approval to be visible to students
                </p>
              </div>
            )}
          </CardContent>
          </Card>

          {/* Pending Approvals (Admin only) */}
          {userRole === 'admin' && pendingEvents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">Pending Approvals</h3>
              <div className="space-y-4">
                {pendingEvents.map((event) => (
                  <Card key={event.id} className="shadow-soft border-yellow-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-foreground">{event.title}</h4>
                            <Badge variant="outline" className={getEventColor(event.type)}>
                              {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                            </Badge>
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-3">{event.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(new Date(event.date), 'MMMM d, yyyy')}
                            </div>
                            {event.time && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {event.time}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveEvent(event.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">All Events</h3>
            {canManageEvents && (
              <Button onClick={() => setIsAddEventOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {visibleEvents.length === 0 ? (
              <Card className="shadow-soft">
                <CardContent className="p-6 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No events found</p>
                </CardContent>
              </Card>
            ) : (
              visibleEvents.map((event) => (
                <Card key={event.id} className="shadow-soft hover:shadow-medium transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-foreground">{event.title}</h4>
                          <Badge variant="outline" className={getEventColor(event.type)}>
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </Badge>
                          {(userRole === 'admin' || event.created_by === user?.id) && (
                            <Badge variant="outline" className={getStatusColor(event.status)}>
                              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            {format(new Date(event.date), 'MMMM d, yyyy')}
                          </div>
                          {event.time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {event.time}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(userRole === 'admin' || event.created_by === user?.id) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CalendarPage;