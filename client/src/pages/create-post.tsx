import React, { useContext, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import Sidebar from '@/components/ui/sidebar';
import { AuthContext } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const CreatePost: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [_, navigate] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [platform, setPlatform] = useState<string>('instagram');
  const [content, setContent] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
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
      
      // Reset form and redirect
      navigate('/');
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
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please log in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        selectedPlatforms={['instagram', 'youtube']}
        onSelectPlatform={() => {}}
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            
            {/* Page header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold leading-7 text-gray-800 sm:text-3xl sm:truncate">
                  Create New Post
                </h2>
              </div>
            </div>
            
            {/* Create Post Form */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Post Details</CardTitle>
                <CardDescription>
                  Create and schedule a new post for your social media accounts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
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
                
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content here..."
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
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
                
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule Post</Label>
                  <Input
                    id="schedule"
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to post as soon as possible
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Post...' : 'Create Post'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreatePost;
