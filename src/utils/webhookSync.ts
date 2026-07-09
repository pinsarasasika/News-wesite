import type { WebhookSettings, NewsArticle } from '../types';

const SETTINGS_KEY = 'news_app_webhook_settings';

const DEFAULT_SETTINGS: WebhookSettings = {
  newsletterUrl: '',
  newsletterEnabled: false,
  articleUrl: '',
  articleEnabled: false,
  publishUrl: '',
  publishEnabled: false,
};

export function getWebhookSettings(): WebhookSettings {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return DEFAULT_SETTINGS;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch (e) {
    console.error('Failed to parse Webhook settings', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveWebhookSettings(settings: WebhookSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Low-level fetch wrapper to handle POST requests with custom options
export async function triggerWebhook(
  url: string,
  payload: Record<string, any>
): Promise<{ success: boolean; error?: string; status?: number }> {
  if (!url) {
    return { success: false, error: 'Webhook URL is empty.' };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        _client: 'Chronicle Web App',
      }),
      mode: 'cors',
    });

    if (response.ok) {
      return { success: true, status: response.status };
    } else {
      let errorText = response.statusText;
      try {
        const data = await response.json();
        if (data && data.message) errorText = data.message;
      } catch (e) {
        // use statusText fallback
      }
      return {
        success: false,
        status: response.status,
        error: `Server responded with status ${response.status}: ${errorText}`,
      };
    }
  } catch (error: any) {
    console.error('Webhook fetch error:', error);
    // CORS errors usually manifest as TypeError: Failed to fetch without status
    return {
      success: false,
      error: error.message === 'Failed to fetch'
        ? 'Failed to fetch. This is likely a CORS (Cross-Origin Resource Sharing) block. Please ensure your n8n webhook supports requests from other domains or is configured correctly.'
        : error.message || 'A network error occurred.',
    };
  }
}

// Helpers for specific events
export async function triggerNewsletterWebhook(email: string): Promise<void> {
  const settings = getWebhookSettings();
  if (!settings.newsletterEnabled || !settings.newsletterUrl) return;

  await triggerWebhook(settings.newsletterUrl, {
    event: 'newsletter.subscribe',
    email,
    subscribedAt: new Date().toISOString(),
    source: 'Website Footer Newsletter Form',
  });
}

export async function triggerArticleWebhook(
  article: NewsArticle | { id: string; title: string },
  action: 'create' | 'update' | 'delete'
): Promise<void> {
  const settings = getWebhookSettings();
  if (!settings.articleEnabled || !settings.articleUrl) return;

  await triggerWebhook(settings.articleUrl, {
    event: `article.${action}`,
    action,
    timestamp: new Date().toISOString(),
    article,
  });
}

export async function triggerPublishWebhook(articlesCount: number): Promise<void> {
  const settings = getWebhookSettings();
  if (!settings.publishEnabled || !settings.publishUrl) return;

  await triggerWebhook(settings.publishUrl, {
    event: 'site.publish',
    articlesCount,
    timestamp: new Date().toISOString(),
    message: `News site successfully updated and pushed to GitHub. Rebuild initiated.`,
  });
}

export async function sendTestWebhook(
  url: string,
  eventType: 'newsletter' | 'article' | 'publish'
): Promise<{ success: boolean; error?: string }> {
  const dummyPayloads = {
    newsletter: {
      event: 'newsletter.subscribe',
      email: 'test-subscriber@example.com',
      subscribedAt: new Date().toISOString(),
      source: 'Test Button',
      isTest: true,
    },
    article: {
      event: 'article.create',
      action: 'create',
      timestamp: new Date().toISOString(),
      isTest: true,
      article: {
        id: 'test-story-id',
        title: 'n8n Automation Connected Successfully!',
        excerpt: 'This is a test notification confirming your webhook setup is working.',
        content: 'Your news website is now fully wired up to your n8n workflow. Nice job!',
        category: 'Tech',
        imageUrl: 'https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=800&q=80',
        author: 'n8n Bot',
        publishedAt: new Date().toISOString(),
        readTime: '1 min read',
        tags: ['automation', 'n8n', 'test'],
        views: 42,
      },
    },
    publish: {
      event: 'site.publish',
      articlesCount: 15,
      timestamp: new Date().toISOString(),
      message: 'This is a test publish notification from the admin settings page.',
      isTest: true,
    },
  };

  return triggerWebhook(url, dummyPayloads[eventType]);
}
