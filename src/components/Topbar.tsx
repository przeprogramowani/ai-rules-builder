import { WandSparkles, LogIn, LogOut, Menu } from 'lucide-react';
import DependencyUploader from './rule-parser/DependencyUploader';
import { useAuthStore } from '../store/authStore';
import { useEffect, useState } from 'react';

interface TopbarProps {
  title?: string;
  initialUser?: {
    id: string;
    email: string | null;
  };
}

export default function Topbar({ title = '10xRules.ai', initialUser }: TopbarProps) {
  const { user, setUser, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize auth store with user data from server
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser, setUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="sticky top-0 z-10 w-full bg-gray-900 border-b border-gray-800 p-3 px-4 md:p-4 md:px-6 shadow-md">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3 group">
            <WandSparkles className="size-4 text-blue-400 group-hover:text-teal-400 transition-colors duration-300" />
            <h1 className="font-mono text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent group-hover:from-teal-400 group-hover:to-purple-400 transition-colors duration-300">
              {title}
            </h1>
          </div>

          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <Menu className="size-5" />
          </button>
        </div>

        <div
          className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-800`}
        >
          <DependencyUploader />
          {user ? (
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
              <span className="text-gray-400 text-sm truncate max-w-full">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
            >
              <LogIn className="size-4" />
              <span>Login</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
