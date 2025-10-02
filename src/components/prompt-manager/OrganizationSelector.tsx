import React from 'react';
import { usePromptsStore } from '../../store/promptsStore';
import { Dropdown, type DropdownOption } from '../ui/Dropdown';

export const OrganizationSelector: React.FC = () => {
  const { organizations, activeOrganization, setActiveOrganization } = usePromptsStore();

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

  if (organizations.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
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
