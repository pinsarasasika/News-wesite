import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { BreakingTicker } from './components/BreakingTicker';
import { Home } from './pages/Home';
import { Admin } from './pages/Admin';
import { ArticleDetail } from './components/ArticleDetail';
import type { NewsArticle } from './types';
import { getLocalArticles, saveLocalArticles } from './utils/articleStore';

function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [currentTab, setCurrentTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Load theme and articles on mount
  useEffect(() => {
    // Theme setup
    const savedTheme = localStorage.getItem('news_app_theme') as 'dark' | 'light' | null;
    const initialTheme = savedTheme || 'dark';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Articles setup
    const loadedArticles = getLocalArticles();
    setArticles(loadedArticles);
  }, []);

  // Update theme helper
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('news_app_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Open detailed article view and increment views
  const handleArticleClick = (article: NewsArticle) => {
    // Increment view count locally
    const updated = articles.map((a) => {
      if (a.id === article.id) {
        const nextViews = a.views + 1;
        // Keep selected in sync with new views
        const updatedArt = { ...a, views: nextViews };
        setSelectedArticle(updatedArt);
        return updatedArt;
      }
      return a;
    });

    setArticles(updated);
    saveLocalArticles(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isAdmin={isAdmin}
        setIsAdmin={setIsAdmin}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Breaking News Marquee (Only on Home View) */}
      {!isAdmin && (
        <BreakingTicker articles={articles} onArticleClick={handleArticleClick} />
      )}

      {/* Core Routing Content */}
      {isAdmin ? (
        <Admin
          onBackToHome={() => setIsAdmin(false)}
          articles={articles}
          setArticles={setArticles}
        />
      ) : (
        <Home
          articles={articles}
          currentTab={currentTab}
          searchQuery={searchQuery}
          onArticleClick={handleArticleClick}
        />
      )}

      {/* Deep Immersive Article Read Screen */}
      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}

export default App;
