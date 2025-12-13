# CV Builder - Enhanced Frontend Implementation

## Overview

The CV Builder has been refactored to move all rendering, styling, and PDF generation to the frontend, while the backend focuses solely on AI-powered content generation using Google Gemini.

## Architecture

### Backend (Simplified)
- **Purpose**: AI content generation only
- **Technology**: Google Gemini AI API
- **Responsibilities**:
  - Generate structured CV content from user profile data
  - Tailor content to specific job descriptions
  - Provide ATS optimization suggestions
  - Return JSON data for frontend rendering

### Frontend (Enhanced)
- **Purpose**: All visual rendering and user interaction
- **Technology**: React components + jsPDF + html2canvas
- **Responsibilities**:
  - Render CV with multiple template designs
  - Provide live preview and customization
  - Generate PDF exports client-side
  - Manage template selection and styling

## Key Features

### ✨ AI-Powered Content Generation
- Analyzes user profile (work experience, education, skills, projects)
- Tailors content to specific job postings
- Optimizes for ATS (Applicant Tracking Systems)
- Provides professional suggestions and improvements

### 🎨 Multiple Template Designs
1. **Professional** - Clean, traditional layout for corporate roles
2. **Creative** - Modern with gradient accents for creative industries
3. **Modern** - Sleek minimalist design for tech/startups
4. **Minimal** - Ultra-clean for executive/academic positions
5. **Executive** - Sophisticated for C-suite roles
6. **Tech** - Code-inspired for software engineers
7. **Bold** - High-impact for sales/leadership
8. **Elegant** - Sophisticated for client-facing roles

### 📄 Client-Side PDF Export
- High-quality PDF generation using jsPDF
- No backend dependency for PDF creation
- Customizable filename with template name and date
- Optimized for print (A4 format)

## Installation

### 1. Install Frontend Dependencies
```bash
chmod +x install_cv_dependencies.sh
./install_cv_dependencies.sh
```

Or manually:
```bash
cd talentsphere-frontend
npm install jspdf html2canvas
```

### 2. Backend Setup
Ensure you have the `GEMINI_API_KEY` in your backend `.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```

## Usage

### For Users
1. Navigate to `/jobseeker/cv-builder`
2. Configure CV preferences:
   - Select target job (optional)
   - Choose template design
   - Select sections to include
3. Click "Generate CV with AI"
4. Preview the generated CV
5. Switch between templates to see different designs
6. Download as PDF

### For Developers

#### Backend API Endpoints

**Generate CV Content**
```http
POST /api/cv-builder/generate
Content-Type: application/json
Authorization: Bearer {token}

{
  "job_id": 123,           // Optional: Tailor to specific job
  "style": "professional",  // Template style preference
  "sections": ["work", "education", "skills", "summary"]
}

Response:
{
  "success": true,
  "data": {
    "cv_content": {
      "contact_information": {...},
      "professional_summary": "...",
      "professional_experience": [...],
      "education": [...],
      "technical_skills": {...},
      // ... more sections
    }
  }
}
```

**Get Available Styles**
```http
GET /api/cv-builder/styles

Response:
{
  "success": true,
  "data": [
    {
      "id": "professional",
      "name": "Professional",
      "description": "Clean, traditional layout...",
      "colorScheme": "Blue & Gray",
      "bestFor": ["Corporate", "Finance", ...]
    },
    // ... more styles
  ]
}
```

**Get User Data**
```http
GET /api/cv-builder/user-data
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    // Complete user profile data
  }
}
```

#### Frontend Components

**CVRenderer Component**
```jsx
import CVRenderer from '../../components/cv/CVRenderer';

<CVRenderer
  cvData={cvContent}
  selectedTemplate="professional"
  onExport={(status, details) => {
    if (status === 'success') {
      console.log('PDF exported:', details);
    }
  }}
/>
```

**CV Templates**
```jsx
import { ProfessionalTemplate, CreativeTemplate, ModernTemplate } from '../../components/cv/CVTemplates';

// Use individual templates
<ProfessionalTemplate cvData={cvData} />

// Or use template registry
import CV_TEMPLATES from '../../components/cv/CVTemplates';
const Template = CV_TEMPLATES[templateId];
<Template cvData={cvData} />
```

## File Structure

```
talentsphere-frontend/
├── src/
│   ├── components/
│   │   └── cv/
│   │       ├── CVTemplates.jsx       # All template components
│   │       └── CVRenderer.jsx        # PDF export & rendering logic
│   └── pages/
│       └── jobseeker/
│           ├── CVBuilder.jsx         # Original CV builder (deprecated)
│           └── CVBuilderNew.jsx      # New frontend-focused builder

backend/
├── src/
│   ├── services/
│   │   ├── cv_builder_service.py    # AI content generation only
│   │   └── cv_templates.py          # Removed (moved to frontend)
│   └── routes/
│       └── cv_builder.py            # Simplified API routes
```

## Benefits of Frontend Rendering

### 1. **Better Performance**
- No server load for HTML/PDF generation
- Instant template switching
- Real-time preview without API calls

### 2. **Enhanced Flexibility**
- Easy to add new templates without backend changes
- Users can customize colors, fonts, layout in real-time
- No dependency on backend for visual updates

### 3. **Improved User Experience**
- Instant visual feedback
- Live preview as user configures
- No waiting for server-side rendering

### 4. **Easier Maintenance**
- Frontend developers can update templates independently
- No backend restart required for template changes
- Clear separation of concerns

### 5. **Scalability**
- Reduced backend load
- PDF generation happens client-side
- Backend only needs to handle AI requests

## Customization Guide

### Adding a New Template

1. Create template component in `CVTemplates.jsx`:
```jsx
export const MyCustomTemplate = ({ cvData }) => {
  return (
    <div className="cv-custom">
      {/* Your custom layout */}
    </div>
  );
};
```

2. Add to template registry:
```jsx
export const CV_TEMPLATES = {
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
  modern: ModernTemplate,
  custom: MyCustomTemplate,  // Add here
};
```

3. Update backend style metadata:
```python
def get_style_metadata(self):
    return [
        # ... existing styles
        {
            'id': 'custom',
            'name': 'My Custom Style',
            'description': 'Custom template description',
            'colorScheme': 'Your Color Scheme',
            'bestFor': ['Industry 1', 'Industry 2']
        }
    ]
```

### Customizing PDF Export

Modify `CVRenderer.jsx` to adjust PDF settings:
```jsx
const pdf = new jsPDF({
  orientation: 'portrait',  // or 'landscape'
  unit: 'mm',
  format: 'a4',             // or 'letter', 'legal'
  compress: true            // Enable compression
});
```

## Migration Guide

To switch from old CV Builder to new implementation:

1. Update route in `App.jsx`:
```jsx
// Old
import CVBuilder from './pages/jobseeker/CVBuilder';

// New
import CVBuilderNew from './pages/jobseeker/CVBuilderNew';

// Update route
<Route path="jobseeker/cv-builder" element={<CVBuilderNew />} />
```

2. Test the new builder
3. Remove old dependencies if not used elsewhere:
   - Backend: `weasyprint` (if only used for CV builder)
   - Backend: `cv_templates.py` (moved to frontend)

## Troubleshooting

### PDF Export Not Working
- Ensure `jspdf` and `html2canvas` are installed
- Check browser console for errors
- Verify CV content is loaded before export

### Templates Not Displaying
- Check that template ID matches registry
- Verify CV data structure matches template expectations
- Check console for component errors

### AI Content Generation Failing
- Verify `GEMINI_API_KEY` is set in backend `.env`
- Check backend logs for API errors
- Ensure user has required profile data

## Performance Optimization

### For Large CVs
1. Implement lazy loading for templates
2. Use React.memo for template components
3. Optimize images before including in CV

### For PDF Export
1. Set appropriate canvas scale (default: 2)
2. Enable PDF compression
3. Optimize HTML before conversion

## Future Enhancements

- [ ] Real-time editing of CV content
- [ ] Drag-and-drop section reordering
- [ ] Color scheme customization
- [ ] Font family selection
- [ ] Multiple page support
- [ ] Export to Word format
- [ ] CV version history
- [ ] Template marketplace
- [ ] Collaborative editing
- [ ] AI-powered suggestions during editing

## Support

For issues or questions:
1. Check backend logs for AI generation errors
2. Check browser console for frontend errors
3. Verify all dependencies are installed
4. Ensure API endpoints are accessible

## License

Part of TalentSphere platform - All rights reserved
