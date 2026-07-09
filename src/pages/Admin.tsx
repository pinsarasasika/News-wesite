import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Settings,
  GitCommit,
  Eye,
  Trash2,
  Edit,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronRight,
  RefreshCw,
  Zap,
  Share2,
  Copy,
  Check,
  Cpu,
  Download,
} from 'lucide-react';
import type { NewsArticle, GitSyncSettings, WebhookSettings } from '../types';
import { saveLocalArticles, resetToDefaultArticles } from '../utils/articleStore';
import { getGitSyncSettings, saveGitSyncSettings, pushNewsToGitHub } from '../utils/githubSync';
import {
  getWebhookSettings,
  saveWebhookSettings,
  triggerArticleWebhook,
  triggerPublishWebhook,
  sendTestWebhook,
} from '../utils/webhookSync';
import n8nWorkflow from '../../n8n_news_automation_workflow.json';
import confetti from 'canvas-confetti';

const N8N_WORKFLOW_JSON = JSON.stringify(n8nWorkflow, null, 2);

interface AdminProps {
  onBackToHome: () => void;
  articles: NewsArticle[];
  setArticles: (articles: NewsArticle[]) => void;
}

export const Admin: React.FC<AdminProps> = ({ onBackToHome, articles, setArticles }) => {
  const [adminTab, setAdminTab] = useState<'overview' | 'manage' | 'editor' | 'settings' | 'automation'>('overview');
  const [gitSettings, setGitSettings] = useState<GitSyncSettings>({
    token: '',
    owner: '',
    repo: '',
    branch: 'main',
    filePath: 'src/data/defaultNews.json',
  });
  const [webhookSettings, setWebhookSettings] = useState<WebhookSettings>({
    newsletterUrl: '',
    newsletterEnabled: false,
    articleUrl: '',
    articleEnabled: false,
    publishUrl: '',
    publishEnabled: false,
  });

  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'sending' | 'success' | 'error'>>({
    newsletter: 'idle',
    article: 'idle',
    publish: 'idle',
  });
  const [testError, setTestError] = useState<Record<string, string>>({
    newsletter: '',
    article: '',
    publish: '',
  });
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);


  // Editor Form States
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorExcerpt, setEditorExcerpt] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorCategory, setEditorCategory] = useState<NewsArticle['category']>('Tech');
  const [editorImageUrl, setEditorImageUrl] = useState('');
  const [editorImageCaption, setEditorImageCaption] = useState('');
  const [editorAuthor, setEditorAuthor] = useState('');
  const [editorIsBreaking, setEditorIsBreaking] = useState(false);
  const [editorIsHot, setEditorIsHot] = useState(false);
  const [editorTags, setEditorTags] = useState('');

  // Sync statuses
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncError, setSyncError] = useState('');
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);

  // Load Git and Webhook settings on mount
  useEffect(() => {
    const saved = getGitSyncSettings();
    if (saved) {
      setGitSettings(saved);
    }

    const savedWebhooks = getWebhookSettings();
    if (savedWebhooks) {
      setWebhookSettings(savedWebhooks);
    }

    // Check if there are changes compared to default database (rough check based on length or modification tracker)
    const unsynced = localStorage.getItem('news_app_unsynced') === 'true';
    setHasUnsyncedChanges(unsynced);
  }, []);

  // Compute metrics
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const breakingCount = articles.filter((a) => a.isBreaking).length;
  const hotCount = articles.filter((a) => a.isHot).length;

  const categoryDistribution = articles.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Editor logic
  const handleEditClick = (article: NewsArticle) => {
    setEditorId(article.id);
    setEditorTitle(article.title);
    setEditorExcerpt(article.excerpt);
    setEditorContent(article.content);
    setEditorCategory(article.category);
    setEditorImageUrl(article.imageUrl);
    setEditorImageCaption(article.imageCaption || '');
    setEditorAuthor(article.author);
    setEditorIsBreaking(!!article.isBreaking);
    setEditorIsHot(!!article.isHot);
    setEditorTags(article.tags.join(', '));
    setAdminTab('editor');
  };

  const handleCreateClick = () => {
    setEditorId(null);
    setEditorTitle('');
    setEditorExcerpt('');
    setEditorContent('');
    setEditorCategory('Tech');
    setEditorImageUrl('');
    setEditorImageCaption('');
    setEditorAuthor('');
    setEditorIsBreaking(false);
    setEditorIsHot(false);
    setEditorTags('');
    setAdminTab('editor');
  };

  const handleDeleteClick = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    const articleToDelete = articles.find((a) => a.id === id);
    const updated = articles.filter((a) => a.id !== id);
    setArticles(updated);
    saveLocalArticles(updated);
    setHasUnsyncedChanges(true);
    localStorage.setItem('news_app_unsynced', 'true');

    if (articleToDelete) {
      triggerArticleWebhook({ id: articleToDelete.id, title: articleToDelete.title }, 'delete').catch((err) => {
        console.error('Failed to trigger article delete webhook:', err);
      });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorTitle || !editorExcerpt || !editorContent || !editorAuthor) {
      alert('Please fill out all required fields.');
      return;
    }

    const tagsArray = editorTags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const fallbackImages: Record<NewsArticle['category'], string> = {
      World: '/src/assets/world-news.png',
      Tech: '/src/assets/tech-news.png',
      Business: '/src/assets/business-news.png',
      Sports: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80',
      Entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      Lifestyle: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=800&q=80',
    };

    const finalImageUrl = editorImageUrl.trim() || fallbackImages[editorCategory];

    if (editorId) {
      // Edit existing
      let updatedArticle: NewsArticle | null = null;
      const updated = articles.map((art) => {
        if (art.id === editorId) {
          updatedArticle = {
            ...art,
            title: editorTitle,
            excerpt: editorExcerpt,
            content: editorContent,
            category: editorCategory,
            imageUrl: finalImageUrl,
            imageCaption: editorImageCaption,
            author: editorAuthor,
            isBreaking: editorIsBreaking,
            isHot: editorIsHot,
            tags: tagsArray,
          };
          return updatedArticle;
        }
        return art;
      });
      setArticles(updated);
      saveLocalArticles(updated);

      if (updatedArticle) {
        triggerArticleWebhook(updatedArticle, 'update').catch((err) => {
          console.error('Failed to trigger article update webhook:', err);
        });
      }
    } else {
      // Create new
      const newArticle: NewsArticle = {
        id: editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `news-${Date.now()}`,
        title: editorTitle,
        excerpt: editorExcerpt,
        content: editorContent,
        category: editorCategory,
        imageUrl: finalImageUrl,
        imageCaption: editorImageCaption,
        author: editorAuthor,
        publishedAt: new Date().toISOString(),
        readTime: `${Math.max(1, Math.ceil(editorContent.split(/\s+/).length / 200))} min read`,
        isBreaking: editorIsBreaking,
        isHot: editorIsHot,
        tags: tagsArray,
        views: Math.floor(Math.random() * 50) + 1, // small initial view count
      };
      const updated = [newArticle, ...articles];
      setArticles(updated);
      saveLocalArticles(updated);

      triggerArticleWebhook(newArticle, 'create').catch((err) => {
        console.error('Failed to trigger article create webhook:', err);
      });
    }

    setHasUnsyncedChanges(true);
    localStorage.setItem('news_app_unsynced', 'true');
    setAdminTab('manage');

    // Soft alert celebration
    confetti({
      particleCount: 40,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#007aff', '#ffb300'],
    });
  };

  const handleResetToDefault = () => {
    if (!window.confirm('WARNING: This will discard all your custom articles and reset database to standard seeds. Proceed?')) return;
    const defaults = resetToDefaultArticles();
    setArticles(defaults);
    setHasUnsyncedChanges(false);
    localStorage.removeItem('news_app_unsynced');
    alert('Articles database reset successfully.');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveGitSyncSettings(gitSettings);
    alert('GitHub settings saved locally. You can now publish updates directly.');
  };

  const handleSaveWebhookSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveWebhookSettings(webhookSettings);
    alert('Webhook settings saved locally.');
  };

  const handleTestWebhook = async (type: 'newsletter' | 'article' | 'publish') => {
    const url =
      type === 'newsletter' ? webhookSettings.newsletterUrl :
      type === 'article' ? webhookSettings.articleUrl :
      webhookSettings.publishUrl;

    if (!url) {
      alert(`Please configure the URL for ${type} events first.`);
      return;
    }

    setTestStatus((prev) => ({ ...prev, [type]: 'sending' }));
    setTestError((prev) => ({ ...prev, [type]: '' }));

    const result = await sendTestWebhook(url, type);

    if (result.success) {
      setTestStatus((prev) => ({ ...prev, [type]: 'success' }));
      setTimeout(() => {
        setTestStatus((prev) => ({ ...prev, [type]: 'idle' }));
      }, 5000);
    } else {
      setTestStatus((prev) => ({ ...prev, [type]: 'error' }));
      setTestError((prev) => ({ ...prev, [type]: result.error || 'Connection failed.' }));
    }
  };

  const handleGitSync = async () => {
    if (!gitSettings.token || !gitSettings.owner || !gitSettings.repo) {
      alert('Please fill out all settings fields first.');
      setAdminTab('settings');
      return;
    }

    setSyncStatus('syncing');
    setSyncError('');

    // Fetch local articles to push
    const dataString = JSON.stringify(articles, null, 2);
    const result = await pushNewsToGitHub(dataString, `Publish news updates: ${new Date().toISOString()}`);

    if (result.success) {
      setSyncStatus('success');
      setHasUnsyncedChanges(false);
      localStorage.removeItem('news_app_unsynced');
      
      // Trigger outbound publish webhook
      triggerPublishWebhook(articles.length).catch((err) => {
        console.error('Failed to trigger publish webhook:', err);
      });

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#34c759', '#007aff', '#fff'],
      });
      setTimeout(() => setSyncStatus('idle'), 6000);
    } else {
      setSyncStatus('error');
      setSyncError(result.error || 'Unknown GitHub API error.');
    }
  };

  return (
    <div className="admin-layout container">
      <aside className="admin-sidebar">
        <button
          className={`sidebar-link ${adminTab === 'overview' ? 'active' : ''}`}
          onClick={() => setAdminTab('overview')}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button
          className={`sidebar-link ${adminTab === 'manage' ? 'active' : ''}`}
          onClick={() => setAdminTab('manage')}
        >
          <FileText size={18} /> Articles List
        </button>
        <button
          className={`sidebar-link ${adminTab === 'editor' ? 'active' : ''}`}
          onClick={handleCreateClick}
        >
          <PlusCircle size={18} /> Write Article
        </button>
        <button
          className={`sidebar-link ${adminTab === 'settings' ? 'active' : ''}`}
          onClick={() => setAdminTab('settings')}
        >
          <Settings size={18} /> Sync Settings
        </button>
        <button
          className={`sidebar-link ${adminTab === 'automation' ? 'active' : ''}`}
          onClick={() => setAdminTab('automation')}
        >
          <Zap size={18} /> Automation & n8n
        </button>

        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--surface-border)' }}>
          <button onClick={onBackToHome} className="btn btn-secondary" style={{ width: '100%' }}>
            View Site Home
          </button>
        </div>
      </aside>

      <main className="admin-content-area">
        {/* Sync Status Banner */}
        {hasUnsyncedChanges && syncStatus !== 'success' && (
          <div className="sync-banner warning">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} />
              <span>You have unsynced edits. Pushing changes will update `news.json` in GitHub repo.</span>
            </div>
            <button className="banner-action-btn" onClick={handleGitSync} disabled={syncStatus === 'syncing'}>
              {syncStatus === 'syncing' ? 'Publishing...' : 'Publish to GitHub'}
            </button>
          </div>
        )}

        {syncStatus === 'success' && (
          <div className="sync-banner success">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={18} />
              <span>Successfully committed news database update directly to GitHub! Rebuilding production site...</span>
            </div>
          </div>
        )}

        {syncStatus === 'error' && (
          <div className="sync-banner" style={{ background: 'rgba(255, 45, 85, 0.1)', color: 'var(--accent-crimson)', border: '1px solid rgba(255, 45, 85, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={18} />
              <span>Sync Error: {syncError}</span>
            </div>
            <button className="banner-action-btn" style={{ background: 'rgba(255, 45, 85, 0.2)' }} onClick={handleGitSync}>
              Try Again
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {adminTab === 'overview' && (
          <div>
            <div className="admin-header-row">
              <h2 className="admin-title">Dashboard Overview</h2>
              <button className="btn btn-primary" onClick={handleCreateClick}>
                <PlusCircle size={16} /> New Article
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card glass">
                <div className="metric-header">
                  <span>Total Articles</span>
                  <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div className="metric-value">{articles.length}</div>
              </div>
              <div className="metric-card glass">
                <div className="metric-header">
                  <span>Cumulative Views</span>
                  <Eye size={16} style={{ color: 'var(--accent-green)' }} />
                </div>
                <div className="metric-value">{totalViews.toLocaleString()}</div>
              </div>
              <div className="metric-card glass">
                <div className="metric-header">
                  <span>Breaking Badges</span>
                  <AlertTriangle size={16} style={{ color: 'var(--accent-crimson)' }} />
                </div>
                <div className="metric-value">{breakingCount}</div>
              </div>
              <div className="metric-card glass">
                <div className="metric-header">
                  <span>Hot Headlines</span>
                  <TrendingUp size={16} style={{ color: 'var(--accent-gold)' }} />
                </div>
                <div className="metric-value">{hotCount}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', marginTop: '28px' }}>
              <div className="glass" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={18} /> Category Breakdown
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(categoryDistribution).map(([cat, count]) => (
                    <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{cat}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, marginLeft: '20px', marginRight: '20px' }}>
                        <div style={{ height: '6px', background: 'var(--surface-border)', borderRadius: '3px', flexGrow: 1, overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${(count / articles.length) * 100}%`,
                              background: 'var(--accent-blue)',
                            }}
                          ></div>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 600, width: '24px', textAlign: 'right' }}>{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)' }}>
                <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitCommit size={18} /> Git Sync Status
                </h3>
                {gitSettings.token ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px' }}>
                      <strong>Repository:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {gitSettings.owner}/{gitSettings.repo}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <strong>Target Branch:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{gitSettings.branch}</span>
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <strong>Database Path:</strong>{' '}
                      <span style={{ color: 'var(--text-secondary)' }}>{gitSettings.filePath}</span>
                    </div>
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--border-radius-sm)',
                        background: 'rgba(255,255,255,0.02)',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Info size={12} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                      All edits save in LocalStorage immediately. Click <strong>Publish</strong> to sync.
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleGitSync}
                      style={{ width: '100%', justifyContent: 'center' }}
                      disabled={syncStatus === 'syncing'}
                    >
                      {syncStatus === 'syncing' ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" /> Publishing...
                        </>
                      ) : (
                        'Push Database to GitHub'
                      )}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
                    <AlertTriangle size={36} style={{ color: 'var(--accent-gold)' }} />
                    <div>
                      <h4 style={{ marginBottom: '6px' }}>Sync Config Missing</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Configure GitHub sync settings to publish articles to your live website directly from this panel.
                      </p>
                    </div>
                    <button
                      onClick={() => setAdminTab('settings')}
                      className="btn btn-secondary"
                      style={{ gap: '8px' }}
                    >
                      Configure Now <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="glass" style={{ padding: '24px', borderRadius: 'var(--border-radius-md)', marginTop: '28px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--accent-crimson)' }} /> Factory Reset Database
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                If you wish to clear all custom articles and restore the default seed articles (Quantum Computing, Fusion Ignition, etc.), you can reset the LocalStorage database.
              </p>
              <button onClick={handleResetToDefault} className="btn btn-accent">
                Reset Local Database
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLE LIST */}
        {adminTab === 'manage' && (
          <div>
            <div className="admin-header-row">
              <h2 className="admin-title">Manage News Articles</h2>
              <button className="btn btn-primary" onClick={handleCreateClick}>
                <PlusCircle size={16} /> Write Article
              </button>
            </div>

            <div className="table-container glass">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th>Views</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((article) => (
                    <tr key={article.id}>
                      <td>
                        <div className="table-article-info">
                          <img
                            src={article.imageUrl}
                            alt=""
                            className="table-article-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1618477388954-7852f32655ec?auto=format&fit=crop&w=100&q=80';
                            }}
                          />
                          <div>
                            <div className="table-article-title" title={article.title}>
                              {article.title}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              {article.isBreaking && <span className="badge badge-breaking" style={{ fontSize: '8px', padding: '2px 4px' }}>Breaking</span>}
                              {article.isHot && <span className="badge badge-hot" style={{ fontSize: '8px', padding: '2px 4px' }}>Hot</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-category">{article.category}</span>
                      </td>
                      <td>{article.author}</td>
                      <td>{new Date(article.publishedAt).toLocaleDateString()}</td>
                      <td>{article.views.toLocaleString()}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="action-btn"
                            title="Edit"
                            onClick={() => handleEditClick(article)}
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="action-btn delete"
                            title="Delete"
                            onClick={() => handleDeleteClick(article.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                        No articles found. Click "Write Article" to add one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ARTICLE EDITOR */}
        {adminTab === 'editor' && (
          <div>
            <div className="admin-header-row">
              <h2 className="admin-title">{editorId ? 'Modify News Article' : 'Draft New Article'}</h2>
              <button className="btn btn-secondary" onClick={() => setAdminTab('manage')}>
                Cancel Edit
              </button>
            </div>

            <div className="form-card glass">
              <form onSubmit={handleFormSubmit}>
                <div className="form-group">
                  <label className="form-label">Article Title *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="E.g. Breaking Breakthrough in Clean Fuel"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Brief Excerpt * (A short 1-2 sentence hook)</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Summarize the core impact of the news..."
                    value={editorExcerpt}
                    onChange={(e) => setEditorExcerpt(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Editorial Category *</label>
                    <select
                      className="form-control"
                      value={editorCategory}
                      onChange={(e) => setEditorCategory(e.target.value as NewsArticle['category'])}
                    >
                      <option value="Tech">Technology</option>
                      <option value="World">World News</option>
                      <option value="Business">Business / Market</option>
                      <option value="Sports">Sports</option>
                      <option value="Lifestyle">Lifestyle / Environment</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Author Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Reporter / Editorial Staff name"
                      value={editorAuthor}
                      onChange={(e) => setEditorAuthor(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Main Image URL (Leave blank for category fallback)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Https://images.unsplash.com/photo-..."
                      value={editorImageUrl}
                      onChange={(e) => setEditorImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Image Caption</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief description of the image"
                      value={editorImageCaption}
                      onChange={(e) => setEditorImageCaption(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Energy, Environment, Tech, AI"
                    value={editorTags}
                    onChange={(e) => setEditorTags(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ margin: '24px 0' }}>
                  <div className="form-checkbox-row">
                    <label className="form-checkbox-group">
                      <input
                        type="checkbox"
                        checked={editorIsBreaking}
                        onChange={(e) => setEditorIsBreaking(e.target.checked)}
                      />
                      <span>Promote to <strong>Breaking News</strong> (Appears in ticker badge)</span>
                    </label>

                    <label className="form-checkbox-group">
                      <input
                        type="checkbox"
                        checked={editorIsHot}
                        onChange={(e) => setEditorIsHot(e.target.checked)}
                      />
                      <span>Mark as <strong>Hot Story</strong> (Highlighted in hero section)</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Article Body * (Markdown syntax supported, use ### for headers)</label>
                  <textarea
                    className="form-control"
                    rows={12}
                    placeholder="Start typing the article body... Use ### for subheaders, > for blockquotes, and - for bullet points."
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setAdminTab('manage')}
                  >
                    Cancel Draft
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Article Local
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {adminTab === 'settings' && (
          <div>
            <div className="admin-header-row">
              <h2 className="admin-title">GitHub Sync Settings</h2>
            </div>

            <div className="form-card glass">
              <form onSubmit={handleSaveSettings}>
                <div style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  <Info size={16} style={{ color: 'var(--accent-blue)', marginRight: '8px', verticalAlign: 'middle' }} />
                  Since there is no backend, we use the <strong>GitHub REST API</strong> to commit changes back to your repository branch. This triggers Vercel/Netlify to build your live site automatically. Your Token is stored <strong>only</strong> in your local browser storage.
                </div>

                <div className="form-group">
                  <label className="form-label">GitHub Personal Access Token (Fine-grained or Classic with `repo` scope) *</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="github_pat_..."
                    value={gitSettings.token}
                    onChange={(e) => setGitSettings({ ...gitSettings, token: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Repository Owner (Username or Org) *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="E.g. janesmith"
                      value={gitSettings.owner}
                      onChange={(e) => setGitSettings({ ...gitSettings, owner: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Repository Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="E.g. news-chronicle-site"
                      value={gitSettings.repo}
                      onChange={(e) => setGitSettings({ ...gitSettings, repo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Target Branch *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="E.g. main or master"
                      value={gitSettings.branch}
                      onChange={(e) => setGitSettings({ ...gitSettings, branch: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Database File Path in Repo *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="src/data/defaultNews.json"
                      value={gitSettings.filePath}
                      onChange={(e) => setGitSettings({ ...gitSettings, filePath: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Config Local
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 5: AUTOMATION & N8N */}
        {adminTab === 'automation' && (
          <div>
            <div className="admin-header-row">
              <h2 className="admin-title">n8n Automation Hub</h2>
              <span className="badge" style={{ background: 'rgba(52, 199, 89, 0.1)', color: 'var(--accent-green)', border: '1px solid rgba(52, 199, 89, 0.2)', display: 'inline-flex', alignItems: 'center' }}>
                <Cpu size={12} style={{ marginRight: '4px' }} /> Active
              </span>
            </div>

            {/* n8n Blueprint Banner / Feature */}
            <div className="form-card glass" style={{ marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.05, transform: 'scale(1.8)', pointerEvents: 'none', color: 'var(--text-primary)' }}>
                <Cpu size={120} />
              </div>
              <h3 style={{ fontSize: '18px', marginBottom: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} style={{ color: 'var(--accent-gold)' }} />
                100% Free Autonomous News Publisher Blueprint
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                Configure an autonomous editor powered by <strong>Google Gemini (free tier)</strong> and <strong>n8n</strong>.
                It automatically polls news feeds (like BBC or Google News), writes fresh original articles, matches visual imagery, and pushes updates straight to your GitHub repository, triggering an automatic live deploy.
                Zero server maintenance, zero running costs!
              </p>

              <div className="form-row" style={{ gap: '20px', marginBottom: '24px' }}>
                <div style={{ flex: 1, padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> 1. Install n8n Locally (Free)
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Run <code>npx n8n</code> in your terminal to start n8n on your computer, or host it on a free tier cloud server.
                  </p>
                </div>

                <div style={{ flex: 1, padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> 2. Get Gemini API Key (Free)
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Sign up at Google AI Studio to get a free API Key. Enjoy up to 15 free API queries per minute!
                  </p>
                </div>

                <div style={{ flex: 1, padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={14} style={{ color: 'var(--accent-green)' }} /> 3. Connect GitHub (Free)
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Generate a GitHub Personal Access Token (PAT) with contents write access to commit new articles autonomously.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(N8N_WORKFLOW_JSON);
                    setCopiedWorkflow(true);
                    setTimeout(() => setCopiedWorkflow(false), 2000);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  {copiedWorkflow ? (
                    <>
                      <Check size={16} /> Copied Blueprint!
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Copy n8n Workflow JSON
                    </>
                  )}
                </button>
                <a
                  href={`data:text/json;charset=utf-8,${encodeURIComponent(N8N_WORKFLOW_JSON)}`}
                  download="chronicle_news_n8n_workflow.json"
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Download JSON File
                </a>
              </div>
            </div>

            {/* Webhook Configuration form */}
            <div className="form-card glass" style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Share2 size={18} style={{ color: 'var(--accent-blue)' }} />
                Outbound Webhook Settings
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Configure webhook URL triggers to alert n8n when events happen inside your newsroom (e.g. newsletter signups, article drafts created/deleted, site publishes).
              </p>

              <form onSubmit={handleSaveWebhookSettings}>
                {/* 1. Newsletter subscription Webhook */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Newsletter Subscription Webhook</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fires when a new user signs up in the footer newsletter subscription box.</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={webhookSettings.newsletterEnabled}
                        onChange={(e) => setWebhookSettings({ ...webhookSettings, newsletterEnabled: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  {webhookSettings.newsletterEnabled && (
                    <div className="form-row" style={{ gap: '12px', alignItems: 'end', marginTop: '12px' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://your-n8n-instance.com/webhook/..."
                          value={webhookSettings.newsletterUrl}
                          onChange={(e) => setWebhookSettings({ ...webhookSettings, newsletterUrl: e.target.value })}
                          required={webhookSettings.newsletterEnabled}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleTestWebhook('newsletter')}
                        disabled={testStatus.newsletter === 'sending'}
                        style={{ height: '42px', padding: '0 16px' }}
                      >
                        {testStatus.newsletter === 'sending' ? 'Testing...' : 'Send Test'}
                      </button>
                    </div>
                  )}
                  {testStatus.newsletter === 'success' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Test payload sent successfully! Check your n8n execution log.
                    </div>
                  )}
                  {testStatus.newsletter === 'error' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-crimson)', padding: '8px', background: 'rgba(255, 45, 85, 0.05)', borderRadius: '4px', border: '1px solid rgba(255, 45, 85, 0.1)', lineHeight: 1.4 }}>
                      <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {testError.newsletter}
                    </div>
                  )}
                </div>

                {/* 2. Article Events Webhook */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: 'var(--border-radius-sm)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Article Events Webhook</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fires immediately when an article is locally created, updated, or deleted.</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={webhookSettings.articleEnabled}
                        onChange={(e) => setWebhookSettings({ ...webhookSettings, articleEnabled: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  {webhookSettings.articleEnabled && (
                    <div className="form-row" style={{ gap: '12px', alignItems: 'end', marginTop: '12px' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://your-n8n-instance.com/webhook/..."
                          value={webhookSettings.articleUrl}
                          onChange={(e) => setWebhookSettings({ ...webhookSettings, articleUrl: e.target.value })}
                          required={webhookSettings.articleEnabled}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleTestWebhook('article')}
                        disabled={testStatus.article === 'sending'}
                        style={{ height: '42px', padding: '0 16px' }}
                      >
                        {testStatus.article === 'sending' ? 'Testing...' : 'Send Test'}
                      </button>
                    </div>
                  )}
                  {testStatus.article === 'success' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Test payload sent successfully! Check your n8n execution log.
                    </div>
                  )}
                  {testStatus.article === 'error' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-crimson)', padding: '8px', background: 'rgba(255, 45, 85, 0.05)', borderRadius: '4px', border: '1px solid rgba(255, 45, 85, 0.1)', lineHeight: 1.4 }}>
                      <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {testError.article}
                    </div>
                  )}
                </div>

                {/* 3. Site Publish Webhook */}
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--surface-border)', borderRadius: 'var(--border-radius-sm)', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Site Publish Webhook</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fires when you push changes to GitHub, starting a live server rebuild.</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={webhookSettings.publishEnabled}
                        onChange={(e) => setWebhookSettings({ ...webhookSettings, publishEnabled: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  {webhookSettings.publishEnabled && (
                    <div className="form-row" style={{ gap: '12px', alignItems: 'end', marginTop: '12px' }}>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://your-n8n-instance.com/webhook/..."
                          value={webhookSettings.publishUrl}
                          onChange={(e) => setWebhookSettings({ ...webhookSettings, publishUrl: e.target.value })}
                          required={webhookSettings.publishEnabled}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => handleTestWebhook('publish')}
                        disabled={testStatus.publish === 'sending'}
                        style={{ height: '42px', padding: '0 16px' }}
                      >
                        {testStatus.publish === 'sending' ? 'Testing...' : 'Send Test'}
                      </button>
                    </div>
                  )}
                  {testStatus.publish === 'success' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={12} /> Test payload sent successfully! Check your n8n execution log.
                    </div>
                  )}
                  {testStatus.publish === 'error' && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--accent-crimson)', padding: '8px', background: 'rgba(255, 45, 85, 0.05)', borderRadius: '4px', border: '1px solid rgba(255, 45, 85, 0.1)', lineHeight: 1.4 }}>
                      <AlertTriangle size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {testError.publish}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Webhook Config
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
