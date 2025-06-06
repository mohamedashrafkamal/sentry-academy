import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { useDebounce } from '../../hooks/useDebounce';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  // Initialize search query from URL on mount and when navigating to different pages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search') || '';
    setSearchQuery(searchParam);
  }, [location.pathname]); // Only when pathname changes, not on every search update

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Handle search navigation
  useEffect(() => {
    // Only proceed if there's a debounced search query different from URL
    const currentParams = new URLSearchParams(location.search);
    const currentSearchParam = currentParams.get('search') || '';

    if (debouncedSearchQuery.trim() && debouncedSearchQuery !== currentSearchParam) {
      // If we're already on the courses listing page (not a specific course), update the URL without navigation
      if (location.pathname === '/courses') {
        const params = new URLSearchParams(location.search);
        params.set('search', debouncedSearchQuery);
        navigate(`/courses?${params.toString()}`, { replace: true });
      } else if (!location.pathname.startsWith('/courses/')) {
        // Only navigate to courses page with search if we're not on a course detail page
        navigate(`/courses?search=${encodeURIComponent(debouncedSearchQuery)}`);
      }
    } else if (!debouncedSearchQuery.trim() && currentSearchParam) {
      // Clear search parameter if search is empty but URL has search (only on courses listing page)
      if (location.pathname === '/courses') {
        const params = new URLSearchParams(location.search);
        params.delete('search');
        const newUrl = params.toString() ? `/courses?${params.toString()}` : '/courses';
        navigate(newUrl, { replace: true });
      }
    }
  }, [debouncedSearchQuery, location.pathname, location.search, navigate]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center flex-1">
          <div className="md:hidden mr-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Menu"
              className="p-1"
            >
              <Menu size={24} />
            </Button>
          </div>
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="block w-full pl-10 pr-3 py-2 bg-gray-100 border-transparent rounded-lg focus:ring-blue-500 focus:border-blue-500 focus:bg-white"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="relative text-gray-500 hover:text-gray-700 focus:outline-none">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </button>

          <div className="relative">
            <button
              className="flex items-center space-x-2 text-gray-700 focus:outline-none"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              {user && (
                <Avatar
                  src={user.avatar}
                  alt={user.name}
                  fallback={user.name}
                  size="sm"
                />
              )}
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Your Profile
                </a>
                <a href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Settings
                </a>
                <button
                  onClick={handleLogout}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;