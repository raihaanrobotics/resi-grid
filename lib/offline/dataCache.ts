export function readOfflineData<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) as T : null;
  } catch (error) {
    console.error(`Could not read offline data (${key}):`, error);
    return null;
  }
}

export function writeOfflineData<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Could not save offline data (${key}):`, error);
  }
}
