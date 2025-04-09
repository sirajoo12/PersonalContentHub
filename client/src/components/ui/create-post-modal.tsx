import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [platform, setPlatform] = useState<string>('instagram');
  const [content, setContent] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      
      if (!content) {
        toast({
          title: "Error",
          description: "Please enter some content for your post",
          variant: "destructive"
        });
        return;
      }
      
      // Create form data if we have a file
      let mediaUrl = '';
      if (file) {
        // In a real app, we would upload the file to a storage service
        // and get back a URL
        mediaUrl = 'https://example.com/media/' + file.name;
      }
      
      // Create scheduled post
      const scheduledFor = scheduleDate 
        ? new Date(scheduleDate).toISOString() 
        : new Date(Date.now() + 60000).toISOString(); // Default to 1 minute from now
        
      await apiRequest('POST', '/api/scheduled-posts', {
        platform,
        content,
        media_url: mediaUrl,
        scheduled_for: scheduledFor
      });
      
      toast({
        title: "Success!",
        description: "Your post has been scheduled",
      });
      
      // Reset form
      setPlatform('instagram');
      setContent('');
      setScheduleDate('');
      setFile(null);
      
      // Close modal and notify parent
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={platform}
              onValueChange={setPlatform}
            >
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Write your post content here..."
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Upload Media</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white font-medium text-primary hover:text-blue-500">
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, MP4 up to 10MB
              </p>
              {file && (
                <p className="mt-2 text-sm text-gray-800 font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="schedule">Schedule Post</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Posting...' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
