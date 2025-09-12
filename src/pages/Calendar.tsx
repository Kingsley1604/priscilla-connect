import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, Users, Plus, Edit, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Calendar = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = (user as any)?.raw_user_meta_data?.role || (user as any)?.user_metadata?.role || 'student';
  
  const [events, setEvents] = useState([
    {
      id: 1,
      title: "Mathematics Exam",
      date: "2024-01-15",
      time: "09:00 AM",
      location: "Hall A",
      type: "exam",
      description: "Final mathematics examination for SS2 students",
      createdBy: "admin"
    },
    {
      id: 2,
      title: "Science Fair",
      date: "2024-01-18",
      time: "10:00 AM", 
      location: "Science Lab",
      type: "event",
      description: "Annual science project presentations",
      createdBy: "admin"
    },
    {
      id: 3,
      title: "Parent-Teacher Meeting",
      date: "2024-01-20",
      time: "02:00 PM",
      location: "Conference Room",
      type: "meeting",
      description: "Quarterly academic progress discussion",
      createdBy: "admin"
    }
  ]);

  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    time: "",
    location: "",
    type: "event",
    description: ""
  });
  
  const canManageEvents = userRole === 'admin' || userRole === 'teacher';
  
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const event = {
      id: events.length + 1,
      ...newEvent,
      createdBy: user?.id || "unknown"
    };
    
    setEvents([...events, event]);
    setNewEvent({
      title: "",
      date: "",
      time: "",
      location: "",
      type: "event",
      description: ""
    });
    setIsAddEventOpen(false);
    
    toast({
      title: "Success",
      description: "Event added successfully!"
    });
  };
  
  const handleDeleteEvent = (eventId: number) => {
    if (userRole === 'admin') {
      setEvents(events.filter(event => event.id !== eventId));
      toast({
        title: "Success", 
        description: "Event deleted successfully!"
      });
    } else {
      toast({
        title: "Error",
        description: "Only admins can delete events",
        variant: "destructive"
      });
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
                      Create a new calendar event for students and teachers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="title" className="text-right text-sm font-medium">
                        Title
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
                        Date
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
                <div className="text-3xl font-bold text-primary mb-1">{events.length}</div>
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
                <div className="text-3xl font-bold text-secondary mb-1">2</div>
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
                <div className="text-3xl font-bold text-accent mb-1">3</div>
                <p className="text-sm text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Upcoming Events</h3>
            {canManageEvents && (
              <Button onClick={() => setIsAddEventOpen(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-foreground">{event.title}</h4>
                        <Badge variant="outline" className={getEventColor(event.type)}>
                          {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{event.description}</p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          {event.date}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {userRole === 'admin' && (
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
            ))}
          </div>

          {/* Monthly View */}
          <Card className="mt-8 shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Monthly View</CardTitle>
              <CardDescription>
                {canManageEvents 
                  ? "Interactive calendar with event management" 
                  : "Interactive calendar view"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Full calendar widget with event management will be available soon
                  </p>
                  {canManageEvents && (
                    <p className="text-sm text-muted-foreground mt-2">
                      You can add and manage events using the buttons above
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Calendar;