import type { GitSyncSettings } from '../types';

const SETTINGS_KEY = 'news_app_git_sync_settings';

export function getGitSyncSettings(): GitSyncSettings | null {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as GitSyncSettings;
  } catch (e) {
    console.error('Failed to parse Git sync settings', e);
    return null;
  }
}

export function saveGitSyncSettings(settings: GitSyncSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function clearGitSyncSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

interface GitHubCommitResponse {
  commit: {
    html_url: string;
    sha: string;
  };
}

export async function pushNewsToGitHub(
  contentString: string,
  commitMessage: string
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const settings = getGitSyncSettings();
  if (!settings || !settings.token || !settings.owner || !settings.repo) {
    return {
      success: false,
      error: 'Git sync settings are incomplete. Please configure them in the Admin Settings.',
    };
  }

  const { token, owner, repo, branch, filePath } = settings;
  const path = filePath || 'src/data/defaultNews.json';
  const targetBranch = branch || 'main';

  const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  try {
    // Step 1: Fetch current file to retrieve its SHA
    let sha: string | undefined;
    const getUrl = `${baseUrl}?ref=${targetBranch}`;

    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
    });

    if (getResponse.ok) {
      const fileData = await getResponse.json();
      sha = fileData.sha;
    } else if (getResponse.status !== 404) {
      const errData = await getResponse.json().catch(() => ({}));
      return {
        success: false,
        error: `Failed to fetch file SHA from GitHub: ${errData.message || getResponse.statusText}`,
      };
    }

    // Step 2: Encode contents to Base64
    // Using standard btoa is fine for pure ASCII, but for UTF-8 we need custom encoding
    const encoder = new TextEncoder();
    const data = encoder.encode(contentString);
    let binary = '';
    const len = data.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64Content = window.btoa(binary);

    // Step 3: Send PUT request to create/update the file
    const putResponse = await fetch(baseUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        branch: targetBranch,
        sha: sha, // required if updating
      }),
    });

    if (!putResponse.ok) {
      const errData = await putResponse.json().catch(() => ({}));
      return {
        success: false,
        error: `GitHub Commit failed: ${errData.message || putResponse.statusText}`,
      };
    }

    const result = (await putResponse.json()) as GitHubCommitResponse;
    return {
      success: true,
      commitUrl: result.commit.html_url,
    };
  } catch (error: any) {
    console.error('Error pushing to GitHub:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while communicating with GitHub.',
    };
  }
}
