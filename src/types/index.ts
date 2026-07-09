export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'World' | 'Tech' | 'Business' | 'Sports' | 'Entertainment' | 'Lifestyle';
  imageUrl: string;
  imageCaption?: string;
  author: string;
  publishedAt: string; // ISO 8601 timestamp
  readTime: string;
  isBreaking?: boolean;
  isHot?: boolean;
  tags: string[];
  views: number;
}

export interface GitSyncSettings {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  filePath: string; // e.g. "src/data/defaultNews.json" or whatever news database file we update
}

export interface WebhookSettings {
  newsletterUrl: string;
  newsletterEnabled: boolean;
  articleUrl: string;
  articleEnabled: boolean;
  publishUrl: string;
  publishEnabled: boolean;
}

