import { useState, useEffect } from 'react';
import { Post } from '@shared/schema';

const CACHE_KEY = 'socialsync_posts_cache';
const LAST_UPDATED_KEY = 'socialsync_cache_last_updated';

export function useOfflineCache() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isCacheAvailable, setIsCacheAvailable] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if localStorage is available
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      setIsCacheAvailable(true);
    } catch (e) {
      setIsCacheAvailable(false);
      console.error('LocalStorage is not available for caching');
    }
    
    // Set up online/offline event listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Get cached posts
  const getCachedPosts = (platforms?: string[]): Post[] => {
    if (!isCacheAvailable) return [];
    
    try {
      const cachedPostsJson = localStorage.getItem(CACHE_KEY);
      if (!cachedPostsJson) return [];
      
      const cachedPosts: Post[] = JSON.parse(cachedPostsJson);
      
      // Filter by platform if specified
      if (platforms && platforms.length > 0) {
        return cachedPosts.filter(post => platforms.includes(post.platform));
      }
      
      return cachedPosts;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return [];
    }
  };
  
  // Set a post to be cached
  const setCachedPost = (post: Post): void => {
    if (!isCacheAvailable) return;
    
    try {
      // Get existing cache
      const existingPostsJson = localStorage.getItem(CACHE_KEY);
      const existingPosts: Post[] = existingPostsJson ? JSON.parse(existingPostsJson) : [];
      
      // Check if post already exists in cache
      const postIndex = existingPosts.findIndex(p => 
        p.platform === post.platform && p.content_id === post.content_id
      );
      
      // Update or add the post
      if (postIndex >= 0) {
        existingPosts[postIndex] = { ...post, is_cached: true };
      } else {
        existingPosts.push({ ...post, is_cached: true });
      }
      
      // Save back to localStorage
      localStorage.setItem(CACHE_KEY, JSON.stringify(existingPosts));
      localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  };
  
  // Remove a post from cache
  const removeCachedPost = (postId: number): void => {
    if (!isCacheAvailable) return;
    
    try {
      const existingPostsJson = localStorage.getItem(CACHE_KEY);
      if (!existingPostsJson) return;
      
      const existingPosts: Post[] = JSON.parse(existingPostsJson);
      const updatedPosts = existingPosts.filter(post => post.id !== postId);
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedPosts));
      localStorage.setItem(LAST_UPDATED_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  };
  
  // Clear all cached posts
  const clearCache = (): void => {
    if (!isCacheAvailable) return;
    
    try {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(LAST_UPDATED_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };
  
  // Get cache last updated time
  const getCacheLastUpdated = (): Date | null => {
    if (!isCacheAvailable) return null;
    
    try {
      const lastUpdated = localStorage.getItem(LAST_UPDATED_KEY);
      return lastUpdated ? new Date(lastUpdated) : null;
    } catch (error) {
      console.error('Error getting cache timestamp:', error);
      return null;
    }
  };
  
  return {
    isOnline,
    isCacheAvailable: () => isCacheAvailable,
    getCachedPosts,
    setCachedPost,
    removeCachedPost,
    clearCache,
    getCacheLastUpdated
  };
}
