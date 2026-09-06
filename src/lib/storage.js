const storagePrefix = 'orbit-desk:';

export function loadStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(`${storagePrefix}${key}`);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function saveStored(key, value) {
  try {
    window.localStorage.setItem(`${storagePrefix}${key}`, JSON.stringify(value));
  } catch {
    // Local storage can be unavailable in private or restricted browser contexts.
  }
}
