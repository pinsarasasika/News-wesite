import React from 'react';
import { Radio } from 'lucide-react';
import type { NewsArticle } from '../types';

interface BreakingTickerProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
}

export const BreakingTicker: React.FC<BreakingTickerProps> = ({
  articles,
  onArticleClick,
}) => {
  const breakingArticles = articles.filter((a) => a.isBreaking);

  if (breakingArticles.length === 0) return null;

  // Repeat items to ensure smooth continuous looping marquee animation
  const repeatedArticles = [...breakingArticles, ...breakingArticles, ...breakingArticles];

  return (
    <div className="breaking-ticker">
      <div className="ticker-label">
        <div className="ticker-pulse"></div>
        <Radio size={14} />
        Breaking News
      </div>
      <div className="ticker-marquee">
        <div className="ticker-track">
          {repeatedArticles.map((article, idx) => (
            <div
              key={`${article.id}-${idx}`}
              className="ticker-item"
              onClick={() => onArticleClick(article)}
            >
              <span className="ticker-dot"></span>
              {article.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
