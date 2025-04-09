import React, { useContext, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ContentCard from '@/components/ui/content-card';
import Sidebar from '@/components/ui/sidebar';
import CreatePostModal from '@/components/ui/create-post-modal';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AuthContext } from '@/App';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useOfflineCache } from '@/hooks/use-offline-cache';
import { Post } from '@shared/schema';
import { Loader2 } from 'lucide-react';

enum FilterType {
  ALL = 'all',
  RECENT = 'recent',
  POPULAR = 'popular'
}

const Dashboard: React.FC = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'youtube']);
  const [activeFilter, setActiveFilter] = useState<FilterType>(FilterType.ALL);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const { getCachedPosts, setCachedPost, isCacheAvailable } = useOfflineCache();

  // Fetch posts from API or cache if offline
  const { 
    data: posts = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery<Post[]>({
    queryKey: ['/api/posts', ...selectedPlatforms],
    queryFn: async ({ queryKey }) => {
      try {
        const platformParam = selectedPlatforms.join(',');
        const response = await apiRequest('GET', `/api/posts?platform=${platformParam}`, undefined);
        return response.json();
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        
        if (!navigator.onLine && isCacheAvailable()) {
          toast({
            title: "You're offline",
            description: "Showing cached posts",
          });
          return getCachedPosts(selectedPlatforms);
        }
        
        throw error;
      }
    }
  });
  
  // Toggle cache status for a post
  const cacheMutation = useMutation({
    mutationFn: async ({ postId, isCached }: { postId: number, isCached: boolean }) => {
      try {
        await apiRequest('POST', '/api/posts/cache', { postId, isCached });
        
        if (isCached) {
          const post = posts.find(p => p.id === postId);
          if (post) {
            setCachedPost(post);
          }
        }
        
        return { postId, isCached };
      } catch (error) {
        console.error('Failed to update cache status:', error);
        throw error;
      }
    },
    onSuccess: ({ postId, isCached }) => {
      toast({
        title: isCached ? "Post cached" : "Post uncached",
        description: isCached 
          ? "This post will be available offline" 
          : "This post won't be available offline anymore"
      });
    },
    onError: () => {
      toast({
        title: "Failed to update cache",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Handle platform toggle
  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platform)) {
        // If all platforms would be deselected, keep this one
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== platform);
      } else {
        return [...prev, platform];
      }
    });
  };

  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Apply filters to posts
  const filteredPosts = React.useMemo(() => {
    if (!posts) return [];
    
    switch (activeFilter) {
      case FilterType.RECENT:
        return [...posts].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case FilterType.POPULAR:
        return [...posts].sort((a, b) => {
          const aMetric = a.platform === 'instagram' ? (a.likes_count || 0) : (a.views_count || 0);
          const bMetric = b.platform === 'instagram' ? (b.likes_count || 0) : (b.views_count || 0);
          return bMetric - aMetric;
        });
      default:
        return posts;
    }
  }, [posts, activeFilter]);

  // Handle load more button (simulation)
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setIsLoadingMore(false);
      toast({
        title: "All posts loaded",
        description: "No more posts to load",
      });
    }, 1500);
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
        selectedPlatforms={selectedPlatforms}
        onSelectPlatform={handlePlatformToggle}
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            
            {/* Page header */}
            <div className="md:flex md:items-center md:justify-between mb-6">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-semibold leading-7 text-gray-800 sm:text-3xl sm:truncate">
                  Your Content
                </h2>
              </div>
              
              <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                {/* Filter tabs */}
                <div className="hidden sm:flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  <button 
                    type="button" 
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      activeFilter === FilterType.ALL 
                        ? 'bg-white shadow-sm text-gray-800' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveFilter(FilterType.ALL)}
                  >
                    All
                  </button>
                  <button 
                    type="button" 
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      activeFilter === FilterType.RECENT 
                        ? 'bg-white shadow-sm text-gray-800' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveFilter(FilterType.RECENT)}
                  >
                    Recent
                  </button>
                  <button 
                    type="button" 
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                      activeFilter === FilterType.POPULAR
                        ? 'bg-white shadow-sm text-gray-800' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveFilter(FilterType.POPULAR)}
                  >
                    Popular
                  </button>
                </div>
                
                {/* Create Post Button */}
                <Button 
                  onClick={() => setIsCreatePostModalOpen(true)}
                  className="inline-flex items-center"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Create Post
                </Button>
              </div>
            </div>
            
            {/* Content grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading posts...</span>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                <p>Failed to load posts. Please try again later.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">No posts found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {selectedPlatforms.length === 0 
                    ? 'Please select at least one platform to view posts'
                    : 'There are no posts available for the selected platforms'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPosts.map(post => (
                  <ContentCard 
                    key={`${post.platform}-${post.content_id}`} 
                    post={post}
                    onCacheToggle={(postId, isCached) => 
                      cacheMutation.mutate({ postId, isCached })
                    }
                  />
                ))}
              </div>
            )}
            
            {/* Loading more indicator */}
            {!isLoading && filteredPosts.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" />
                      Loading...
                    </>
                  ) : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default Dashboard;
