import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Label } from '../ui/label';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';

const MarkdownEditor = React.memo(({ 
  label, 
  field, 
  value, 
  onChange, 
  placeholder = '', 
  required = false, 
  tooltip,
  error,
  className = '',
  height = 300
}) => {
  const handleChange = React.useCallback((content) => {
    onChange(field, content || '');
  }, [field, onChange]);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-2">
        <Label className={`flex items-center space-x-1 ${required ? 'after:content-["*"] after:text-red-500' : ''}`}>
          <span>{label}</span>
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <div className={`relative ${error ? 'ring-2 ring-red-500 ring-opacity-25 rounded-lg overflow-hidden' : ''}`}>
        <MDEditor
          value={value}
          onChange={handleChange}
          height={height}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          textareaProps={{
            placeholder: placeholder,
            style: {
              fontSize: 14,
              lineHeight: 1.6,
            }
          }}
          data-color-mode="light"
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <span>{error}</span>
        </p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {value ? `${value.length} characters` : '0 characters'}
        </span>
        <span className="flex items-center space-x-1">
          <span>Markdown formatting supported</span>
        </span>
      </div>
    </div>
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
