import { useAuthStore } from '../store/authStore';
import { usePromptsStore } from '../store/promptsStore';
import { useEffect, useState } from 'react';
import LoginButton from './auth/LoginButton';
import NavigationDropdown from './NavigationDropdown';
import Logo from './ui/Logo';

interface TopbarProps {
  initialUser?: {
    id: string;
    email: string | null;
  };
}

export default function Topbar({ initialUser }: TopbarProps) {
  const { setUser } = useAuthStore();
  const { organizations, fetchOrganizations, isLoading } = usePromptsStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Mark as hydrated after first client-side mount
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // Initialize auth store with user data from server
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser, setUser]);

  // Fetch organizations to check admin access
  useEffect(() => {
    if (initialUser) {
      fetchOrganizations();
    }
  }, [initialUser, fetchOrganizations]);

  // Check if user is admin
  const isAdmin = organizations.some((org) => org.role === 'admin');
  const hasPromptAccess = organizations.length > 0;

  // Get current path for active state
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  // Count available navigation items
  const availableNavItems = 1 + (hasPromptAccess ? 1 : 0) + (isAdmin ? 1 : 0);
  const showNavigation = availableNavItems > 1;

  // Don't show navigation until hydrated and data loaded
  const shouldShowNavigation = hasHydrated && !isLoading && showNavigation;

  return (
    <header className="sticky top-0 z-10 w-full bg-gray-900 border-b border-gray-800 p-3 px-4 md:p-4 md:px-6 shadow-md">
      <div className="flex flex-row justify-between items-center">
        <a href="/">
          <Logo size="sm" />
        </a>

        <div className="flex flex-row items-center space-x-4">
          {/* Navigation Dropdown */}
          {initialUser && (
            <>
              {shouldShowNavigation ? (
                <NavigationDropdown
                  isAdmin={isAdmin}
                  hasPromptAccess={hasPromptAccess}
                  currentPath={currentPath}
                />
              ) : !hasHydrated || isLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 animate-pulse">
                  <div className="size-4 bg-gray-700 rounded" />
                  <div className="hidden md:block h-5 w-24 bg-gray-700 rounded" />
                  <div className="size-3 bg-gray-700 rounded" />
                </div>
              ) : null}
            </>
          )}

          <LoginButton />
        </div>
      </div>
    </header>
  );
}
