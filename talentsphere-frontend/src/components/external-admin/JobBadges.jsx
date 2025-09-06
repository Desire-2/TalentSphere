import React from 'react';
import { Badge } from '../ui/badge';
import { 
  CheckCircle2, 
  Clock, 
  Archive, 
  FileText,
  Pause,
  XCircle 
} from 'lucide-react';

/**
 * JobStatusBadge - Consistent status badge with icons and colors
 */
export const JobStatusBadge = ({ 
  status, 
  className = '', 
  showIcon = true,
  size = 'default'
}) => {
  const statusConfig = {
    published: {
      label: 'Published',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 border-green-200',
      iconColor: 'text-green-600'
    },
    draft: {
      label: 'Draft',
      icon: FileText,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      iconColor: 'text-gray-600'
    },
    archived: {
      label: 'Archived',
      icon: Archive,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    paused: {
      label: 'Paused',
      icon: Pause,
      className: 'bg-orange-100 text-orange-800 border-orange-200',
      iconColor: 'text-orange-600'
    },
    expired: {
      label: 'Expired',
      icon: Clock,
      className: 'bg-red-100 text-red-800 border-red-200',
      iconColor: 'text-red-600'
    },
    closed: {
      label: 'Closed',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 border-gray-200',
      iconColor: 'text-gray-600'
    }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Badge 
      className={`
        status-badge inline-flex items-center gap-1.5 font-medium border
        ${config.className} 
        ${sizeClasses[size]}
        ${className}
      `}
      variant="secondary"
    >
      {showIcon && (
        <IconComponent className={`${iconSizeClasses[size]} ${config.iconColor}`} />
      )}
      <span>{config.label}</span>
    </Badge>
  );
};

/**
 * JobPriorityBadge - Badge for job priority levels
 */
export const JobPriorityBadge = ({ 
  priority = 'normal', 
  className = '',
  size = 'default' 
}) => {
  const priorityConfig = {
    urgent: {
      label: 'Urgent',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    high: {
      label: 'High Priority',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    normal: {
      label: 'Normal',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    low: {
      label: 'Low Priority',
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const config = priorityConfig[priority] || priorityConfig.normal;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={`
        inline-flex items-center font-medium border
        ${config.className}
        ${sizeClasses[size]}
        ${className}
      `}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
};

/**
 * JobTypeBadge - Badge for employment types
 */
export const JobTypeBadge = ({ 
  type, 
  className = '',
  size = 'default'
}) => {
  const typeConfig = {
    'full-time': {
      label: 'Full Time',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    'part-time': {
      label: 'Part Time',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    'contract': {
      label: 'Contract',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    },
    'freelance': {
      label: 'Freelance',
      className: 'bg-teal-100 text-teal-800 border-teal-200'
    },
    'internship': {
      label: 'Internship',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    'temporary': {
      label: 'Temporary',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  };

  const config = typeConfig[type] || typeConfig['full-time'];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={`
        inline-flex items-center font-medium border
        ${config.className}
        ${sizeClasses[size]}
        ${className}
      `}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
};

/**
 * ExperienceLevelBadge - Badge for experience levels
 */
export const ExperienceLevelBadge = ({ 
  level, 
  className = '',
  size = 'default'
}) => {
  const levelConfig = {
    entry: {
      label: 'Entry Level',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    mid: {
      label: 'Mid Level',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    senior: {
      label: 'Senior Level',
      className: 'bg-purple-100 text-purple-800 border-purple-200'
    },
    executive: {
      label: 'Executive',
      className: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    }
  };

  const config = levelConfig[level] || levelConfig.entry;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <Badge 
      className={`
        inline-flex items-center font-medium border
        ${config.className}
        ${sizeClasses[size]}
        ${className}
      `}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
};

export default JobStatusBadge;
