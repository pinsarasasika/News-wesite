import React from 'react';
import { Eye, Clock, Calendar } from 'lucide-react';
import type { NewsArticle } from '../types';

interface ArticleCardProps {
  article: NewsArticle;
  onClick: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ article, onClick }) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <article className="article-card glass" onClick={onClick}>
      <div className="card-img-container">
        <img src={article.imageUrl} alt={article.title} loading="lazy" />
        <div className="card-badges">
          <span className="badge badge-category">{article.category}</span>
          {article.isBreaking && <span className="badge badge-breaking">Breaking</span>}
          {article.isHot && <span className="badge badge-hot">Hot</span>}
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{article.title}</h3>
        <p className="card-excerpt">{article.excerpt}</p>
        <div className="card-footer">
          <div className="card-author-info">
            <span className="author-name">{article.author}</span>
          </div>
          <div className="card-stats">
            <span className="card-stat" title="Estimated Read Time">
              <Clock size={12} />
              {article.readTime}
            </span>
            <span className="card-stat" title="Published Date">
              <Calendar size={12} />
              {formatDate(article.publishedAt)}
            </span>
            <span className="card-stat" title="Views">
              <Eye size={12} />
              {article.views.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
};
