import React from 'react';
import { Newspaper, Sun, Moon, Settings, Search, X } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  setCurrentTab,
  isAdmin,
  setIsAdmin,
  searchQuery,
  setSearchQuery,
  theme,
  toggleTheme,
}) => {
  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setIsAdmin(false);
  };

  return (
    <nav className="header-nav">
      <div className="container header-container">
        <a href="#" className="logo" onClick={() => handleNavClick('all')}>
          <Newspaper size={28} style={{ color: 'var(--accent-blue)' }} />
          CHRONICLE
          <span className="logo-badge">Live</span>
        </a>

        {!isAdmin ? (
          <div className="nav-links">
            <a
              href="#"
              className={`nav-link ${currentTab === 'all' ? 'active' : ''}`}
              onClick={() => handleNavClick('all')}
            >
              All News
            </a>
            <a
              href="#"
              className={`nav-link ${currentTab === 'World' ? 'active' : ''}`}
              onClick={() => handleNavClick('World')}
            >
              World
            </a>
            <a
              href="#"
              className={`nav-link ${currentTab === 'Tech' ? 'active' : ''}`}
              onClick={() => handleNavClick('Tech')}
            >
              Tech
            </a>
            <a
              href="#"
              className={`nav-link ${currentTab === 'Business' ? 'active' : ''}`}
              onClick={() => handleNavClick('Business')}
            >
              Business
            </a>
            <a
              href="#"
              className={`nav-link ${currentTab === 'Sports' ? 'active' : ''}`}
              onClick={() => handleNavClick('Sports')}
            >
              Sports
            </a>
            <a
              href="#"
              className={`nav-link ${currentTab === 'Lifestyle' ? 'active' : ''}`}
              onClick={() => handleNavClick('Lifestyle')}
            >
              Lifestyle
            </a>
          </div>
        ) : (
          <div className="nav-links">
            <span style={{ fontWeight: 600, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings size={18} /> Admin Dashboard
            </span>
          </div>
        )}

        <div className="nav-actions">
          {!isAdmin && (
            <div className="search-container">
              <input
                type="text"
                placeholder="Search headlines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <Search size={16} className="search-icon" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <button onClick={toggleTheme} className="icon-btn" title="Toggle Theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAdmin ? (
            <button onClick={() => setIsAdmin(false)} className="btn btn-secondary">
              Exit Admin
            </button>
          ) : (
            <button onClick={() => setIsAdmin(true)} className="admin-btn">
              <Settings size={16} /> Panel
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
