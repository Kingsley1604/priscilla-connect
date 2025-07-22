import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onSendVoiceMessage: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

const VoiceRecorder = ({ onSendVoiceMessage, onCancel }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      setRecordingError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setRecordingError('Unable to access microphone. Please check permissions.');
      toast({
        title: "Microphone Error",
        description: "Unable to access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
  };

  const handleSend = () => {
    if (audioBlob) {
      onSendVoiceMessage(audioBlob, duration);
      resetRecorder();
    }
  };

  const handleDelete = () => {
    resetRecorder();
    onCancel();
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setDuration(0);
    setRecordingError(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (recordingError) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
        <p className="text-sm text-destructive flex-1">{recordingError}</p>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
      {!isRecording && !audioBlob && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={startRecording}
            className="text-primary hover:bg-primary/10"
          >
            <Mic className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Tap to record voice message</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </>
      )}

      {isRecording && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={stopRecording}
            className="text-destructive hover:bg-destructive/10 animate-pulse"
          >
            <MicOff className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording... {formatDuration(duration)}</span>
            </div>
          </div>
        </>
      )}

      {!isRecording && audioBlob && (
        <>
          <div className="flex-1">
            <p className="text-sm">Voice message recorded ({formatDuration(duration)})</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSend}
            className="text-primary hover:bg-primary/10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

export default VoiceRecorder;