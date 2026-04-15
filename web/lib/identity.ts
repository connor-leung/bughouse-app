import { v4 as uuidv4 } from 'uuid';

const USER_ID_KEY = 'bughouse_userId';
const DISPLAY_NAME_KEY = 'bughouse_displayName';

export function getUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export function getDisplayName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? '';
}

export function setDisplayName(name: string): void {
  localStorage.setItem(DISPLAY_NAME_KEY, name);
}

export function hasDisplayName(): boolean {
  if (typeof window === 'undefined') return false;
  const name = localStorage.getItem(DISPLAY_NAME_KEY);
  return !!name && name.trim().length > 0;
}
