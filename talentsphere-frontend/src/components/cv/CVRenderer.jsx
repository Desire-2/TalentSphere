import React, { useRef, useEffect } from 'react';
import CV_TEMPLATES from './CVTemplates';

/**
 * CVRenderer Component
 * Renders CV content with selected template and provides PDF export
 */
const CVRenderer = ({ cvData, selectedTemplate = 'professional', onExport }) => {
  const cvRef = useRef(null);
  
  // Debug logging
  useEffect(() => {
    console.log('CVRenderer mounted with:', { 
      hasData: !!cvData, 
      template: selectedTemplate,
      dataKeys: cvData ? Object.keys(cvData) : []
    });
  }, [cvData, selectedTemplate]);
  
  // Get the template component
  const TemplateComponent = CV_TEMPLATES[selectedTemplate] || CV_TEMPLATES.professional;
  
  if (!cvData) {
    return (
      <div className="cv-renderer p-8 text-center text-gray-500">
        <p>No CV data available. Please generate CV content first.</p>
      </div>
    );
  }

  /**
   * Export CV as PDF using browser's native print to PDF
   * This properly handles modern CSS including gradients and Tailwind classes
   */
  const exportToPDF = async () => {
    if (!cvRef.current) return;

    try {
      // Show loading state
      if (onExport) onExport('loading');

      // Clone the CV element to preserve styles
      const cvClone = cvRef.current.cloneNode(true);
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Please allow popups for PDF export');
      }
      
      // Get the CV content with inline styles preserved
      const cvContent = cvRef.current.innerHTML;
      
      // Get all stylesheets from the current document including Tailwind
      let styles = '';
      
      // Method 1: Try to get inline styles and computed styles
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          const cssRules = Array.from(styleSheet.cssRules || styleSheet.rules || []);
          cssRules.forEach(rule => {
            styles += rule.cssText + '\n';
          });
        } catch (e) {
          // Handle CORS issues - try to load the stylesheet
          const linkElement = styleSheet.ownerNode;
          if (linkElement && linkElement.href) {
            // For external stylesheets (like Tailwind CDN)
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = linkElement.href;
            styles += `@import url('${linkElement.href}');\n`;
          }
        }
      });
      
      // Method 2: Get computed styles from the CV element directly
      const cvElement = cvRef.current;
      const allElements = cvElement.querySelectorAll('*');
      const inlineStyles = Array.from(allElements).map(el => {
        const computedStyle = window.getComputedStyle(el);
        const classList = Array.from(el.classList).join('.');
        if (classList) {
          // Extract key styles that affect layout and colors
          return `.${classList} {
            color: ${computedStyle.color};
            background: ${computedStyle.background};
            background-color: ${computedStyle.backgroundColor};
            background-image: ${computedStyle.backgroundImage};
            font-size: ${computedStyle.fontSize};
            font-weight: ${computedStyle.fontWeight};
            font-family: ${computedStyle.fontFamily};
            padding: ${computedStyle.padding};
            margin: ${computedStyle.margin};
            border: ${computedStyle.border};
            border-radius: ${computedStyle.borderRadius};
            display: ${computedStyle.display};
            flex: ${computedStyle.flex};
            grid: ${computedStyle.grid};
          }`;
        }
        return '';
      }).filter(Boolean).join('\n');

      // Create print-friendly HTML document with Tailwind CDN
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${cvData.contact_information?.full_name || 'CV'} - ${selectedTemplate}</title>
          
          <!-- Include Tailwind CSS -->
          <script src="https://cdn.tailwindcss.com"></script>
          
          <style>
            /* Captured styles from current page */
            ${styles}
            
            /* Computed inline styles for CV elements */
            ${inlineStyles}
            
            /* Universal print settings */
            * {
              print-color-adjust: exact !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Print-specific styles */
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              
              body {
                margin: 0 !important;
                padding: 0 !important;
                width: 210mm;
                background: white !important;
              }
              
              .cv-preview {
                box-shadow: none !important;
                border: none !important;
                page-break-inside: avoid;
                max-width: 100% !important;
                margin: 0 auto !important;
              }
              
              /* Force gradients to render */
              [class*="gradient"], 
              [class*="bg-gradient"],
              .bg-gradient-to-r,
              .bg-gradient-to-l,
              .bg-gradient-to-t,
              .bg-gradient-to-b,
              .bg-gradient-to-br {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              
              /* Fix grid layouts for print - comprehensive grid support */
              .grid {
                display: grid !important;
              }
              
              .grid-cols-1 {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
              }
              
              .grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              
              .grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              
              /* Handle responsive grids - default to 2 columns in print */
              .md\\:grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              
              .md\\:grid-cols-3 {
                grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
              }
              
              /* Gap utilities */
              .gap-1 {
                gap: 0.25rem !important;
              }
              
              .gap-1\.5 {
                gap: 0.375rem !important;
              }
              
              .gap-2 {
                gap: 0.5rem !important;
              }
              
              .gap-3 {
                gap: 0.75rem !important;
              }
              
              .gap-4 {
                gap: 1rem !important;
              }
              
              .gap-5 {
                gap: 1.25rem !important;
              }
              
              .gap-6 {
                gap: 1.5rem !important;
              }
              
              .gap-8 {
                gap: 2rem !important;
              }
              
              /* Fix flex layouts - comprehensive flex support */
              .flex {
                display: flex !important;
              }
              
              .flex-wrap {
                flex-wrap: wrap !important;
              }
              
              .flex-col {
                flex-direction: column !important;
              }
              
              .flex-row {
                flex-direction: row !important;
              }
              
              .items-start {
                align-items: flex-start !important;
              }
              
              .items-center {
                align-items: center !important;
              }
              
              .items-baseline {
                align-items: baseline !important;
              }
              
              .justify-start {
                justify-content: flex-start !important;
              }
              
              .justify-center {
                justify-content: center !important;
              }
              
              .justify-between {
                justify-content: space-between !important;
              }
              
              .justify-end {
                justify-content: flex-end !important;
              }
              
              /* Fix spacing utilities */
              .space-x-1 > * + * {
                margin-left: 0.25rem !important;
              }
              
              .space-x-2 > * + * {
                margin-left: 0.5rem !important;
              }
              
              .space-x-3 > * + * {
                margin-left: 0.75rem !important;
              }
              
              .space-x-4 > * + * {
                margin-left: 1rem !important;
              }
              
              .space-y-1 > * + * {
                margin-top: 0.25rem !important;
              }
              
              .space-y-2 > * + * {
                margin-top: 0.5rem !important;
              }
              
              .space-y-3 > * + * {
                margin-top: 0.75rem !important;
              }
              
              .space-y-4 > * + * {
                margin-top: 1rem !important;
              }
              
              .space-y-5 > * + * {
                margin-top: 1.25rem !important;
              }
              
              .space-y-6 > * + * {
                margin-top: 1.5rem !important;
              }
              
              /* Ensure backgrounds and borders render with exact colors */
              .bg-gradient-to-r,
              .bg-gradient-to-l,
              .bg-gradient-to-t,
              .bg-gradient-to-b,
              .bg-gradient-to-br,
              .bg-gradient-to-bl,
              .bg-gradient-to-tr,
              .bg-gradient-to-tl,
              .border-l-4,
              .border-t-2,
              .border-2,
              .border,
              .rounded-lg,
              .rounded-xl,
              .rounded-2xl,
              .rounded-full,
              [class*="bg-"],
              [class*="border-"],
              [class*="shadow-"] {
                print-color-adjust: exact !important;
                -webkit-print-color-adjust: exact !important;
              }
              
              /* Prevent awkward content breaks */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid !important;
                page-break-inside: avoid !important;
                break-after: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Allow sections to break naturally but keep section headings with content */
              section {
                page-break-inside: auto !important;
                break-inside: auto !important;
              }
              
              /* Keep section heading with at least first item */
              section > h2 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              
              /* Prevent individual cards, items, and entries from breaking */
              .space-y-6 > div,
              .space-y-5 > div,
              .space-y-4 > div,
              .space-y-3 > div,
              .grid > *,
              .grid > div,
              [class*="rounded-"],
              [class*="shadow-"],
              ul > li,
              ol > li {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Fix for experience timeline - remove bottom padding/borders that cause gaps */
              .relative.pl-8.pb-6,
              .relative.pl-10 {
                padding-bottom: 0 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: auto !important;
                break-after: auto !important;
              }
              
              /* Add margin between experience items instead of padding */
              .space-y-6 > .relative {
                margin-bottom: 1.5rem !important;
              }
              
              .space-y-6 > .relative:last-child {
                margin-bottom: 0 !important;
              }
              
              /* Remove borders that extend across pages */
              .border-l-2 {
                border-left: none !important;
              }
              
              /* Keep the inner card border */
              .border-l-4 {
                border-left: 4px solid !important;
              }
              
              /* Keep experience cards together */
              .relative > div {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              
              /* Fix width constraints for print */
              .max-w-4xl {
                max-width: 100% !important;
              }
              
              /* Ensure proper text rendering */
              .text-transparent {
                -webkit-background-clip: text !important;
                background-clip: text !important;
                -webkit-text-fill-color: transparent !important;
              }
              
              /* Fix flex-shrink for icons and small elements */
              .flex-shrink-0 {
                flex-shrink: 0 !important;
              }
              
              .flex-1 {
                flex: 1 1 0% !important;
              }
              
              /* Whitespace handling */
              .whitespace-nowrap {
                white-space: nowrap !important;
              }
              
              /* Overflow handling for cards */
              .overflow-hidden {
                overflow: hidden !important;
              }
              
              .relative {
                position: relative !important;
              }
              
              .absolute {
                position: absolute !important;
              }
              
              /* Opacity utilities */
              .opacity-0 {
                opacity: 0 !important;
              }
              
              .opacity-10 {
                opacity: 0.1 !important;
              }
              
              .opacity-20 {
                opacity: 0.2 !important;
              }
              
              .opacity-30 {
                opacity: 0.3 !important;
              }
              
              .opacity-90 {
                opacity: 0.9 !important;
              }
              
              .opacity-95 {
                opacity: 0.95 !important;
              }
              
              /* Transform utilities for decorative elements */
              .-translate-x-1\/2 {
                transform: translateX(-50%) !important;
              }
              
              .-translate-y-1\/2 {
                transform: translateY(-50%) !important;
              }
              
              /* Fix leading (line-height) */
              .leading-relaxed {
                line-height: 1.625 !important;
              }
              
              .leading-tight {
                line-height: 1.25 !important;
              }
              
              /* Tracking (letter-spacing) */
              .tracking-tight {
                letter-spacing: -0.025em !important;
              }
              
              .tracking-wide {
                letter-spacing: 0.025em !important;
              }
              
              .tracking-wider {
                letter-spacing: 0.05em !important;
              }
              
              /* Text transformations */
              .uppercase {
                text-transform: uppercase !important;
              }
              
              .italic {
                font-style: italic !important;
              }
              
              /* Font weights */
              .font-light {
                font-weight: 300 !important;
              }
              
              .font-medium {
                font-weight: 500 !important;
              }
              
              .font-semibold {
                font-weight: 600 !important;
              }
              
              .font-bold {
                font-weight: 700 !important;
              }
              
              .font-black {
                font-weight: 900 !important;
              }
              
              /* Drop shadow for text */
              .drop-shadow-lg {
                filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1)) !important;
              }
              
              /* Backdrop blur for glassmorphism effects */
              .backdrop-blur-sm {
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
              }
            }
            
            /* Screen display while preparing */
            @media screen {
              body {
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              
              .cv-preview {
                max-width: 210mm;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
              }
            }
          </style>
        </head>
        <body>
          <div class="cv-preview">
            ${cvContent}
          </div>
          <script>
            // Wait for Tailwind CSS to load before printing
            window.onload = function() {
              // Wait for Tailwind to be fully loaded
              const checkTailwind = setInterval(function() {
                // Check if gradients are rendering by testing a sample element
                const testEl = document.querySelector('[class*="gradient"]');
                if (testEl) {
                  const computedStyle = window.getComputedStyle(testEl);
                  const bgImage = computedStyle.backgroundImage;
                  
                  // If gradient is rendering, proceed with print
                  if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                    clearInterval(checkTailwind);
                    setTimeout(function() {
                      window.print();
                      // Close window after print dialog (with delay for print completion)
                      setTimeout(function() {
                        window.close();
                      }, 500);
                    }, 300);
                  }
                }
              }, 100);
              
              // Fallback: print after 2 seconds regardless
              setTimeout(function() {
                clearInterval(checkTailwind);
                window.print();
                setTimeout(function() {
                  window.close();
                }, 500);
              }, 2000);
            };
            
            // Handle print cancellation
            window.onafterprint = function() {
              setTimeout(function() {
                window.close();
              }, 100);
            };
          </script>
        </body>
        </html>
      `;

      // Write the content to the new window
      printWindow.document.write(printHTML);
      printWindow.document.close();

      // Success callback
      if (onExport) {
        const fileName = `${cvData.contact_information?.full_name?.replace(/\s+/g, '_') || 'CV'}_${selectedTemplate}_${new Date().toISOString().split('T')[0]}.pdf`;
        onExport('success', fileName);
      }

      return true;
    } catch (error) {
      console.error('PDF export failed:', error);
      if (onExport) onExport('error', error.message);
      throw error;
    }
  };

  // Expose export function to parent via hidden button
  React.useEffect(() => {
    const button = document.querySelector('.export-pdf-button');
    if (button) {
      button.onclick = exportToPDF;
    }
  }, [cvData, selectedTemplate]);

  return (
    <div className="cv-renderer">
      {/* CV Preview */}
      <div ref={cvRef} className="cv-preview bg-white">
        <TemplateComponent cvData={cvData} />
      </div>

      {/* Export Actions - Hidden but accessible */}
      <button
        onClick={exportToPDF}
        className="export-pdf-button hidden"
        aria-label="Export to PDF"
        style={{ display: 'none' }}
      >
        Export PDF
      </button>
    </div>
  );
};

export default CVRenderer;
