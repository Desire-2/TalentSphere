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
   * This properly handles modern CSS including oklch/oklab colors
   */
  const exportToPDF = async () => {
    if (!cvRef.current) return;

    try {
      // Show loading state
      if (onExport) onExport('loading');

      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        throw new Error('Please allow popups for PDF export');
      }

      // Get the CV content
      const cvContent = cvRef.current.innerHTML;
      
      // Get all stylesheets from the current document
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            // Handle CORS issues with external stylesheets
            const linkElement = styleSheet.ownerNode;
            if (linkElement && linkElement.href) {
              return `@import url('${linkElement.href}');`;
            }
            return '';
          }
        })
        .join('\n');

      // Create print-friendly HTML document
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${cvData.contact_information?.full_name || 'CV'} - ${selectedTemplate}</title>
          <style>
            ${styles}
            
            /* Print-specific styles */
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              
              body {
                margin: 0;
                padding: 0;
                width: 210mm;
                background: white;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
              
              .cv-preview {
                box-shadow: none !important;
                border: none !important;
                page-break-inside: avoid;
              }
              
              /* Ensure gradients print correctly */
              * {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
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
            // Auto-trigger print dialog
            window.onload = function() {
              setTimeout(function() {
                window.print();
                // Close window after print dialog
                setTimeout(function() {
                  window.close();
                }, 100);
              }, 500);
            };
            
            // Handle print cancellation
            window.onafterprint = function() {
              window.close();
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
