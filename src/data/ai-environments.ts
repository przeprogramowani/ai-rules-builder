export enum AIEnvironmentName {
  GitHub = 'github',
  Cursor = 'cursor',
  Windsurf = 'windsurf',
  Aider = 'aider',
  Cline = 'cline',
  Junie = 'junie'
}

// Define the AI environment types for easier maintenance
export type AIEnvironment = `${AIEnvironmentName}`;

type  EnvConfig = {
  [key in AIEnvironmentName]: {
    filePath: string;
    docsUrl: string;
  }
}

export const envConfig: EnvConfig = {
  github: {
    filePath: '.github/copilot-instructions.md',
    docsUrl: 'https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot'
  },
  cursor: {
    filePath: 'rule.mdc',
    docsUrl: 'https://docs.cursor.com/context/rules-for-ai'
  },
  windsurf: {
    filePath: '.windsurfrules',
    docsUrl: 'https://docs.codeium.com/windsurf/memories#windsurfrules'
  },
  cline: {
    filePath: '.clinerules',
    docsUrl: 'https://docs.cline.bot/improving-your-prompting-skills/prompting#clinerules-file'
  },
  aider: {
    filePath: 'CONVENTIONS.md',
    docsUrl: 'https://aider.chat/docs/usage/conventions.html'
  },
  junie: {
    filePath: '.junie/guidelines.md',
    docsUrl: 'https://www.jetbrains.com/guide/ai/article/junie/intellij-idea/'
  }
};
