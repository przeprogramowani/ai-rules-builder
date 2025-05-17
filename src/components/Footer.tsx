import { GitBranch, Rocket, BadgeInfo } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="sticky bottom-0 z-10 w-full bg-gray-900 text-gray-400 p-4 border-t border-gray-800 hidden md:block">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span className="text-sm">Made by 10xDevs & Friends</span>
        </div>
        <div className="flex gap-6 text-sm">
          <a
            href="https://10xdevs.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <Rocket className="size-4 mr-1" />
            10xDevs.pl
          </a>
          <a
            href="/privacy/en"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <BadgeInfo className="size-4 mr-1" />
            Privacy
          </a>
          <a
            href="https://github.com/przeprogramowani/ai-rules-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <GitBranch className="size-4 mr-1" />
            Improve this app
          </a>
        </div>
      </div>
    </footer>
  );
}
