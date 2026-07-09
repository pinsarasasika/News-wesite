import type { NewsArticle } from '../types';
import defaultNews from '../data/defaultNews.json';

const ARTICLES_KEY = 'news_app_articles';

export function getLocalArticles(): NewsArticle[] {
  const localData = localStorage.getItem(ARTICLES_KEY);
  const defaultArticles = defaultNews as NewsArticle[];

  if (!localData) {
    // Seed with default articles if first run
    localStorage.setItem(ARTICLES_KEY, JSON.stringify(defaultArticles));
    return defaultArticles;
  }
  try {
    const localArticles = JSON.parse(localData) as NewsArticle[];
    
    // Smart Merge: Identify articles in defaultNews that do not exist in local cache
    const localIds = new Set(localArticles.map((a) => a.id));
    const incomingNewArticles = defaultArticles.filter((a) => !localIds.has(a.id));
    
    let finalArticles = localArticles;
    if (incomingNewArticles.length > 0) {
      // Merge them in and save back to local storage
      finalArticles = [...incomingNewArticles, ...localArticles];
      localStorage.setItem(ARTICLES_KEY, JSON.stringify(finalArticles));
    }

    // Sort by publication date descending
    return finalArticles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch (e) {
    console.error('Failed to parse local articles', e);
    return defaultArticles;
  }
}

export function saveLocalArticles(articles: NewsArticle[]): void {
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(articles));
}

export function resetToDefaultArticles(): NewsArticle[] {
  localStorage.setItem(ARTICLES_KEY, JSON.stringify(defaultNews));
  return defaultNews as NewsArticle[];
}
