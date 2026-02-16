import React, { useState, useEffect } from 'react';
import { Clock, Download, Trash2, FileText, Eye } from 'lucide-react';
import { getVersionsInfo, getCVVersion, deleteCVVersion, clearAllCVs, exportCVAsJSON, getStorageStats } from '../../utils/cvStorage';

/**
 * CV Version History Component
 * Displays saved CV versions with options to view, restore, or delete
 */
const CVVersionHistory = ({ onRestore, currentCVId }) => {
  const [versions, setVersions] = useState([]);
  const [stats, setStats] = useState({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);

  useEffect(() => {
    loadVersions();
  }, [currentCVId]);

  const loadVersions = () => {
    setVersions(getVersionsInfo());
    setStats(getStorageStats());
  };

  const handleRestore = (versionId) => {
    const version = getCVVersion(versionId);
    if (version && onRestore) {
      onRestore(version);
    }
  };

  const handleDelete = (versionId) => {
    if (deleteCVVersion(versionId)) {
      loadVersions();
      setShowConfirmDelete(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved CV versions? This cannot be undone.')) {
      clearAllCVs();
      loadVersions();
    }
  };

  const handleExport = (versionId) => {
    exportCVAsJSON(versionId);
  };

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">No saved CV versions yet</p>
        <p className="text-sm text-gray-500 mt-2">
          Your generated CVs will be automatically saved here (up to {stats.maxVersions} versions)
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">CV Version History</h3>
            <p className="text-sm text-gray-600 mt-1">
              {stats.totalVersions} of {stats.maxVersions} versions saved • {stats.storageUsed}
            </p>
          </div>
          {versions.length > 1 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Version List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {versions.map((version, index) => (
          <div
            key={version.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${
              currentCVId === version.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              {/* Version Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{version.timeAgo}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      Latest
                    </span>
                  )}
                  {currentCVId === version.id && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="font-medium text-gray-900">{version.jobTitle}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">
                    Style: <span className="capitalize font-medium">{version.style}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {version.sectionsCount} sections
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 ml-4">
                {currentCVId !== version.id && (
                  <button
                    onClick={() => handleRestore(version.id)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Restore this version"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleExport(version.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Export as JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
                {showConfirmDelete === version.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(version.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(null)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmDelete(version.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this version"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          💡 Tip: CVs are saved in your browser session and cleared when you log out
        </p>
      </div>
    </div>
  );
};

export default CVVersionHistory;
