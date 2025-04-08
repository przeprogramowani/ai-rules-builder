import { LogIn, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { isFeatureEnabled } from '../../features/featureFlags';

export default function LoginButton() {
  const { user, logout } = useAuthStore();

  // If auth feature is disabled, render nothing
  if (!isFeatureEnabled('auth')) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (user) {
    return (
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
    );
  }

  return (
    <a
      href="/auth/login"
      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors duration-200"
      aria-label="Login"
    >
      <LogIn className="size-4" />
      <span className="hidden md:inline">Login</span>
    </a>
  );
}
