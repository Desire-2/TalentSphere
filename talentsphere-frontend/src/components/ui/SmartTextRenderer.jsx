import React from 'react';

const SmartTextRenderer = ({ content, className = '' }) => {
  if (!content) {
    return null;
  }

  const formatText = (text) => {
    // Split by double line breaks first for paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map((paragraph, paragraphIndex) => {
      const trimmedParagraph = paragraph.trim();
      if (!trimmedParagraph) return null;

      // Check if it's a header (starts with specific patterns)
      const headerPatterns = [
        /^(Job Description|Description|About the Role|Role Overview|Position Summary)[\s:]*$/i,
        /^(Key Responsibilities|Responsibilities|What You'll Do|Your Role)[\s:]*$/i,
        /^(Requirements|Qualifications|What We're Looking For|Skills Required)[\s:]*$/i,
        /^(Experience|Background|Your Experience)[\s:]*$/i,
        /^(Benefits|What We Offer|Perks|Compensation)[\s:]*$/i,
        /^(Company|About Us|Our Company|About the Company)[\s:]*$/i,
        /^(Location|Where You'll Work|Work Location)[\s:]*$/i,
        /^[A-Z][A-Z\s&]{3,}:?\s*$/,  // ALL CAPS headers
        /^#{1,6}\s+.+$/,  // Markdown headers
      ];

      const isHeader = headerPatterns.some(pattern => pattern.test(trimmedParagraph));
      
      if (isHeader) {
        const cleanHeader = trimmedParagraph
          .replace(/^#+\s*/, '')  // Remove markdown #
          .replace(/:+\s*$/, '')  // Remove trailing colons
          .trim();
        
        return (
          <h3 key={paragraphIndex} className="text-lg font-semibold text-gray-900 mb-3 mt-6 first:mt-0">
            {cleanHeader}
          </h3>
        );
      }

      // Split paragraph by single line breaks to handle lists and sub-items
      const lines = trimmedParagraph.split('\n');
      const formattedLines = [];
      let currentList = [];
      let listType = null;

      lines.forEach((line, lineIndex) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Detect list items
        const bulletPatterns = [
          /^[-•·*]\s+(.+)$/,  // Bullet lists
          /^[•·]\s+(.+)$/,    // Unicode bullets
          /^\*\s+(.+)$/,      // Asterisk bullets
          /^>\s+(.+)$/,       // Quote-style bullets
        ];

        const numberedPatterns = [
          /^(\d+)[.)]\s+(.+)$/,  // Numbered lists
          /^[a-zA-Z][.)]\s+(.+)$/,  // Letter lists
        ];

        let isBulletItem = false;
        let isNumberedItem = false;
        let itemContent = '';

        // Check for bullet items
        for (const pattern of bulletPatterns) {
          const match = trimmedLine.match(pattern);
          if (match) {
            isBulletItem = true;
            itemContent = match[1];
            break;
          }
        }

        // Check for numbered items
        if (!isBulletItem) {
          for (const pattern of numberedPatterns) {
            const match = trimmedLine.match(pattern);
            if (match) {
              isNumberedItem = true;
              itemContent = match[2] || match[1];
              break;
            }
          }
        }

        if (isBulletItem || isNumberedItem) {
          const newListType = isBulletItem ? 'bullet' : 'numbered';
          
          // If we're starting a new list or changing list type
          if (listType !== newListType) {
            // Finish previous list if exists
            if (currentList.length > 0) {
              formattedLines.push(renderList(currentList, listType, `${paragraphIndex}-${formattedLines.length}`));
              currentList = [];
            }
            listType = newListType;
          }
          
          currentList.push(itemContent);
        } else {
          // Not a list item - finish current list if exists
          if (currentList.length > 0) {
            formattedLines.push(renderList(currentList, listType, `${paragraphIndex}-${formattedLines.length}`));
            currentList = [];
            listType = null;
          }

          // Handle special formatting within regular text
          const formattedText = formatInlineText(trimmedLine);
          formattedLines.push(
            <p key={`${paragraphIndex}-${lineIndex}`} className="text-gray-700 mb-2 leading-relaxed">
              {formattedText}
            </p>
          );
        }
      });

      // Don't forget to add any remaining list
      if (currentList.length > 0) {
        formattedLines.push(renderList(currentList, listType, `${paragraphIndex}-final`));
      }

      return formattedLines;
    }).flat().filter(Boolean);
  };

  const renderList = (items, type, key) => {
    const ListComponent = type === 'numbered' ? 'ol' : 'ul';
    const listClass = type === 'numbered' 
      ? "list-decimal list-inside text-gray-700 mb-4 space-y-1 ml-4"
      : "list-disc list-inside text-gray-700 mb-4 space-y-1 ml-4";

    return (
      <ListComponent key={key} className={listClass}>
        {items.map((item, index) => (
          <li key={index} className="leading-relaxed">
            {formatInlineText(item)}
          </li>
        ))}
      </ListComponent>
    );
  };

  const formatInlineText = (text) => {
    // Handle bold text patterns
    let formatted = text
      // **bold** or __bold__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // *italic* or _italic_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // `code`
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">$1</code>');

    // Handle links
    formatted = formatted.replace(
      /https?:\/\/[^\s]+/g, 
      '<a href="$&" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$&</a>'
    );

    // Return JSX with dangerouslySetInnerHTML for simple formatting
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const formattedContent = formatText(content);

  return (
    <div className={`smart-text-content ${className}`}>
      {formattedContent}
    </div>
  );
};

export default SmartTextRenderer;