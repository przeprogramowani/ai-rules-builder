import { WandSparkles, LogIn, LogOut } from 'lucide-react';
import DependencyUploader from './rule-parser/DependencyUploader';
import { useAuthStore } from '../store/authStore';
import { useEffect } from 'react';

interface TopbarProps {
  title?: string;
  initialUser?: {
    id: string;
    email: string | null;
  };
}

export default function Topbar({ title = '10xRules.ai', initialUser }: TopbarProps) {
  const { user, setUser, logout } = useAuthStore();

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

  return (
    <header className="sticky top-0 z-10 w-full bg-gray-900 border-b border-gray-800 p-3 px-4 md:p-4 md:px-6 shadow-md">
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center space-x-3 group">
          <WandSparkles className="size-4 text-blue-400 group-hover:text-teal-400 transition-colors duration-300" />
          <h1 className="font-mono text-lg md:text-xl font-semibold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent group-hover:from-teal-400 group-hover:to-purple-400 transition-colors duration-300">
            {title}
          </h1>
        </div>

        <div className="flex flex-row items-center space-x-4">
          <div className="w-auto">
            <DependencyUploader />
          </div>
          {user ? (
            <div className="flex flex-row items-center space-x-4">
              <span className="hidden md:block text-gray-400 text-sm truncate max-w-full">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
                aria-label="Logout"
              >
                <LogOut className="size-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="Login"
            >
              <LogIn className="size-4" />
              <span className="hidden md:inline">Login</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
