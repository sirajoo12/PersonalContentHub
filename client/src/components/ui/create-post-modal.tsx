import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription 
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
import { Upload, AlertCircle, Image as ImageIcon, FileVideo2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [activeTab, setActiveTab] = useState<string>('edit');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate preview URL for the selected file
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreview(null);
    }
  }, [file]);

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    }
    
    if (platform === 'youtube' && !file) {
      newErrors.file = 'A video file is required for YouTube posts';
    }
    
    if (scheduleDate) {
      const scheduledTime = new Date(scheduleDate).getTime();
      const now = new Date().getTime();
      
      if (scheduledTime <= now) {
        newErrors.scheduleDate = 'Scheduled time must be in the future';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate the form
      if (!validateForm()) {
        // Display validation errors
        const errorList = Object.values(errors).join(", ");
        toast({
          title: "Validation Error",
          description: errorList,
          variant: "destructive"
        });
        return;
      }
      
      setIsLoading(true);
      
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
      setErrors({});
      setActiveTab('edit');
      
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
          <DialogDescription>
            Schedule a new post to your social media platforms.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="edit">Edit Post</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="edit" className="space-y-4">
            <div className="grid gap-4 py-2">
              {/* Platform selection */}
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
              
              {/* Content input */}
              <div className="grid gap-2">
                <Label htmlFor="content">
                  Content {errors.content && <span className="text-red-500 text-xs ml-1">({errors.content})</span>}
                </Label>
                <Textarea
                  id="content"
                  placeholder="Write your post content here..."
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={errors.content ? "border-red-500" : ""}
                />
              </div>
              
              {/* Media upload */}
              <div className="grid gap-2">
                <Label>
                  Upload Media {errors.file && <span className="text-red-500 text-xs ml-1">({errors.file})</span>}
                </Label>
                <div className={`border-2 ${errors.file ? "border-red-500" : "border-gray-300"} border-dashed rounded-md p-6 flex flex-col items-center justify-center`}>
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
              
              {/* Schedule date */}
              <div className="grid gap-2">
                <Label htmlFor="schedule">
                  Schedule Post {errors.scheduleDate && <span className="text-red-500 text-xs ml-1">({errors.scheduleDate})</span>}
                </Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className={errors.scheduleDate ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  Leave empty to schedule for posting in 1 minute
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                {/* Post preview */}
                <div className="max-w-sm mx-auto">
                  {/* Mock platform header */}
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {platform === 'instagram' ? (
                        <div className="w-4 h-4 rounded-full bg-[#E1306C]" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[#FF0000]" />
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium">{platform === 'instagram' ? 'Instagram' : 'YouTube'} Post</p>
                      <p className="text-xs text-gray-500">
                        {scheduleDate 
                          ? `Scheduled for ${new Date(scheduleDate).toLocaleString()}`
                          : 'Scheduled for 1 minute from now'
                        }
                      </p>
                    </div>
                  </div>
                
                  {/* Media preview */}
                  {filePreview ? (
                    <div className="w-full rounded-md overflow-hidden mb-3 bg-gray-100">
                      {file?.type.startsWith('image/') ? (
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          className="w-full object-cover max-h-80"
                        />
                      ) : file?.type.startsWith('video/') ? (
                        <video 
                          src={filePreview} 
                          controls 
                          className="w-full max-h-80"
                        />
                      ) : (
                        <div className="h-40 flex items-center justify-center">
                          <p className="text-gray-500">File preview not available</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-40 rounded-md bg-gray-100 flex items-center justify-center mb-3">
                      {platform === 'instagram' ? (
                        <ImageIcon className="h-10 w-10 text-gray-400" />
                      ) : (
                        <FileVideo2 className="h-10 w-10 text-gray-400" />
                      )}
                    </div>
                  )}
                
                  {/* Content preview */}
                  <div className="text-sm">
                    {content ? (
                      <p className="whitespace-pre-wrap">{content}</p>
                    ) : (
                      <p className="text-gray-400 italic">No content added yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Validation alerts */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the following issues before posting:
                  <ul className="list-disc pl-5 mt-2 text-sm">
                    {Object.entries(errors).map(([key, value]) => (
                      <li key={key}>{value}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
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
