import React from 'react';

/**
 * This component is never rendered in the UI.
 * Its sole purpose is to ensure Tailwind generates all the dynamic classes we need.
 * Classes MUST be written as static strings for Tailwind to detect them.
 */
export const TailwindSafelist: React.FC = () => {
  return (
    <div className="hidden">
      {/* ORANGE VARIANTS */}
      {/* Base classes */}
      <div className="bg-orange"></div>
      <div className="text-orange"></div>
      <div className="border-orange"></div>
      <div className="ring-orange"></div>
      <div className="shadow-orange"></div>
      <div className="hover:bg-orange"></div>
      <div className="hover:text-orange"></div>
      <div className="hover:border-orange"></div>
      <div className="peer-focus:ring-orange"></div>
      <div className="peer-checked:bg-orange"></div>

      {/* Opacity variants */}
      <div className="bg-orange/5"></div>
      <div className="bg-orange/10"></div>
      <div className="bg-orange/15"></div>
      <div className="bg-orange/20"></div>
      <div className="bg-orange/30"></div>
      <div className="bg-orange/40"></div>
      <div className="bg-orange/50"></div>
      <div className="bg-orange/60"></div>
      <div className="bg-orange/70"></div>
      <div className="bg-orange/80"></div>
      <div className="bg-orange/90"></div>
      <div className="bg-orange/100"></div>

      <div className="text-orange/5"></div>
      <div className="text-orange/10"></div>
      <div className="text-orange/15"></div>
      <div className="text-orange/20"></div>
      <div className="text-orange/30"></div>
      <div className="text-orange/40"></div>
      <div className="text-orange/50"></div>
      <div className="text-orange/60"></div>
      <div className="text-orange/70"></div>
      <div className="text-orange/80"></div>
      <div className="text-orange/90"></div>
      <div className="text-orange/100"></div>

      <div className="border-orange/5"></div>
      <div className="border-orange/10"></div>
      <div className="border-orange/15"></div>
      <div className="border-orange/20"></div>
      <div className="border-orange/30"></div>
      <div className="border-orange/40"></div>
      <div className="border-orange/50"></div>
      <div className="border-orange/60"></div>
      <div className="border-orange/70"></div>
      <div className="border-orange/80"></div>
      <div className="border-orange/90"></div>
      <div className="border-orange/100"></div>

      <div className="ring-orange/5"></div>
      <div className="ring-orange/10"></div>
      <div className="ring-orange/15"></div>
      <div className="ring-orange/20"></div>
      <div className="ring-orange/30"></div>
      <div className="ring-orange/40"></div>
      <div className="ring-orange/50"></div>
      <div className="ring-orange/60"></div>
      <div className="ring-orange/70"></div>
      <div className="ring-orange/80"></div>
      <div className="ring-orange/90"></div>
      <div className="ring-orange/100"></div>

      {/* GREEN VARIANTS */}
      {/* Base classes */}
      <div className="bg-green"></div>
      <div className="text-green"></div>
      <div className="border-green"></div>
      <div className="ring-green"></div>
      <div className="shadow-green"></div>
      <div className="hover:bg-green"></div>
      <div className="hover:text-green"></div>
      <div className="hover:border-green"></div>
      <div className="peer-focus:ring-green"></div>
      <div className="peer-checked:bg-green"></div>

      {/* Opacity variants */}
      <div className="bg-green/5"></div>
      <div className="bg-green/10"></div>
      <div className="bg-green/15"></div>
      <div className="bg-green/20"></div>
      <div className="bg-green/30"></div>
      <div className="bg-green/40"></div>
      <div className="bg-green/50"></div>
      <div className="bg-green/60"></div>
      <div className="bg-green/70"></div>
      <div className="bg-green/80"></div>
      <div className="bg-green/90"></div>
      <div className="bg-green/100"></div>

      {/* BLUE VARIANTS */}
      {/* Base classes */}
      <div className="bg-blue"></div>
      <div className="text-blue"></div>
      <div className="border-blue"></div>
      <div className="ring-blue"></div>
      <div className="shadow-blue"></div>
      <div className="hover:bg-blue"></div>
      <div className="hover:text-blue"></div>
      <div className="hover:border-blue"></div>
      <div className="peer-focus:ring-blue"></div>
      <div className="peer-checked:bg-blue"></div>

      {/* Opacity variants */}
      <div className="bg-blue/5"></div>
      <div className="bg-blue/10"></div>
      <div className="bg-blue/15"></div>
      <div className="bg-blue/20"></div>
      <div className="bg-blue/30"></div>
      <div className="bg-blue/40"></div>
      <div className="bg-blue/50"></div>
      <div className="bg-blue/60"></div>
      <div className="bg-blue/70"></div>
      <div className="bg-blue/80"></div>
      <div className="bg-blue/90"></div>
      <div className="bg-blue/100"></div>

      {/* DEEP BLUE VARIANTS */}
      {/* Base classes */}
      <div className="bg-deepBlue"></div>
      <div className="text-deepBlue"></div>
      <div className="border-deepBlue"></div>
      <div className="ring-deepBlue"></div>
      <div className="shadow-deepBlue"></div>
      <div className="hover:bg-deepBlue"></div>
      <div className="hover:text-deepBlue"></div>
      <div className="hover:border-deepBlue"></div>
      <div className="peer-focus:ring-deepBlue"></div>
      <div className="peer-checked:bg-deepBlue"></div>

      {/* Opacity variants */}
      <div className="bg-deepBlue/5"></div>
      <div className="bg-deepBlue/10"></div>
      <div className="bg-deepBlue/15"></div>
      <div className="bg-deepBlue/20"></div>
      <div className="bg-deepBlue/30"></div>
      <div className="bg-deepBlue/40"></div>
      <div className="bg-deepBlue/50"></div>
      <div className="bg-deepBlue/60"></div>
      <div className="bg-deepBlue/70"></div>
      <div className="bg-deepBlue/80"></div>
      <div className="bg-deepBlue/90"></div>
      <div className="bg-deepBlue/100"></div>

      {/* MAGENTA VARIANTS */}
      {/* Base classes */}
      <div className="bg-magenta"></div>
      <div className="text-magenta"></div>
      <div className="border-magenta"></div>
      <div className="ring-magenta"></div>
      <div className="shadow-magenta"></div>
      <div className="hover:bg-magenta"></div>
      <div className="hover:text-magenta"></div>
      <div className="hover:border-magenta"></div>
      <div className="peer-focus:ring-magenta"></div>
      <div className="peer-checked:bg-magenta"></div>

      {/* Opacity variants */}
      <div className="bg-magenta/5"></div>
      <div className="bg-magenta/10"></div>
      <div className="bg-magenta/15"></div>
      <div className="bg-magenta/20"></div>
      <div className="bg-magenta/30"></div>
      <div className="bg-magenta/40"></div>
      <div className="bg-magenta/50"></div>
      <div className="bg-magenta/60"></div>
      <div className="bg-magenta/70"></div>
      <div className="bg-magenta/80"></div>
      <div className="bg-magenta/90"></div>
      <div className="bg-magenta/100"></div>

      {/* YELLOW VARIANTS */}
      {/* Base classes */}
      <div className="bg-yellow"></div>
      <div className="text-yellow"></div>
      <div className="border-yellow"></div>
      <div className="ring-yellow"></div>
      <div className="shadow-yellow"></div>
      <div className="hover:bg-yellow"></div>
      <div className="hover:text-yellow"></div>
      <div className="hover:border-yellow"></div>
      <div className="peer-focus:ring-yellow"></div>
      <div className="peer-checked:bg-yellow"></div>

      {/* Opacity variants */}
      <div className="bg-yellow/5"></div>
      <div className="bg-yellow/10"></div>
      <div className="bg-yellow/15"></div>
      <div className="bg-yellow/20"></div>
      <div className="bg-yellow/30"></div>
      <div className="bg-yellow/40"></div>
      <div className="bg-yellow/50"></div>
      <div className="bg-yellow/60"></div>
      <div className="bg-yellow/70"></div>
      <div className="bg-yellow/80"></div>
      <div className="bg-yellow/90"></div>
      <div className="bg-yellow/100"></div>

      {/* HEX COLOR VARIANTS */}
      <div className="bg-[#FF7A00]"></div>
      <div className="bg-[#FF7A00]/5"></div>
      <div className="bg-[#FF7A00]/10"></div>
      <div className="bg-[#FF7A00]/15"></div>
      <div className="bg-[#FF7A00]/20"></div>
      <div className="bg-[#FF7A00]/30"></div>
      <div className="bg-[#FF7A00]/40"></div>
      <div className="bg-[#FF7A00]/50"></div>

      <div className="bg-[#05FF00]"></div>
      <div className="bg-[#05FF00]/5"></div>
      <div className="bg-[#05FF00]/10"></div>
      <div className="bg-[#05FF00]/15"></div>
      <div className="bg-[#05FF00]/20"></div>
      <div className="bg-[#05FF00]/30"></div>
      <div className="bg-[#05FF00]/40"></div>
      <div className="bg-[#05FF00]/50"></div>

      <div className="bg-[#0085FF]"></div>
      <div className="bg-[#0085FF]/5"></div>
      <div className="bg-[#0085FF]/10"></div>
      <div className="bg-[#0085FF]/15"></div>
      <div className="bg-[#0085FF]/20"></div>
      <div className="bg-[#0085FF]/30"></div>
      <div className="bg-[#0085FF]/40"></div>
      <div className="bg-[#0085FF]/50"></div>

      <div className="bg-[#0006FF]"></div>
      <div className="bg-[#0006FF]/5"></div>
      <div className="bg-[#0006FF]/10"></div>
      <div className="bg-[#0006FF]/15"></div>
      <div className="bg-[#0006FF]/20"></div>
      <div className="bg-[#0006FF]/30"></div>
      <div className="bg-[#0006FF]/40"></div>
      <div className="bg-[#0006FF]/50"></div>

      <div className="bg-[#F900FF]"></div>
      <div className="bg-[#F900FF]/5"></div>
      <div className="bg-[#F900FF]/10"></div>
      <div className="bg-[#F900FF]/15"></div>
      <div className="bg-[#F900FF]/20"></div>
      <div className="bg-[#F900FF]/30"></div>
      <div className="bg-[#F900FF]/40"></div>
      <div className="bg-[#F900FF]/50"></div>

      <div className="bg-[#FFF900]"></div>
      <div className="bg-[#FFF900]/5"></div>
      <div className="bg-[#FFF900]/10"></div>
      <div className="bg-[#FFF900]/15"></div>
      <div className="bg-[#FFF900]/20"></div>
      <div className="bg-[#FFF900]/30"></div>
      <div className="bg-[#FFF900]/40"></div>
      <div className="bg-[#FFF900]/50"></div>

      {/* Additional commonly used combinations */}
      <div className="bg-gray-700/60"></div>
      <div className="bg-gray-800/70"></div>
      <div className="hover:bg-gray-700/70"></div>
    </div>
  );
};

export default TailwindSafelist;
