import { FileText, Shield, Menu, Home } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavigationDropdownProps {
  isAdmin: boolean;
  hasPromptAccess: boolean;
  currentPath: string;
}

export default function NavigationDropdown({
  isAdmin,
  hasPromptAccess,
  currentPath,
}: NavigationDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Get current page info for button display
  const getCurrentPageInfo = () => {
    if (currentPath.startsWith('/prompts/admin')) {
      return { icon: Shield, text: 'Prompts Admin' };
    }
    if (currentPath === '/prompts') {
      return { icon: FileText, text: 'Prompts Library' };
    }
    return { icon: Home, text: 'Rules Builder' };
  };

  const currentPage = getCurrentPageInfo();
  const CurrentIcon = currentPage.icon;

  return (
    <div className="relative" data-dropdown>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <CurrentIcon className="size-4" />
        <span className="hidden md:inline">{currentPage.text}</span>
        <Menu className="size-3 opacity-70" />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-20">
          <a
            href="/"
            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
              currentPath === '/'
                ? 'bg-blue-900/30 text-blue-300'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <Home className="size-4" />
            Rules Builder
          </a>

          {hasPromptAccess && (
            <>
              <a
                href="/prompts"
                className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                  currentPath === '/prompts'
                    ? 'bg-teal-900/30 text-teal-300'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <FileText className="size-4" />
                Prompts Library
              </a>

              {isAdmin && (
                <a
                  href="/prompts/admin"
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    currentPath.startsWith('/prompts/admin')
                      ? 'bg-purple-900/30 text-purple-300'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Shield className="size-4" />
                  Prompts Admin
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
