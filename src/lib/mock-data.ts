// Single source of truth for dashboard mock data until the database is wired up.

export interface User {
  id: string;
  name: string;
  email: string;
  image: string;
  isPro: boolean;
}

export interface ItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  itemCount: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  itemCount: number;
  typeIds: string[];
  updatedAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  typeId: string;
  collectionId: string | null;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  createdAt: string;
  updatedAt: string;
}

export const currentUser: User = {
  id: 'user_1',
  name: 'John Doe',
  email: 'john@example.com',
  image: '',
  isPro: true,
};

export const itemTypes: ItemType[] = [
  {
    id: 'snippet',
    name: 'Snippets',
    icon: 'CodeXml',
    color: '#60a5fa',
    isSystem: true,
    itemCount: 24,
  },
  {
    id: 'prompt',
    name: 'Prompts',
    icon: 'Sparkles',
    color: '#a78bfa',
    isSystem: true,
    itemCount: 18,
  },
  {
    id: 'command',
    name: 'Commands',
    icon: 'Terminal',
    color: '#fb923c',
    isSystem: true,
    itemCount: 15,
  },
  {
    id: 'note',
    name: 'Notes',
    icon: 'StickyNote',
    color: '#facc15',
    isSystem: true,
    itemCount: 12,
  },
  {
    id: 'file',
    name: 'Files',
    icon: 'File',
    color: '#94a3b8',
    isSystem: true,
    itemCount: 5,
  },
  {
    id: 'image',
    name: 'Images',
    icon: 'Image',
    color: '#f472b6',
    isSystem: true,
    itemCount: 3,
  },
  {
    id: 'url',
    name: 'Links',
    icon: 'Link',
    color: '#4ade80',
    isSystem: true,
    itemCount: 8,
  },
];

export const collections: Collection[] = [
  {
    id: 'col_react_patterns',
    name: 'React Patterns',
    description: 'Common React patterns and hooks',
    isFavorite: true,
    itemCount: 12,
    typeIds: ['snippet', 'file', 'url'],
    updatedAt: '2026-01-18',
  },
  {
    id: 'col_python_snippets',
    name: 'Python Snippets',
    description: 'Useful Python code snippets',
    isFavorite: false,
    itemCount: 8,
    typeIds: ['snippet', 'file'],
    updatedAt: '2026-01-16',
  },
  {
    id: 'col_context_files',
    name: 'Context Files',
    description: 'AI context files for projects',
    isFavorite: true,
    itemCount: 5,
    typeIds: ['file', 'note'],
    updatedAt: '2026-01-14',
  },
  {
    id: 'col_interview_prep',
    name: 'Interview Prep',
    description: 'Technical interview preparation',
    isFavorite: false,
    itemCount: 24,
    typeIds: ['note', 'snippet', 'url', 'prompt', 'image'],
    updatedAt: '2026-01-13',
  },
  {
    id: 'col_git_commands',
    name: 'Git Commands',
    description: 'Frequently used git commands',
    isFavorite: true,
    itemCount: 15,
    typeIds: ['command', 'file'],
    updatedAt: '2026-01-11',
  },
  {
    id: 'col_ai_prompts',
    name: 'AI Prompts',
    description: 'Curated AI prompts for coding',
    isFavorite: false,
    itemCount: 18,
    typeIds: ['prompt', 'snippet', 'file'],
    updatedAt: '2026-01-09',
  },
];

export const items: Item[] = [
  {
    id: 'item_use_auth_hook',
    title: 'useAuth Hook',
    description: 'Custom authentication hook for React applications',
    typeId: 'snippet',
    collectionId: 'col_react_patterns',
    tags: ['react', 'auth', 'hooks'],
    isFavorite: true,
    isPinned: true,
    language: 'typescript',
    createdAt: '2026-01-15',
    updatedAt: '2026-01-15',
  },
  {
    id: 'item_api_error_handling',
    title: 'API Error Handling Pattern',
    description: 'Fetch wrapper with exponential backoff retry logic',
    typeId: 'snippet',
    collectionId: 'col_react_patterns',
    tags: ['api', 'fetch', 'error-handling'],
    isFavorite: false,
    isPinned: true,
    language: 'typescript',
    createdAt: '2026-01-12',
    updatedAt: '2026-01-12',
  },
  {
    id: 'item_debounce_hook',
    title: 'useDebounce Hook',
    description: 'Debounce any fast-changing value in React',
    typeId: 'snippet',
    collectionId: 'col_react_patterns',
    tags: ['react', 'hooks', 'performance'],
    isFavorite: false,
    isPinned: false,
    language: 'typescript',
    createdAt: '2026-01-08',
    updatedAt: '2026-01-08',
  },
  {
    id: 'item_git_undo_commit',
    title: 'Undo Last Commit',
    description: 'Keep changes staged while removing the latest commit',
    typeId: 'command',
    collectionId: 'col_git_commands',
    tags: ['git', 'commit'],
    isFavorite: true,
    isPinned: false,
    language: 'bash',
    createdAt: '2026-01-10',
    updatedAt: '2026-01-10',
  },
  {
    id: 'item_python_read_csv',
    title: 'Read CSV with Pandas',
    description: 'Load a CSV file into a DataFrame with sensible defaults',
    typeId: 'snippet',
    collectionId: 'col_python_snippets',
    tags: ['python', 'pandas', 'csv'],
    isFavorite: false,
    isPinned: false,
    language: 'python',
    createdAt: '2026-01-07',
    updatedAt: '2026-01-07',
  },
  {
    id: 'item_review_prompt',
    title: 'Code Review Prompt',
    description: 'Prompt that asks the model to review a diff for bugs and clarity',
    typeId: 'prompt',
    collectionId: 'col_ai_prompts',
    tags: ['ai', 'review'],
    isFavorite: true,
    isPinned: false,
    language: null,
    createdAt: '2026-01-06',
    updatedAt: '2026-01-06',
  },
  {
    id: 'item_project_context',
    title: 'Project Context Template',
    description: 'Reusable context file describing a project for AI assistants',
    typeId: 'file',
    collectionId: 'col_context_files',
    tags: ['ai', 'context'],
    isFavorite: false,
    isPinned: false,
    language: null,
    createdAt: '2026-01-05',
    updatedAt: '2026-01-05',
  },
  {
    id: 'item_system_design_notes',
    title: 'System Design Notes',
    description: 'Key trade-offs for common interview system design questions',
    typeId: 'note',
    collectionId: 'col_interview_prep',
    tags: ['interview', 'architecture'],
    isFavorite: true,
    isPinned: false,
    language: null,
    createdAt: '2026-01-04',
    updatedAt: '2026-01-04',
  },
  {
    id: 'item_tailwind_docs',
    title: 'Tailwind CSS Docs',
    description: 'Official Tailwind CSS documentation',
    typeId: 'url',
    collectionId: 'col_react_patterns',
    tags: ['css', 'docs'],
    isFavorite: false,
    isPinned: false,
    language: null,
    createdAt: '2026-01-03',
    updatedAt: '2026-01-03',
  },
];

export const mockData = {
  currentUser,
  itemTypes,
  collections,
  items,
};
