import React from 'react';
import { Clock, Heart, Play, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@shared/schema';

interface ContentCardProps {
  post: Post;
  onCacheToggle?: (postId: number, isCached: boolean) => void;
}

const ContentCard: React.FC<ContentCardProps> = ({ post, onCacheToggle }) => {
  const formattedDate = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  const handleCacheToggle = () => {
    if (onCacheToggle) {
      onCacheToggle(post.id, !post.is_cached);
    }
  };
  
  const platformClass = post.platform === 'instagram' ? 'instagram' : 'youtube';
  
  return (
    <div className="content-card bg-white overflow-hidden rounded-lg shadow border border-gray-200 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="relative">
        <img 
          className="h-48 w-full object-cover" 
          src={post.thumbnail_url} 
          alt={`${post.platform} post`} 
        />
        <span className={`platform-badge ${platformClass} absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full text-white`}>
          {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
        </span>
        
        {post.platform === 'youtube' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-12 w-12 text-white opacity-80 fill-current" />
          </div>
        )}
      </div>
      
      <div className="px-4 py-4">
        {post.title && (
          <p className="text-sm font-medium text-gray-800 mb-1">{post.title}</p>
        )}
        
        <p className="text-sm text-gray-700 line-clamp-3">
          {post.caption}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500">
            {post.platform === 'instagram' ? (
              <>
                <Heart className="h-4 w-4 mr-1" />
                <span>{post.likes_count?.toLocaleString() || 0}</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                <span>{post.views_count?.toLocaleString() || 0}</span>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-center">
          <a 
            href={post.original_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-blue-600"
          >
            {post.platform === 'youtube' ? 'Watch Video' : 'View Original'}
          </a>
          
          <button
            onClick={handleCacheToggle}
            className={`text-xs px-2 py-1 rounded ${
              post.is_cached 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {post.is_cached ? 'Cached' : 'Cache Offline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
