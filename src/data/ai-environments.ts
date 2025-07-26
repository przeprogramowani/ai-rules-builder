export enum AIEnvironmentName {
  GitHubCopilot = 'githubcopilot',
  Cursor = 'cursor',
  Windsurf = 'windsurf',
  Aider = 'aider',
  Cline = 'cline',
  Junie = 'junie',
  RooCode = 'roocode',
  Zed = 'zed',
  ClaudeCode = 'claudecode',
  GeminiCLI = 'geminicli',
  OpenAICodex = 'openaicodex',
  GoogleJules = 'googlejules',
}

// Define the AI environment types for easier maintenance
export type AIEnvironment = `${AIEnvironmentName}`;

type AIEnvironmentConfig = {
  [key in AIEnvironmentName]: {
    displayName: string;
    filePath: string;
    docsUrl: string;
  };
};

// Multi-file environments that generate separate files for each rule category
export const multiFileEnvironments: ReadonlySet<AIEnvironment> = new Set<AIEnvironment>([
  AIEnvironmentName.Cline,
  AIEnvironmentName.Cursor,
  AIEnvironmentName.Windsurf,
]);

// Default environment to use when initializing the application
export const initialEnvironment: Readonly<AIEnvironment> = AIEnvironmentName.GitHubCopilot;

export const aiEnvironmentConfig: AIEnvironmentConfig = {
  githubcopilot: {
    displayName: 'GitHub Copilot',
    filePath: '.github/copilot-instructions.md',
    docsUrl:
      'https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot',
  },
  cursor: {
    displayName: 'Cursor',
    filePath: '.cursor/rules/{rule}.mdc',
    docsUrl: 'https://docs.cursor.com/context/rules-for-ai',
  },
  windsurf: {
    displayName: 'Windsurf',
    filePath: '.windsurf/rules/{rule}.mdc',
    docsUrl: 'https://docs.windsurf.com/windsurf/cascade/memories#rules',
  },
  cline: {
    displayName: 'Cline',
    filePath: '.clinerules/{rule}.md',
    docsUrl: 'https://docs.cline.bot/improving-your-prompting-skills/prompting#clinerules-file',
  },
  aider: {
    displayName: 'Aider',
    filePath: 'CONVENTIONS.md',
    docsUrl: 'https://aider.chat/docs/usage/conventions.html',
  },
  junie: {
    displayName: 'Junie',
    filePath: '.junie/guidelines.md',
    docsUrl: 'https://www.jetbrains.com/guide/ai/article/junie/intellij-idea/',
  },
  roocode: {
    displayName: 'Roo Code',
    filePath: '.roo/rules/{rule}.md',
    docsUrl:
      'https://docs.roocode.com/features/custom-instructions?_highlight=rules#rules-about-rules-files',
  },
  zed: {
    displayName: 'Zed',
    filePath: '.rules',
    docsUrl: 'https://zed.dev/docs/ai/rules',
  },
  claudecode: {
    displayName: 'Claude Code',
    filePath: 'CLAUDE.md',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
  },
  geminicli: {
    displayName: 'Gemini CLI',
    filePath: 'GEMINI.md',
    docsUrl: 'https://ai.google.dev/gemini-api',
  },
  openaicodex: {
    displayName: 'OpenAI Codex',
    filePath: 'AGENTS.md',
    docsUrl: 'https://platform.openai.com/docs/guides/code-generation',
  },
  googlejules: {
    displayName: 'Google Jules',
    filePath: 'AGENTS.md',
    docsUrl: 'https://ai.google.dev/',
  },
};
