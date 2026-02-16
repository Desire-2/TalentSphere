/**
 * CV Storage Utility
 * Manages CV versions, caching, and localStorage with optional encryption
 */

const CV_STORAGE_KEY = 'cv_versions';
const MAX_VERSIONS = 5;  // Keep last 5 CV versions

/**
 * Simple XOR encryption for localStorage (basic security)
 * For production, consider using a proper encryption library
 */
function simpleEncrypt(text, key = 'talentsphere_cv_2026') {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result);  // Base64 encode
}

function simpleDecrypt(encrypted, key = 'talentsphere_cv_2026') {
  try {
    const decoded = atob(encrypted);  // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (error) {
    console.error('Failed to decrypt CV data:', error);
    return null;
  }
}

/**
 * Save a new CV version to localStorage
 */
export function saveCVVersion(cvData, metadata = {}) {
  try {
    const versions = getCVVersions();
    
    const newVersion = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      cvContent: cvData,
      metadata: {
        style: metadata.style || 'professional',
        jobTitle: metadata.jobTitle,
        jobId: metadata.jobId,
        sections: metadata.sections || [],
        ...metadata
      }
    };
    
    // Add to beginning of array
    versions.unshift(newVersion);
    
    // Keep only MAX_VERSIONS
    const trimmedVersions = versions.slice(0, MAX_VERSIONS);
    
    // Encrypt and save
    const dataToSave = JSON.stringify(trimmedVersions);
    const encrypted = simpleEncrypt(dataToSave);
    
    sessionStorage.setItem(CV_STORAGE_KEY, encrypted);
    
    console.log(`✅ CV version saved (${trimmedVersions.length} total versions)`);
    return newVersion.id;
  } catch (error) {
    console.error('Failed to save CV version:', error);
    return null;
  }
}

/**
 * Get all CV versions
 */
export function getCVVersions() {
  try {
    const encrypted = sessionStorage.getItem(CV_STORAGE_KEY);
    if (!encrypted) return [];
    
    const decrypted = simpleDecrypt(encrypted);
    if (!decrypted) return [];
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Failed to load CV versions:', error);
    return [];
  }
}

/**
 * Get a specific CV version by ID
 */
export function getCVVersion(versionId) {
  const versions = getCVVersions();
  return versions.find(v => v.id === versionId);
}

/**
 * Get the latest CV version
 */
export function getLatestCV() {
  const versions = getCVVersions();
  return versions.length > 0 ? versions[0] : null;
}

/**
 * Delete a specific CV version
 */
export function deleteCVVersion(versionId) {
  try {
    const versions = getCVVersions();
    const filtered = versions.filter(v => v.id !== versionId);
    
    const dataToSave = JSON.stringify(filtered);
    const encrypted = simpleEncrypt(dataToSave);
    
    sessionStorage.setItem(CV_STORAGE_KEY, encrypted);
    
    console.log(`🗑️ CV version ${versionId} deleted`);
    return true;
  } catch (error) {
    console.error('Failed to delete CV version:', error);
    return false;
  }
}

/**
 * Clear all CV versions
 */
export function clearAllCVs() {
  sessionStorage.removeItem(CV_STORAGE_KEY);
  console.log('🗑️ All CV versions cleared');
}

/**
 * Get formatted version info for display
 */
export function getVersionsInfo() {
  const versions = getCVVersions();
  return versions.map(v => ({
    id: v.id,
    timestamp: v.timestamp,
    timeAgo: getTimeAgo(v.timestamp),
    style: v.metadata.style,
    jobTitle: v.metadata.jobTitle || 'General CV',
    sectionsCount: v.metadata.sections?.length || 0
  }));
}

/**
 * Helper: Get human-readable time ago
 */
function getTimeAgo(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return then.toLocaleDateString();
}

/**
 * Export CV version as JSON file
 */
export function exportCVAsJSON(versionId) {
  const version = getCVVersion(versionId);
  if (!version) return false;
  
  const dataStr = JSON.stringify(version, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `cv_${version.metadata.style}_${version.id}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  return true;
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
  const versions = getCVVersions();
  const encrypted = sessionStorage.getItem(CV_STORAGE_KEY) || '';
  
  return {
    totalVersions: versions.length,
    maxVersions: MAX_VERSIONS,
    storageUsed: (encrypted.length / 1024).toFixed(2) + ' KB',
    oldestVersion: versions.length > 0 ? versions[versions.length - 1].timestamp : null,
    newestVersion: versions.length > 0 ? versions[0].timestamp : null
  };
}
