import React, { useState, useEffect } from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { Dropdown, type DropdownOption } from '../ui/Dropdown';

export const OrganizationSelector: React.FC = () => {
  const { organizations, activeOrganization, setActiveOrganization, isLoading } = usePromptsStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  // Mark as hydrated only after first client-side mount
  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const options: DropdownOption<string>[] = organizations.map((org) => ({
    value: org.id,
    label: org.name,
  }));

  const handleChange = (organizationId: string) => {
    const selectedOrg = organizations.find((org) => org.id === organizationId);
    if (selectedOrg) {
      setActiveOrganization(selectedOrg);
    }
  };

  // Show skeleton during initial load or while fetching
  if (!hasHydrated || (organizations.length === 0 && isLoading)) {
    return (
      <div className="animate-pulse">
        <div className="h-5 w-24 bg-gray-700 rounded mb-2" />
        <div className="h-[42px] w-[180px] bg-gray-700 rounded" />
      </div>
    );
  }

  // Hide if no organizations after loading
  if (organizations.length === 0) {
    return null;
  }

  return (
    <div>
      <Dropdown
        label="Organization"
        options={options}
        value={activeOrganization?.id || ''}
        onChange={handleChange}
        placeholder="Select organization"
      />
    </div>
  );
};

export default OrganizationSelector;
