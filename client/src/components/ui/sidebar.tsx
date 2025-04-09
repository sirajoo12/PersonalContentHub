import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Home, 
  PlusCircle, 
  BarChart2, 
  Settings as SettingsIcon,
  Menu,
  X 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  selectedPlatforms: string[];
  onSelectPlatform: (platform: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed = false, 
  onToggle,
  selectedPlatforms,
  onSelectPlatform
}) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const isPlatformSelected = (platform: string) => {
    return selectedPlatforms.includes(platform);
  };

  const togglePlatform = (platform: string) => {
    onSelectPlatform(platform);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-white p-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-primary">SocialSync</h1>
        <button 
          type="button" 
          className="text-gray-500 hover:text-gray-600"
          onClick={onToggle}
        >
          {collapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${collapsed ? 'hidden' : 'fixed inset-0 z-50 bg-white md:relative md:inset-auto'} md:flex md:flex-shrink-0`}>
        <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            
            {/* Logo */}
            <div className="flex items-center flex-shrink-0 px-4 mb-5">
              <h1 className="text-xl font-semibold text-primary">SocialSync</h1>
            </div>
            
            {/* Navigation */}
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              <Link href="/">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                  location === '/' 
                    ? 'text-primary bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <Home className="mr-3 h-6 w-6" />
                  Dashboard
                </a>
              </Link>
              
              <Link href="/create-post">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                  location === '/create-post' 
                    ? 'text-primary bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <PlusCircle className="mr-3 h-6 w-6" />
                  Create Post
                </a>
              </Link>
              
              <Link href="/analytics">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                  location === '/analytics' 
                    ? 'text-primary bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <BarChart2 className="mr-3 h-6 w-6" />
                  Analytics
                </a>
              </Link>
              
              <Link href="/settings">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                  location === '/settings' 
                    ? 'text-primary bg-gray-100' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  <SettingsIcon className="mr-3 h-6 w-6" />
                  Settings
                </a>
              </Link>
            </nav>
            
            {/* Platform Filters */}
            <div className="px-3 mt-6">
              <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Platforms
              </h2>
              <div className="mt-2 space-y-1">
                <button 
                  onClick={() => togglePlatform('instagram')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isPlatformSelected('instagram') 
                      ? 'text-gray-900 bg-gray-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2.5 h-2.5 mr-4 bg-[#E1306C] rounded-full" aria-hidden="true"></span>
                  <span className="truncate">Instagram</span>
                </button>
                
                <button 
                  onClick={() => togglePlatform('youtube')}
                  className={`flex w-full items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isPlatformSelected('youtube') 
                      ? 'text-gray-900 bg-gray-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="w-2.5 h-2.5 mr-4 bg-[#FF0000] rounded-full" aria-hidden="true"></span>
                  <span className="truncate">YouTube</span>
                </button>
                
                <Link href="/settings">
                  <a className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900">
                    <span className="w-2.5 h-2.5 mr-4 bg-gray-300 rounded-full" aria-hidden="true"></span>
                    <span className="truncate">Connect More</span>
                  </a>
                </Link>
              </div>
            </div>
          </div>
          
          {/* User Profile */}
          {user && (
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 group block w-full">
                <div className="flex items-center">
                  <div>
                    <img 
                      className="inline-block h-10 w-10 rounded-full" 
                      src={user.avatar_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
                      alt="Profile"
                    />
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-base font-medium text-gray-700 group-hover:text-gray-900">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-sm font-medium text-gray-500 group-hover:text-gray-700">
                      {user.email || ''}
                    </p>
                  </div>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="text-sm text-gray-500 hover:text-gray-900"
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
