import React, { useEffect } from 'react';
import { X, Calendar, Clock, Eye, Share2 } from 'lucide-react';
import type { NewsArticle } from '../types';

interface ArticleDetailProps {
  article: NewsArticle;
  onClose: () => void;
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onClose }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  // Basic custom markdown parser for clean editorial presentation
  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // Header 3
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx}>{trimmed.replace('### ', '')}</h3>;
      }

      // Blockquote
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx}>
            {trimmed.replace(/^>\s*/, '').replace(/"/g, '')}
          </blockquote>
        );
      }

      // Bullet List
      if (trimmed.includes('\n- ') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').map((item) => item.replace(/^-\s*/, ''));
        return (
          <ul key={idx}>
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ul>
        );
      }

      // Numbered List
      if (trimmed.includes('\n1. ') || trimmed.startsWith('1. ')) {
        const items = trimmed.split('\n').map((item) => item.replace(/^\d+\.\s*/, ''));
        return (
          <ol key={idx}>
            {items.map((item, itemIdx) => (
              <li key={itemIdx}>{item}</li>
            ))}
          </ol>
        );
      }

      // Standard Paragraph
      return <p key={idx}>{trimmed}</p>;
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="detail-img-container">
          <img src={article.imageUrl} alt={article.title} />
          {article.imageCaption && (
            <div className="detail-img-caption">{article.imageCaption}</div>
          )}
        </div>

        <div className="detail-body">
          <div className="detail-meta-row">
            <span className="badge badge-category">{article.category}</span>
            {article.isBreaking && <span className="badge badge-breaking">Breaking News</span>}
            {article.isHot && <span className="badge badge-hot">Hot Story</span>}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
                onClick={handleShare}
                title="Share Article"
              >
                <Share2 size={14} />
              </button>
            </span>
          </div>

          <h1 className="detail-title">{article.title}</h1>

          <div className="detail-author-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--surface-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-blue)',
                  fontWeight: 700,
                }}
              >
                {article.author.charAt(0)}
              </div>
              <div className="author-details">
                <span className="author-lbl">Reported By</span>
                <span className="author-val">{article.author}</span>
              </div>
            </div>

            <div className="detail-stats">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> {formatDate(article.publishedAt)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> {article.readTime}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Eye size={14} /> {article.views.toLocaleString()} views
              </span>
            </div>
          </div>

          <div className="detail-article-content">
            {renderContent(article.content)}
          </div>

          <div className="detail-tags">
            {article.tags.map((tag) => (
              <span key={tag} className="tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
