import { X, GitBranch, Rocket } from 'lucide-react';

export default function Footer({ envName }: { envName: string }) {
  return (
    <footer className="sticky bottom-0 z-10 w-full bg-gray-900 text-gray-400 p-4 border-t border-gray-800 hidden md:block">
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <span className="text-sm">{new Date().getFullYear()} - 10xRules by 10xDevs.pl</span>
          <span className="text-sm">Env: {envName}</span>
        </div>
        <div className="flex gap-6 text-sm">
          <a
            href="https://10xdevs.pl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <Rocket className="size-4 mr-1" />
            10xDevs
          </a>
          <a
            href={`https://x.com/share?text=${encodeURIComponent(
              'Rules for AI - generate rules for @cursor_ai, @windsurf_ai and Copilot based on your tech stack.\n\n',
            )}&url=${encodeURIComponent('https://10xrules.ai')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <X className="size-4 mr-1" />
            Share on X
          </a>
          <a
            href="https://github.com/przeprogramowani/ai-rules-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-indigo-400 transition-colors duration-200 ease-in-out flex items-center"
          >
            <GitBranch className="size-4 mr-1" />
            Contribute
          </a>
        </div>
      </div>
    </footer>
  );
}
