import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Paperclip, File, Image, Video, Music, FileText, X, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onSendFile: (file: File, fileInfo: FileInfo) => void;
  onCancel: () => void;
}

interface FileInfo {
  name: string;
  size: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'other';
  icon: React.ReactNode;
}

const FileUpload = ({ onSendFile, onCancel }: FileUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): FileInfo['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
      return 'document';
    }
    return 'other';
  };

  const getFileIcon = (type: FileInfo['type']) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: `File size must be less than ${formatFileSize(MAX_FILE_SIZE)}`,
        variant: "destructive"
      });
      return;
    }

    const type = getFileType(file);
    const info: FileInfo = {
      name: file.name,
      size: formatFileSize(file.size),
      type,
      icon: getFileIcon(type)
    };

    setSelectedFile(file);
    setFileInfo(info);
  };

  const handleSend = () => {
    if (selectedFile && fileInfo) {
      onSendFile(selectedFile, fileInfo);
      resetUpload();
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    resetUpload();
    onCancel();
  };

  return (
    <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx"
      />

      {!selectedFile && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:bg-primary/10"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Choose file to share</span>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        </>
      )}

      {selectedFile && fileInfo && (
        <>
          <div className="flex items-center space-x-2 flex-1">
            <div className="flex items-center space-x-2 p-2 bg-background rounded border">
              {fileInfo.icon}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate max-w-[200px]">{fileInfo.name}</p>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {fileInfo.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{fileInfo.size}</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={resetUpload}
            className="text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4" />
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

export default FileUpload;