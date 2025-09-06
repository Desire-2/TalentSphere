import React from 'react';
import { 
  Eye, 
  Edit, 
  Archive, 
  ArchiveRestore, 
  Trash2, 
  Copy, 
  Clock,
  CheckCircle2,
  ExternalLink 
} from 'lucide-react';
import { Button } from '../ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '../ui/tooltip';
import { Link } from 'react-router-dom';

/**
 * JobActionButton - Reusable component for individual job actions
 */
export const JobActionButton = ({ 
  action, 
  job, 
  loading, 
  onClick, 
  className = '',
  variant = 'ghost',
  size = 'sm',
  tooltip 
}) => {
  const actionConfig = {
    view: {
      icon: Eye,
      color: 'hover:bg-blue-50 hover:text-blue-600',
      tooltip: 'View job details'
    },
    edit: {
      icon: Edit,
      color: 'hover:bg-green-50 hover:text-green-600',
      tooltip: 'Edit job'
    },
    archive: {
      icon: Archive,
      color: 'hover:bg-yellow-50 hover:text-yellow-600',
      tooltip: 'Archive job'
    },
    restore: {
      icon: ArchiveRestore,
      color: 'hover:bg-green-50 hover:text-green-600',
      tooltip: 'Restore job'
    },
    publish: {
      icon: CheckCircle2,
      color: 'hover:bg-green-50 hover:text-green-600',
      tooltip: 'Publish job'
    },
    delete: {
      icon: Trash2,
      color: 'hover:bg-red-50 hover:text-red-600',
      tooltip: 'Delete job'
    },
    copy: {
      icon: Copy,
      color: 'hover:bg-gray-50 hover:text-gray-600',
      tooltip: 'Copy job link'
    },
    duplicate: {
      icon: Copy,
      color: 'hover:bg-purple-50 hover:text-purple-600',
      tooltip: 'Duplicate job'
    }
  };

  const config = actionConfig[action];
  if (!config) return null;

  const IconComponent = config.icon;
  const buttonTooltip = tooltip || config.tooltip;

  const buttonContent = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={loading}
      className={`action-button h-8 w-8 p-0 transition-all duration-200 ${config.color} ${className} ${
        loading ? 'loading-action' : ''
      }`}
    >
      {loading ? (
        <Clock className="h-4 w-4 animate-spin" />
      ) : (
        <IconComponent className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {buttonContent}
      </TooltipTrigger>
      <TooltipContent>
        <p>{buttonTooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * JobActionsDropdown - Comprehensive dropdown with all job actions
 */
export const JobActionsDropdown = ({ 
  job, 
  actionLoading = {}, 
  onStatusUpdate, 
  onCopyLink, 
  onDuplicate, 
  onDelete,
  children 
}) => {
  const isLoading = (action) => actionLoading[job.id] === action;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {/* View Actions */}
        <DropdownMenuItem asChild>
          <Link 
            to={`/jobs/${job.id}`} 
            className="flex items-center cursor-pointer"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Job Page
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => onCopyLink(job.id)}
          disabled={isLoading('copy')}
          className="flex items-center cursor-pointer"
        >
          {isLoading('copy') ? (
            <Clock className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Copy Job Link
        </DropdownMenuItem>

        {job.source_url && (
          <DropdownMenuItem asChild>
            <a 
              href={job.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Original Source
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Management Actions */}
        <DropdownMenuItem asChild>
          <Link 
            to={`/external-admin/jobs/${job.id}/edit`} 
            className="flex items-center cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Job
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => onDuplicate(job.id)}
          disabled={isLoading('duplicate')}
          className="flex items-center cursor-pointer"
        >
          {isLoading('duplicate') ? (
            <Clock className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          Duplicate Job
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Status Actions */}
        {job.status === 'published' ? (
          <DropdownMenuItem 
            onClick={() => onStatusUpdate(job.id, 'archived')}
            disabled={isLoading('status')}
            className="flex items-center cursor-pointer text-yellow-600"
          >
            {isLoading('status') ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Archive className="h-4 w-4 mr-2" />
            )}
            Archive Job
          </DropdownMenuItem>
        ) : job.status === 'archived' ? (
          <DropdownMenuItem 
            onClick={() => onStatusUpdate(job.id, 'published')}
            disabled={isLoading('status')}
            className="flex items-center cursor-pointer text-green-600"
          >
            {isLoading('status') ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArchiveRestore className="h-4 w-4 mr-2" />
            )}
            Restore Job
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem 
            onClick={() => onStatusUpdate(job.id, 'published')}
            disabled={isLoading('status')}
            className="flex items-center cursor-pointer text-green-600"
          >
            {isLoading('status') ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Publish Job
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {/* Danger Zone */}
        <DropdownMenuItem 
          onClick={() => onDelete(job)}
          className="flex items-center cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Job
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * QuickJobActions - Quick action buttons that appear on hover
 */
export const QuickJobActions = ({ 
  job, 
  actionLoading = {}, 
  onStatusUpdate, 
  onCopyLink 
}) => {
  const isLoading = (action) => actionLoading[job.id] === action;

  return (
    <div className="quick-actions flex items-center space-x-1">
      {/* View Button */}
      <JobActionButton
        action="view"
        job={job}
        onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
      />

      {/* Edit Button */}
      <JobActionButton
        action="edit"
        job={job}
        onClick={() => window.location.href = `/external-admin/jobs/${job.id}/edit`}
      />

      {/* Status Toggle Button */}
      <JobActionButton
        action={job.status === 'published' ? 'archive' : 'publish'}
        job={job}
        loading={isLoading('status')}
        onClick={() => onStatusUpdate(
          job.id, 
          job.status === 'published' ? 'archived' : 'published'
        )}
      />

      {/* Copy Link Button */}
      <JobActionButton
        action="copy"
        job={job}
        loading={isLoading('copy')}
        onClick={() => onCopyLink(job.id)}
      />
    </div>
  );
};

export default JobActionButton;
