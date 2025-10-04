import React from 'react';
import { FileText, Users } from 'lucide-react';

interface AdminTabsProps {
  activeTab: 'prompts' | 'invites';
  showInvites?: boolean;
}

const AdminTabs: React.FC<AdminTabsProps> = ({ activeTab, showInvites = true }) => {
  const allTabs = [
    {
      id: 'prompts' as const,
      label: 'Prompts',
      icon: FileText,
      href: '/prompts/admin',
    },
    {
      id: 'invites' as const,
      label: 'Invites',
      icon: Users,
      href: '/prompts/admin/invites',
    },
  ];

  const tabs = showInvites ? allTabs : allTabs.filter((tab) => tab.id !== 'invites');

  return (
    <div className="border-b border-gray-800 mb-6">
      <nav className="-mb-px flex space-x-8" aria-label="Admin Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <a
              key={tab.id}
              href={tab.href}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="size-4" />
              {tab.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminTabs;
