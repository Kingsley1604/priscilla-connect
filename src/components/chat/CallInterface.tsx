import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Contact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
}

interface CallInterfaceProps {
  contact: Contact;
  callType: 'audio' | 'video';
  callStatus: 'calling' | 'connecting' | 'ringing' | 'active' | 'ended';
  onEndCall: () => void;
  onToggleVideo?: () => void;
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
}

const CallInterface = ({ 
  contact, 
  callType, 
  callStatus, 
  onEndCall,
  onToggleVideo,
  onToggleMic,
  onToggleSpeaker
}: CallInterfaceProps) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (callStatus === 'active' && !callStartTimeRef.current) {
      callStartTimeRef.current = Date.now();
      
      const timer = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [callStatus]);

  useEffect(() => {
    // Initialize local video stream for video calls
    if (callType === 'video' && isVideoEnabled && localVideoRef.current) {
      navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      }).then(stream => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }).catch(console.error);
    }
  }, [callType, isVideoEnabled]);

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    onToggleVideo?.();
  };

  const handleToggleMic = () => {
    setIsMicEnabled(!isMicEnabled);
    onToggleMic?.();
  };

  const handleToggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled);
    onToggleSpeaker?.();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'active':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting':
      case 'ringing':
        return 'bg-yellow-500';
      case 'active':
        return 'bg-green-500';
      case 'ended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-primary/20 to-background z-50 flex flex-col ${
      isFullscreen ? 'bg-black' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={contact.avatar} />
            <AvatarFallback>
              {contact.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-lg">{contact.name}</h2>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className={`${getStatusColor()} text-white text-xs`}>
                {callType === 'video' ? 'Video Call' : 'Audio Call'}
              </Badge>
              <span className="text-sm text-muted-foreground">{getStatusText()}</span>
            </div>
          </div>
        </div>
        
        {callType === 'video' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Video Area */}
      {callType === 'video' && (
        <div className="flex-1 relative bg-black">
          {/* Remote video (main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23374151'/%3E%3C/svg%3E"
          />
          
          {/* Local video (picture-in-picture) */}
          {isVideoEnabled && (
            <div className="absolute top-4 right-4 w-32 h-24 bg-black rounded-lg overflow-hidden border-2 border-white/20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Contact avatar when video is off */}
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Avatar className="h-32 w-32 mx-auto mb-4">
                  <AvatarImage src={contact.avatar} />
                  <AvatarFallback className="text-2xl">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <p className="text-white text-xl font-medium">{contact.name}</p>
                <p className="text-white/70">{getStatusText()}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Audio call display */}
      {callType === 'audio' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Avatar className="h-40 w-40 mx-auto mb-6">
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="text-3xl">
                {contact.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold mb-2">{contact.name}</h2>
            <p className="text-muted-foreground text-lg">{getStatusText()}</p>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="p-6 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-center space-x-4">
          {/* Speaker toggle (audio calls only) */}
          {callType === 'audio' && (
            <Button
              variant={isSpeakerEnabled ? "default" : "secondary"}
              size="lg"
              onClick={handleToggleSpeaker}
              className="rounded-full h-14 w-14"
            >
              {isSpeakerEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          )}

          {/* Microphone toggle */}
          <Button
            variant={isMicEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={handleToggleMic}
            className="rounded-full h-14 w-14"
          >
            {isMicEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* Video toggle (video calls only) */}
          {callType === 'video' && (
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={handleToggleVideo}
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
          )}

          {/* End call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full h-16 w-16 bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CallInterface;