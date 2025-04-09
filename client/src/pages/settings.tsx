import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Sidebar from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const Settings: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [instagramToken, setInstagramToken] = useState<string>('');
  const [youtubeToken, setYoutubeToken] = useState<string>('');
  const [isInstagramLoading, setIsInstagramLoading] = useState<boolean>(false);
  const [isYoutubeLoading, setIsYoutubeLoading] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };
  
  const connectInstagram = async () => {
    if (!instagramToken) {
      toast({
        title: "Token Required",
        description: "Please enter your Instagram API token",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsInstagramLoading(true);
      
      await apiRequest('POST', '/api/connect/instagram', { token: instagramToken });
      
      toast({
        title: "Success",
        description: "Instagram account connected successfully",
      });
      
      setInstagramToken('');
    } catch (error) {
      console.error('Failed to connect Instagram:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect your Instagram account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInstagramLoading(false);
    }
  };
  
  const connectYoutube = async () => {
    if (!youtubeToken) {
      toast({
        title: "Token Required",
        description: "Please enter your YouTube API token",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsYoutubeLoading(true);
      
      await apiRequest('POST', '/api/connect/youtube', { token: youtubeToken });
      
      toast({
        title: "Success",
        description: "YouTube account connected successfully",
      });
      
      setYoutubeToken('');
    } catch (error) {
      console.error('Failed to connect YouTube:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect your YouTube account. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsYoutubeLoading(false);
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
                  Settings
                </h2>
              </div>
            </div>
            
            {/* Profile Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                  <CardDescription>
                    Manage your profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      defaultValue={user?.username} 
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      defaultValue={user?.email} 
                      disabled
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">
                    Update Profile
                  </Button>
                </CardFooter>
              </Card>
              
              <Separator />
              
              {/* Platform Connections */}
              <Card>
                <CardHeader>
                  <CardTitle>Connect Platforms</CardTitle>
                  <CardDescription>
                    Link your social media accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Instagram</h3>
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 mr-2 bg-[#E1306C] rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        {user?.has_instagram ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                    
                    {!user?.has_instagram && (
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="instagram-token">Instagram API Token</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="instagram-token"
                            value={instagramToken}
                            onChange={(e) => setInstagramToken(e.target.value)}
                            placeholder="Enter your Instagram API token"
                          />
                          <Button 
                            onClick={connectInstagram}
                            disabled={isInstagramLoading}
                          >
                            {isInstagramLoading ? 'Connecting...' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">YouTube</h3>
                    <div className="flex items-center">
                      <span className="w-2.5 h-2.5 mr-2 bg-[#FF0000] rounded-full"></span>
                      <span className="text-sm text-gray-700">
                        {user?.has_youtube ? 'Connected' : 'Not connected'}
                      </span>
                    </div>
                    
                    {!user?.has_youtube && (
                      <div className="mt-2 space-y-2">
                        <Label htmlFor="youtube-token">YouTube API Token</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="youtube-token"
                            value={youtubeToken}
                            onChange={(e) => setYoutubeToken(e.target.value)}
                            placeholder="Enter your YouTube API token"
                          />
                          <Button 
                            onClick={connectYoutube}
                            disabled={isYoutubeLoading}
                          >
                            {isYoutubeLoading ? 'Connecting...' : 'Connect'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Separator />
              
              {/* Data Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Settings</CardTitle>
                  <CardDescription>
                    Manage your offline data
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium">Offline Cache</h3>
                      <p className="text-sm text-gray-600">
                        Clear your offline cached content
                      </p>
                    </div>
                    <Button variant="outline">
                      Clear Cache
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
