import React, { useState } from 'react';
import { RuleBuilder } from './rule-builder';
import { RulePreview } from './rule-preview';
import { ArrowLeftRight } from 'lucide-react';

export default function TwoPane() {
  const [showBuilder, setShowBuilder] = useState(true);

  const toggleView = () => {
    setShowBuilder(!showBuilder);
  };

  return (
    <div className="flex relative flex-col h-full max-h-screen md:flex-row bg-gray-950">
      {/* Mobile Toggle Button - Only visible on small screens */}
      <button
        onClick={toggleView}
        className="absolute top-2 right-2 z-10 p-2 text-gray-200 bg-gray-800 rounded-full md:hidden"
        aria-label={showBuilder ? 'Show Preview' : 'Show Builder'}
      >
        <ArrowLeftRight className="size-5" />
      </button>

      {/* Left Pane - Rule Builder */}
      <div
        className={`${
          showBuilder ? 'block' : 'hidden'
        } md:block w-full md:w-1/3 lg:w-2/5 p-4 border-b md:border-b-0 md:border-r border-gray-800 min-h-full overflow-y-auto`}
      >
        <RuleBuilder />
      </div>

      {/* Right Pane - Rules Output */}
      <div
        className={`${
          !showBuilder ? 'block' : 'hidden'
        } md:block w-full md:w-2/3 lg:w-3/5 p-4 min-h-full overflow-y-auto`}
      >
        <RulePreview />
      </div>
    </div>
  );
}
