import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Search, Send, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import MessageInput from "@/components/messaging/MessageInput";

const Messages = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Mr. David Thompson",
      role: "Mathematics Teacher",
      lastMessage: "Great work on your assignment!",
      time: "10:30 AM",
      unread: 2,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 2,
      name: "Sarah Johnson",
      role: "Class Representative",
      lastMessage: "Meeting scheduled for tomorrow",
      time: "9:15 AM", 
      unread: 0,
      avatar: "https://images.unsplash.com/photo-1494790108755-2616c4bb2108?w=150&h=150&fit=crop&crop=face"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      role: "Principal",
      lastMessage: "Parent-teacher conference updates",
      time: "Yesterday",
      unread: 1,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Messages</h1>
              <p className="text-white/90">Communication hub</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversations List */}
            <div className="lg:col-span-1">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Conversations</CardTitle>
                  <CardDescription>Your recent messages</CardDescription>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors border-b last:border-b-0"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>
                            {conversation.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">
                              {conversation.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              {conversation.unread > 0 && (
                                <Badge variant="destructive" className="text-xs px-2 py-1">
                                  {conversation.unread}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {conversation.time}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{conversation.role}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2">
              <Card className="shadow-soft h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conversations[0].avatar} />
                        <AvatarFallback>DT</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{conversations[0].name}</CardTitle>
                        <CardDescription>{conversations[0].role}</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                {/* Messages Area */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Incoming Message */}
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversations[0].avatar} />
                        <AvatarFallback>DT</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Great work on your assignment! Your understanding of calculus has improved significantly.</p>
                        <p className="text-xs text-muted-foreground mt-1">10:30 AM</p>
                      </div>
                    </div>

                    {/* Outgoing Message */}
                    <div className="flex items-start space-x-2 justify-end">
                      <div className="bg-primary text-primary-foreground p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Thank you, Mr. Thompson! I've been practicing the problems you gave us.</p>
                        <p className="text-xs opacity-70 mt-1">10:32 AM</p>
                      </div>
                    </div>

                    {/* Incoming Message */}
                    <div className="flex items-start space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={conversations[0].avatar} />
                        <AvatarFallback>DT</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted p-3 rounded-lg max-w-xs">
                        <p className="text-sm">Perfect! Keep up the good work. Don't hesitate to ask if you need help with tomorrow's lesson.</p>
                        <p className="text-xs text-muted-foreground mt-1">10:35 AM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="border-t p-4">
                  <MessageInput />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Messages;