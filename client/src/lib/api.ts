import { apiRequest } from './queryClient';
import { Post } from '@shared/schema';

// Instagram API functions
export const fetchInstagramPosts = async (): Promise<Post[]> => {
  try {
    const response = await apiRequest('GET', '/api/posts?platform=instagram', undefined);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch Instagram posts:', error);
    throw error;
  }
};

// YouTube API functions
export const fetchYouTubePosts = async (): Promise<Post[]> => {
  try {
    const response = await apiRequest('GET', '/api/posts?platform=youtube', undefined);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch YouTube posts:', error);
    throw error;
  }
};

// Post cache management
export const setCachedStatus = async (postId: number, isCached: boolean): Promise<void> => {
  try {
    await apiRequest('POST', '/api/posts/cache', { postId, isCached });
  } catch (error) {
    console.error('Failed to update cache status:', error);
    throw error;
  }
};

// Scheduled posts management
export const fetchScheduledPosts = async () => {
  try {
    const response = await apiRequest('GET', '/api/scheduled-posts', undefined);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch scheduled posts:', error);
    throw error;
  }
};

export const createScheduledPost = async (postData: {
  platform: string;
  content: string;
  media_url?: string;
  scheduled_for: string;
}) => {
  try {
    const response = await apiRequest('POST', '/api/scheduled-posts', postData);
    return await response.json();
  } catch (error) {
    console.error('Failed to create scheduled post:', error);
    throw error;
  }
};

// User platform connection
export const connectInstagram = async (token: string) => {
  try {
    const response = await apiRequest('POST', '/api/connect/instagram', { token });
    return await response.json();
  } catch (error) {
    console.error('Failed to connect Instagram:', error);
    throw error;
  }
};

export const connectYouTube = async (token: string) => {
  try {
    const response = await apiRequest('POST', '/api/connect/youtube', { token });
    return await response.json();
  } catch (error) {
    console.error('Failed to connect YouTube:', error);
    throw error;
  }
};
