// Attribution registry — open-source we build ON, shown in Settings → Credits (source appreciation).
// If you add an OSS dependency, add it here with its license + link. Honesty over pretense.
export interface Credit { name: string; license: string; url: string; use: string }

export const OSS_CREDITS: Credit[] = [
  { name: 'React', license: 'MIT', url: 'https://github.com/facebook/react', use: 'UI framework' },
  { name: 'Vite', license: 'MIT', url: 'https://github.com/vitejs/vite', use: 'build + dev server' },
  { name: 'TypeScript', license: 'Apache-2.0', url: 'https://github.com/microsoft/TypeScript', use: 'language + type safety' },
  { name: 'Tone.js', license: 'MIT', url: 'https://github.com/Tonejs/Tone.js', use: 'procedural audio / music engine' },
  { name: 'Vitest', license: 'MIT', url: 'https://github.com/vitest-dev/vitest', use: 'test runner' },
  { name: 'tsx', license: 'MIT', url: 'https://github.com/privatenumber/tsx', use: 'node TS execution (scripts)' },
];

export const PROVENANCE: Credit[] = [
  { name: 'FAR_NZY farkle-engine', license: 'source repo', url: 'https://github.com/libriopal/FAR_NZY', use: 'scoreFarkle · CSPRNG · commit-reveal (ported behavior-identical)' },
  { name: 'D2 research corpus', license: 'project-internal', url: 'https://github.com/libriopal/magentadice-cyancode', use: 'the design-space geometry + King of Tokyo experience discovery' },
];
