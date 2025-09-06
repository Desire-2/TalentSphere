import React, { useRef } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { Label } from '../ui/label';
import { HelpCircle, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { Alert, AlertDescription } from '../ui/alert';

const RichTextEditor = ({ 
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
  const editorRef = useRef(null);
  const apiKey = import.meta.env.VITE_TINYMCE_API_KEY;

  const handleEditorChange = (content) => {
    onChange(field, content);
  };

  // Show warning if no API key is provided
  const showApiWarning = !apiKey || apiKey === 'your-tinymce-api-key-here';

  const editorConfig = {
    ...(apiKey && apiKey !== 'your-tinymce-api-key-here' && { apiKey }),
    height: height,
    menubar: false,
    plugins: [
      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
      'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autoresize'
    ],
    toolbar: 'undo redo | blocks | ' +
      'bold italic forecolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      'link image | removeformat | help',
    toolbar_mode: 'floating',
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote',
    quickbars_insert_toolbar: 'quickimage quicktable',
    content_style: `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; 
        font-size: 14px;
        line-height: 1.6;
        color: #374151;
      }
      p { margin: 0 0 1em 0; }
      ul, ol { margin: 0 0 1em 1.5em; }
      h1, h2, h3, h4, h5, h6 { margin: 0 0 0.5em 0; font-weight: 600; }
      h1 { font-size: 1.5em; }
      h2 { font-size: 1.25em; }
      h3 { font-size: 1.125em; }
    `,
    placeholder: placeholder,
    skin: 'oxide',
    content_css: 'default',
    branding: false,
    promotion: false,
    resize: 'vertical',
    contextmenu: 'link image table',
    browser_spellcheck: true,
    relative_urls: false,
    remove_script_host: false,
    convert_urls: true,
    image_advtab: true,
    image_caption: true,
    image_list: [
      // You can add predefined images here if needed
    ],
    link_list: [
      // You can add predefined links here if needed
    ],
    setup: (editor) => {
      editor.on('init', () => {
        if (placeholder && !value) {
          editor.setContent(`<p style="color: #9CA3AF; font-style: italic;">${placeholder}</p>`);
        }
      });
      
      editor.on('focus', () => {
        if (!value && editor.getContent().includes(placeholder)) {
          editor.setContent('');
        }
      });
      
      editor.on('blur', () => {
        if (!editor.getContent().trim()) {
          editor.setContent(`<p style="color: #9CA3AF; font-style: italic;">${placeholder}</p>`);
        }
      });
    }
  };

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
      
      {showApiWarning && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            <strong>TinyMCE API Key Missing:</strong> The editor is running in demo mode. 
            <br />
            <span className="text-sm">
              Add your TinyMCE API key to <code className="bg-amber-100 px-1 rounded">.env</code> file. 
              Get a free key at{' '}
              <a 
                href="https://www.tiny.cloud/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-amber-700 underline hover:text-amber-900"
              >
                tiny.cloud
              </a>
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      <div className={`relative ${error ? 'ring-2 ring-red-500 ring-opacity-25 rounded-lg' : ''}`}>
        <Editor
          ref={editorRef}
          value={value}
          onEditorChange={handleEditorChange}
          init={editorConfig}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <span>{error}</span>
        </p>
      )}
      
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {value ? `${value.replace(/<[^>]*>/g, '').length} characters` : '0 characters'}
        </span>
        <span className="flex items-center space-x-1">
          <span>Rich text formatting supported</span>
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;
