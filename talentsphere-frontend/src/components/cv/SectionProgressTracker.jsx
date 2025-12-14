import React, { useState } from 'react';
import { CheckCircle, Circle, AlertCircle, Clock, Loader2, XCircle } from 'lucide-react';

/**
 * SectionProgressTracker Component
 * Displays real-time progress of CV section generation
 * Shows completed sections, current section, and pending sections
 * Displays todos/follow-up items after generation
 */
const SectionProgressTracker = ({ 
  generationProgress = [], 
  todos = [],
  isGenerating = false,
  sectionsRequested = []
}) => {
  const [showTodos, setShowTodos] = useState(true);

  // Get status summary
  const getStatusSummary = () => {
    const completed = generationProgress.filter(p => p.status === 'completed').length;
    const processing = generationProgress.filter(p => p.status === 'processing').length;
    const failed = generationProgress.filter(p => p.status === 'failed').length;
    const total = sectionsRequested.length || generationProgress.length;

    return { completed, processing, failed, total };
  };

  const summary = getStatusSummary();

  // Get icon for section status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'completed_with_warning':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'skipped':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'completed_with_warning':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'skipped':
        return 'bg-gray-50 border-gray-300 text-gray-700';
      case 'failed':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!isGenerating && generationProgress.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Generation Progress</h3>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {summary.completed} / {summary.total} sections completed
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(summary.completed / summary.total) * 100}%` }}
          />
        </div>

        {/* Section Status List */}
        <div className="space-y-2">
          {generationProgress.map((progress, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(progress.status)}`}
            >
              <div className="flex-shrink-0">
                {getStatusIcon(progress.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium capitalize">
                    {progress.section}
                  </span>
                  <span className="text-xs font-medium uppercase px-2 py-0.5 rounded-full bg-white bg-opacity-70">
                    {progress.status}
                  </span>
                </div>
                {progress.error && (
                  <p className="text-xs mt-1 text-red-700">
                    Error: {progress.error}
                  </p>
                )}
                {progress.reason && progress.reason === 'no_profile_data' && (
                  <p className="text-xs mt-1 opacity-80">
                    ⚠️ Skipped: No profile data available for this section
                  </p>
                )}
                {progress.has_data !== undefined && !progress.has_data && (
                  <p className="text-xs mt-1 opacity-80">
                    No data available in profile
                  </p>
                )}
              </div>
              {progress.timestamp && (
                <div className="text-xs text-gray-500">
                  {new Date(progress.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        {summary.completed === summary.total && summary.total > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">
                All {summary.total} sections generated successfully!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Todos/Follow-up Items */}
      {todos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Follow-up Actions ({todos.length})
            </h3>
            <button
              onClick={() => setShowTodos(!showTodos)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showTodos ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTodos && (
            <div className="space-y-3">
              {todos.map((todo, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {todo.section}
                        </span>
                        {todo.reason && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            {todo.reason.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      {todo.error && (
                        <p className="text-sm text-red-600 mb-2">
                          <span className="font-medium">Error:</span> {todo.error}
                        </p>
                      )}
                      {todo.missing_fields && todo.missing_fields.length > 0 && (
                        <p className="text-sm text-amber-700 mb-2">
                          <span className="font-medium">Missing:</span> {todo.missing_fields.join(', ')}
                        </p>
                      )}
                      {todo.suggestions && Array.isArray(todo.suggestions) && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <span className="font-medium">Suggestions:</span>
                          <ul className="list-disc list-inside ml-2 space-y-0.5">
                            {todo.suggestions.map((suggestion, sidx) => (
                              <li key={sidx} className="text-xs">{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {todo.suggestion && typeof todo.suggestion === 'string' && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Suggestion:</span> {todo.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    // Navigate to profile edit
                    window.location.href = '/jobseeker/profile';
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Update Profile
                </button>
                <button
                  onClick={() => setShowTodos(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {!showTodos && (
            <p className="text-xs text-gray-600 italic">
              Click "Show" to view {todos.length} follow-up action{todos.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionProgressTracker;
