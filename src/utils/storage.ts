export interface RepoConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

const STORAGE_KEYS = {
  REPO_CONFIG: 'diary_repo_config',
  CURRENT_YEAR: 'diary_current_year',
  CURRENT_DATE: 'diary_current_date',
  DRAFT: 'diary_draft',
};

export const storage = {
  getRepoConfig(): RepoConfig | null {
    const data = localStorage.getItem(STORAGE_KEYS.REPO_CONFIG);
    return data ? JSON.parse(data) : null;
  },

  setRepoConfig(config: RepoConfig): void {
    localStorage.setItem(STORAGE_KEYS.REPO_CONFIG, JSON.stringify(config));
  },

  getCurrentYear(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_YEAR);
  },

  setCurrentYear(year: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_YEAR, year);
  },

  getCurrentDate(): string | null {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_DATE);
  },

  setCurrentDate(date: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_DATE, date);
  },

  getDraft(): { title: string; date: string; content: string } | null {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return data ? JSON.parse(data) : null;
  },

  setDraft(draft: { title: string; date: string; content: string }): void {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draft));
  },

  clearDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  },

  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },
};
