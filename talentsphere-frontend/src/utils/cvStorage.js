/**
 * CV Storage Utility
 * Manages CV versions in sessionStorage using AES-GCM 256-bit encryption.
 * Key is derived from the user's JWT token via Web Crypto API.
 *
 * Migration: on first load any old XOR-encoded entries (not JSON objects with
 * {iv, data} keys) are silently cleared so legacy data is never surfaced.
 */

const CV_STORAGE_KEY = 'cv_versions';
const MAX_VERSIONS = 5;

// ── AES-GCM Key Derivation ───────────────────────────────────────────────────

/**
 * Derive an AES-GCM 256-bit key from the current user's JWT token.
 * Uses SHA-256 of the token as raw key material — one crypto.subtle call.
 */
async function getEncryptionKey() {
  const token = localStorage.getItem('token') || 'talentsphere-default-session-key-2026';
  const rawKey = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token)
  );
  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext string with AES-GCM.
 * Returns a JSON string: { iv: base64, data: base64 }
 */
async function aesEncrypt(plaintext) {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return JSON.stringify({
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  });
}

/**
 * Decrypt an AES-GCM encrypted string produced by aesEncrypt().
 * Returns null if decryption fails (wrong key, corrupt data, legacy format).
 */
async function aesDecrypt(storedString) {
  try {
    const parsed = JSON.parse(storedString);
    // Validate structure — old XOR data won't have {iv, data}
    if (!parsed || typeof parsed.iv !== 'string' || typeof parsed.data !== 'string') {
      return null; // Legacy format detected
    }
    const iv = Uint8Array.from(atob(parsed.iv), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(parsed.data), c => c.charCodeAt(0));
    const key = await getEncryptionKey();
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
  } catch (err) {
    console.warn('[cvStorage] Decryption failed (possible legacy format), clearing storage.', err);
    return null;
  }
}

// ── Migration helper ─────────────────────────────────────────────────────────

/**
 * Silently clear sessionStorage if it holds old XOR-encrypted (non-JSON) data.
 * Called transparently inside getCVVersions().
 */
function _clearIfLegacyFormat() {
  const raw = sessionStorage.getItem(CV_STORAGE_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.iv !== 'string') {
      sessionStorage.removeItem(CV_STORAGE_KEY);
      console.info('[cvStorage] Cleared legacy XOR-encrypted CV data.');
    }
  } catch {
    // Not valid JSON at all → definitely old format
    sessionStorage.removeItem(CV_STORAGE_KEY);
    console.info('[cvStorage] Cleared legacy XOR-encrypted CV data.');
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Save a new CV version to sessionStorage (encrypted).
 * Returns the numeric version id, or null on failure.
 */
export async function saveCVVersion(cvData, metadata = {}) {
  try {
    _clearIfLegacyFormat();
    const versions = await getCVVersions();

    const newVersion = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      cvContent: cvData,
      metadata: {
        style: metadata.style || 'professional',
        jobTitle: metadata.jobTitle,
        jobId: metadata.jobId,
        sections: metadata.sections || [],
        ...metadata,
      },
    };

    versions.unshift(newVersion);
    const trimmed = versions.slice(0, MAX_VERSIONS);

    const encrypted = await aesEncrypt(JSON.stringify(trimmed));
    sessionStorage.setItem(CV_STORAGE_KEY, encrypted);

    console.log(`✅ CV version saved (${trimmed.length} total versions)`);
    return newVersion.id;
  } catch (err) {
    console.error('[cvStorage] Failed to save CV version:', err);
    return null;
  }
}

/**
 * Get all saved CV versions (decrypted).
 */
export async function getCVVersions() {
  try {
    _clearIfLegacyFormat();
    const stored = sessionStorage.getItem(CV_STORAGE_KEY);
    if (!stored) return [];
    const decrypted = await aesDecrypt(stored);
    if (!decrypted) {
      sessionStorage.removeItem(CV_STORAGE_KEY);
      return [];
    }
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('[cvStorage] Failed to load CV versions:', err);
    return [];
  }
}

/**
 * Get a specific CV version by id.
 */
export async function getCVVersion(versionId) {
  const versions = await getCVVersions();
  return versions.find(v => v.id === versionId) || null;
}

/**
 * Get the most recently saved CV version.
 */
export async function getLatestCV() {
  const versions = await getCVVersions();
  return versions.length > 0 ? versions[0] : null;
}

/**
 * Delete a specific CV version by id.
 */
export async function deleteCVVersion(versionId) {
  try {
    const versions = await getCVVersions();
    const filtered = versions.filter(v => v.id !== versionId);
    const encrypted = await aesEncrypt(JSON.stringify(filtered));
    sessionStorage.setItem(CV_STORAGE_KEY, encrypted);
    console.log(`🗑️ CV version ${versionId} deleted`);
    return true;
  } catch (err) {
    console.error('[cvStorage] Failed to delete CV version:', err);
    return false;
  }
}

/**
 * Clear all saved CV versions.
 */
export function clearAllCVs() {
  sessionStorage.removeItem(CV_STORAGE_KEY);
  console.log('🗑️ All CV versions cleared');
}

/**
 * Get formatted version info for display.
 */
export async function getVersionsInfo() {
  const versions = await getCVVersions();
  return versions.map(v => ({
    id: v.id,
    timestamp: v.timestamp,
    timeAgo: _getTimeAgo(v.timestamp),
    style: v.metadata.style,
    jobTitle: v.metadata.jobTitle || 'General CV',
    sectionsCount: v.metadata.sections?.length || 0,
  }));
}

/**
 * Get rough storage stats (does not require decryption for byte count).
 */
export async function getStorageStats() {
  const versions = await getCVVersions();
  const raw = sessionStorage.getItem(CV_STORAGE_KEY) || '';
  return {
    totalVersions: versions.length,
    maxVersions: MAX_VERSIONS,
    storageUsed: (raw.length / 1024).toFixed(2) + ' KB',
    oldestVersion: versions.length > 0 ? versions[versions.length - 1].timestamp : null,
    newestVersion: versions.length > 0 ? versions[0].timestamp : null,
  };
}

/**
 * Export a specific CV version as a JSON file download.
 */
export async function exportCVAsJSON(versionId) {
  const version = await getCVVersion(versionId);
  if (!version) return false;

  const dataStr = JSON.stringify(version, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const fileName = `cv_${version.metadata.style}_${version.id}.json`;

  const link = document.createElement('a');
  link.setAttribute('href', dataUri);
  link.setAttribute('download', fileName);
  link.click();
  return true;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function _getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

