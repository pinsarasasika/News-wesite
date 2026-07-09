import React from 'react';
import { Flame, Eye } from 'lucide-react';
import type { NewsArticle } from '../types';
import { ArticleCard } from '../components/ArticleCard';
import { Newsletter } from '../components/Newsletter';

interface HomeProps {
  articles: NewsArticle[];
  currentTab: string;
  searchQuery: string;
  onArticleClick: (article: NewsArticle) => void;
}

export const Home: React.FC<HomeProps> = ({
  articles,
  currentTab,
  searchQuery,
  onArticleClick,
}) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Filter articles by category and search query
  const filteredArticles = articles.filter((article) => {
    const matchesCategory = currentTab === 'all' || article.category.toLowerCase() === currentTab.toLowerCase();
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Find the top "Hot" article for the hero banner. If none, take the newest article.
  const hotArticles = articles.filter((a) => a.isHot);
  const heroArticle = hotArticles.length > 0 ? hotArticles[0] : articles[0];

  // Latest side stories (excluding the hero article)
  const sideArticles = articles.filter((a) => a.id !== heroArticle?.id).slice(0, 3);

  // Other grid stories (excluding the hero article)
  const gridArticles = filteredArticles.filter((a) => a.id !== heroArticle?.id);

  return (
    <div className="container home-sections">
      {/* Hero / Hot News Section (Only show when there's no active search query and on 'All' category tab) */}
      {!searchQuery && currentTab === 'all' && heroArticle && (
        <section className="hero-grid">
          <div className="hero-main glass" onClick={() => onArticleClick(heroArticle)}>
            <div className="hero-img-container">
              <img src={heroArticle.imageUrl} alt={heroArticle.title} />
              <div className="hero-overlay">
                <div className="hero-meta">
                  <span className="badge badge-category">{heroArticle.category}</span>
                  {heroArticle.isBreaking && <span className="badge badge-breaking">Breaking</span>}
                  <span className="badge badge-hot">
                    <Flame size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Hot News
                  </span>
                </div>
                <h2 className="hero-title">{heroArticle.title}</h2>
                <p className="hero-excerpt">{heroArticle.excerpt}</p>
                <div className="hero-author-row">
                  <span>By <strong>{heroArticle.author}</strong></span>
                  <span>•</span>
                  <span>{heroArticle.readTime}</span>
                  <span>•</span>
                  <span>{formatDate(heroArticle.publishedAt)}</span>
                  <span>•</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={12} /> {heroArticle.views.toLocaleString()} views
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-side-panel">
            <h3 className="panel-header">
              <Flame size={18} style={{ color: 'var(--accent-gold)' }} />
              Trending Headlines
            </h3>
            {sideArticles.map((article) => (
              <div
                key={article.id}
                className="side-article-card glass"
                onClick={() => onArticleClick(article)}
              >
                <div className="side-card-meta">
                  <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                    {article.category}
                  </span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h4 className="side-card-title">{article.title}</h4>
                <div className="side-card-footer">
                  <span>{article.author}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={11} /> {article.views.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grid News Section */}
      <section>
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700 }}>
            {searchQuery
              ? `Search Results for "${searchQuery}"`
              : currentTab === 'all'
              ? 'Recent Coverage'
              : `${currentTab} News`}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing {gridArticles.length + (currentTab === 'all' && heroArticle && !searchQuery ? 1 : 0)} stories
          </div>
        </div>

        {gridArticles.length > 0 ? (
          <div className="news-grid">
            {gridArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onClick={() => onArticleClick(article)}
              />
            ))}
          </div>
        ) : (
          <div
            className="glass"
            style={{
              padding: '60px',
              textAlign: 'center',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--text-muted)',
            }}
          >
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No stories match your filters.</p>
            <p style={{ fontSize: '13px' }}>Try adjusting your search terms or picking another category.</p>
          </div>
        )}
      </section>

      {/* Newsletter Block */}
      <section>
        <Newsletter />
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <p>© 2026 Chronicle Live Media Group. All rights reserved.</p>
        <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
          Powered by React, GitHub API, and LocalStorage for fully serverless content publishing.
        </p>
      </footer>
    </div>
  );
};
