import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import ChatInterface from "./ChatInterface";

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isOnPriscillaChat: boolean;
  lastSeen?: string;
}

interface ChatUser {
  phone: string;
  name: string;
}

interface ChatInterfaceWithHeaderProps {
  contacts: Contact[];
  currentUser: ChatUser;
}

const ChatInterfaceWithHeader = ({ contacts, currentUser }: ChatInterfaceWithHeaderProps) => {
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-hero text-white py-4 px-4 sm:py-6 sm:px-6 shadow-medium">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link to="/">
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
              <p className="text-white/80 text-xs sm:text-sm">Simple. Fast. Free</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Interface - Pass showHeader=false to avoid duplicate */}
      <div className="flex-1">
        <ChatInterface contacts={contacts} currentUser={currentUser} />
      </div>
    </div>
  );
};

export default ChatInterfaceWithHeader;