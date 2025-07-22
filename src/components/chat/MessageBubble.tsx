import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Download, FileText, Image as ImageIcon, Music, Video as VideoIcon, File } from 'lucide-react';

interface Message {
  id: string;
  text?: string;
  timestamp: Date;
  isSent: boolean;
  isDelivered: boolean;
  isRead: boolean;
  type: 'text' | 'voice' | 'file' | 'image' | 'video' | 'audio';
  voiceData?: {
    audioBlob: Blob;
    duration: number;
  };
  fileData?: {
    file: File;
    name: string;
    size: string;
    fileType: 'image' | 'video' | 'audio' | 'document' | 'other';
  };
}

interface MessageBubbleProps {
  message: Message;
  getStatusIndicator: (message: Message) => React.ReactNode;
}

const MessageBubble = ({ message, getStatusIndicator }: MessageBubbleProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayVoice = () => {
    if (!message.voiceData || !audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current.src) {
        audioRef.current.play();
      } else {
        const audioUrl = URL.createObjectURL(message.voiceData.audioBlob);
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setAudioCurrentTime(audioRef.current.currentTime);
    }
  };

  const downloadFile = () => {
    if (!message.fileData) return;
    
    const url = URL.createObjectURL(message.fileData.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = message.fileData.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="h-4 w-4" />;
      case 'video':
        return <VideoIcon className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const renderPreview = () => {
    if (!message.fileData) return null;
    
    const { file, fileType } = message.fileData;
    
    if (fileType === 'image') {
      const imageUrl = URL.createObjectURL(file);
      return (
        <img 
          src={imageUrl} 
          alt={message.fileData.name}
          className="max-w-xs max-h-48 rounded-lg object-cover"
          onLoad={() => URL.revokeObjectURL(imageUrl)}
        />
      );
    }
    
    if (fileType === 'video') {
      const videoUrl = URL.createObjectURL(file);
      return (
        <video 
          src={videoUrl} 
          className="max-w-xs max-h-48 rounded-lg"
          controls
          onLoadedData={() => URL.revokeObjectURL(videoUrl)}
        />
      );
    }
    
    return null;
  };

  return (
    <div className={`flex ${message.isSent ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        message.isSent 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-foreground'
      }`}>
        
        {/* Text Message */}
        {message.type === 'text' && message.text && (
          <p className="text-sm">{message.text}</p>
        )}

        {/* Voice Message */}
        {message.type === 'voice' && message.voiceData && (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayVoice}
              className={`h-8 w-8 rounded-full p-0 ${
                message.isSent ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted-foreground/20'
              }`}
            >
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-0.5">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div
                      key={i}
                      className={`w-0.5 bg-current rounded-full transition-all duration-150 ${
                        isPlaying && i < (audioCurrentTime / message.voiceData.duration) * 12
                          ? 'h-4 opacity-100'
                          : 'h-2 opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs opacity-70 mt-1">
                {formatDuration(message.voiceData.duration)}
              </p>
            </div>
            <audio
              ref={audioRef}
              onEnded={handleAudioEnded}
              onTimeUpdate={handleTimeUpdate}
              className="hidden"
            />
          </div>
        )}

        {/* File Message */}
        {message.type === 'file' && message.fileData && (
          <div className="space-y-2">
            {renderPreview()}
            <div className="flex items-center space-x-2 p-2 bg-background/10 rounded border border-current/20">
              {getFileIcon(message.fileData.fileType)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{message.fileData.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      message.isSent 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : 'bg-muted-foreground/20'
                    }`}
                  >
                    {message.fileData.fileType}
                  </Badge>
                  <span className="text-xs opacity-70">{message.fileData.size}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadFile}
                className={`h-8 w-8 p-0 ${
                  message.isSent ? 'hover:bg-primary-foreground/20' : 'hover:bg-muted-foreground/20'
                }`}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Footer */}
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs opacity-70">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {getStatusIndicator(message)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;