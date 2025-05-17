import React from 'react';
import { useCookieConsent } from '../../hooks/useCookieConsent';

interface CookieBannerProps {
  message?: string;
  acceptLabel?: string;
  declineLabel?: string;
}

const CookieBanner: React.FC<CookieBannerProps> = ({
  message = 'Allow cookies from tools like Google Analytics to help us improve this website.',
  acceptLabel = 'Accept',
  declineLabel = 'Decline',
}) => {
  const { isConsentGiven, setConsent } = useCookieConsent();

  if (isConsentGiven === true || isConsentGiven === null) {
    return null;
  }

  const bannerBaseClasses = 'z-50 bottom-0 w-full p-2 pb-16';
  const bannerVisibilityClasses = isConsentGiven === false ? 'fixed' : 'hidden';

  return (
    <div className={`${bannerBaseClasses} ${bannerVisibilityClasses}`}>
      <div className="w-full lg:w-4/5 xl:w-3/4 mx-auto flex flex-col md:flex-row justify-between items-center bg-gray-900/50 backdrop-blur-xl py-2.5 rounded-xl p-4 border border-gray-700 shadow-xl">
        <p className="text-sm text-white text-center md:text-left">{message}</p>
        <div className="flex items-center gap-3 mt-2 md:mt-0">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-500/80 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => setConsent(true)}
          >
            {acceptLabel}
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white border border-white/50 bg-transparent hover:bg-white/10 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50"
            onClick={() => setConsent(false)}
          >
            {declineLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
