import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerNewsletterWebhook } from '../utils/webhookSync';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setSubscribed(true);
    
    // Trigger outbound webhook to n8n if enabled
    triggerNewsletterWebhook(email).catch((err) => {
      console.error('Error triggering newsletter webhook:', err);
    });

    setEmail('');

    // Trigger visual confetti celebration
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#007aff', '#ff2d55', '#ffb300', '#34c759'],
    });
  };


  return (
    <div className="newsletter-section glass">
      <div className="newsletter-bg"></div>
      <div className="newsletter-content">
        <div className="newsletter-icon">
          <Mail size={24} />
        </div>
        {!subscribed ? (
          <>
            <h2 className="newsletter-title">Subscribe to Chronicle Briefing</h2>
            <p className="newsletter-subtitle">
              Get the day's most essential breaking stories, analysis, and insights delivered straight to your inbox.
            </p>
            <form className="newsletter-form" onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-input"
              />
              <button type="submit" className="btn newsletter-btn">
                Subscribe <ArrowRight size={16} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: '20px 0', animation: 'scale-up 0.4s ease' }}>
            <CheckCircle2 size={48} style={{ color: 'var(--accent-green)', marginBottom: '16px' }} />
            <h2 className="newsletter-title">You're Subscribed!</h2>
            <p className="newsletter-subtitle" style={{ marginBottom: 0 }}>
              Thank you for subscribing. We will send you updates starting tomorrow morning.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
