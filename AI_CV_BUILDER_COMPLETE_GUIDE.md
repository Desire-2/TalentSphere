# AI CV Builder System - Complete Implementation Guide

## 🎯 Overview

The AI CV Builder is an advanced feature that uses Google Gemini AI to generate professional, ATS-optimized CVs tailored to specific job opportunities. The system analyzes user profile data and job requirements to create customized resumes that maximize the chances of success.

## 🌟 Key Features

### 1. **AI-Powered CV Generation**
- Uses Google Gemini 2.5 Flash model for intelligent content generation
- Creates professional summaries, achievement-focused bullet points, and keyword optimization
- Analyzes job descriptions to tailor CV content for specific positions

### 2. **Multiple CV Styles**
- **Professional**: Clean, traditional layout for corporate/finance/legal roles
- **Creative**: Modern, visually engaging design for creative industries
- **Modern**: Minimalist with subtle modern touches for tech/startups
- **Minimal**: Ultra-clean, no-frills layout for executive/academic roles
- **Executive**: Sophisticated, leadership-focused for C-suite positions

### 3. **ATS Optimization**
- Estimates ATS compatibility score (0-100%)
- Provides specific optimization suggestions
- Uses standard section headers and keyword-rich content
- Ensures proper formatting for automated parsing systems

### 4. **Comprehensive Profile Integration**
- Work experience with achievements and technologies
- Education history with GPA and honors
- Certifications and licenses
- Projects and portfolio items
- Awards and recognition
- Skills categorization

### 5. **Export Options**
- HTML preview for in-browser viewing
- PDF download with professional formatting
- Responsive design for all screen sizes

## 🏗️ Architecture

### Backend Components

#### 1. **CV Builder Service** (`src/services/cv_builder_service.py`)
Core AI service that handles CV generation logic.

**Key Methods:**
```python
generate_cv_content(user_data, job_data, cv_style, include_sections)
# Generates structured CV data using Gemini AI

generate_cv_html(cv_content, style)
# Converts CV data to styled HTML

generate_cv_pdf(cv_content, style)
# Generates PDF version using WeasyPrint
```

**AI Prompt Engineering:**
- Comprehensive system prompts with role-specific context
- Style-specific guidelines for each CV type
- Job-tailoring instructions when target position provided
- Structured JSON output with validation

#### 2. **API Routes** (`src/routes/cv_builder.py`)

**Endpoints:**

```python
POST /api/cv-builder/generate
# Generate CV content only
# Body: { job_id?, job_data?, style, sections }

POST /api/cv-builder/quick-generate
# All-in-one: generate CV + HTML preview
# Body: { job_id?, job_data?, style, sections }

POST /api/cv-builder/preview-html
# Generate HTML preview from CV content
# Body: { cv_content, style }

POST /api/cv-builder/download-pdf
# Download CV as PDF
# Body: { cv_content, style }
# Returns: PDF file

GET /api/cv-builder/user-data
# Get user profile data for CV generation

GET /api/cv-builder/styles
# Get available CV styles with descriptions
```

### Frontend Components

#### 1. **CV Builder Page** (`src/pages/jobseeker/CVBuilder.jsx`)

**Main Features:**
- Configuration panel for CV customization
- Target job selection (from saved/applied jobs)
- Custom job details input
- Style selection with descriptions
- Section toggling
- Real-time profile data summary
- HTML preview with toggle
- ATS score display
- Optimization tips
- PDF download

**State Management:**
```javascript
const [cvContent, setCvContent] = useState(null);
const [htmlPreview, setHtmlPreview] = useState(null);
const [selectedStyle, setSelectedStyle] = useState('professional');
const [selectedSections, setSelectedSections] = useState([...]);
```

**User Flow:**
1. Select target job (optional) or enter custom job details
2. Choose CV style from 5 options
3. Select sections to include
4. Click "Generate AI CV"
5. View ATS score and optimization tips
6. Preview HTML version
7. Download as PDF

## 📋 Setup Instructions

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
pip install google-genai==0.3.0 WeasyPrint==63.0
```

2. **Configure Environment Variables:**
Add to `.env`:
```bash
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Get your API key from: https://makersuite.google.com/app/apikey

3. **Register Blueprint:**
Already added to `src/main.py`:
```python
from src.routes.cv_builder import cv_builder_bp
app.register_blueprint(cv_builder_bp)
```

4. **Test Backend:**
```bash
python test_cv_builder.py
```

### Frontend Setup

1. **Dependencies:**
All required dependencies already in `package.json`:
- React UI components (shadcn/ui)
- Lucide icons
- API service configured

2. **Environment:**
Ensure `.env` has:
```bash
VITE_API_URL=http://localhost:5001
```

3. **Routes:**
Already added to `App.jsx`:
```javascript
import CVBuilder from './pages/jobseeker/CVBuilder';
<Route path="jobseeker/cv-builder" element={<CVBuilder />} />
```

4. **Navigation:**
Added to Job Seeker Dashboard with purple-themed button.

## 🚀 Usage Guide

### For Job Seekers

#### Creating a General CV

1. Navigate to **Job Seeker Dashboard** → Click **"AI CV Builder"**
2. Leave job selection empty for general CV
3. Choose style (e.g., "Professional")
4. Select sections to include
5. Click **"Generate AI CV"**
6. Review ATS score and suggestions
7. Download as PDF

#### Creating a Job-Tailored CV

1. Go to CV Builder
2. **Option A:** Select job from dropdown (previously saved/applied jobs)
3. **Option B:** Enter custom job details:
   - Job Title
   - Job Description
   - Job Requirements
4. Choose appropriate style for the industry
5. Generate and review
6. AI will highlight relevant experiences and optimize keywords

### For Developers

#### Extending CV Styles

Add new style to `cv_builder_service.py`:

```python
def _get_style_guidelines(self, style: str) -> str:
    styles = {
        # ... existing styles ...
        "your_new_style": """
        - Style description
        - Design principles
        - Suitable for: industries/roles
        """
    }
```

And update CSS in `_get_cv_css()`:

```python
if style == "your_new_style":
    base_css += """
    /* Custom CSS for your style */
    """
```

#### Customizing AI Prompts

Modify `_build_cv_generation_prompt()` to adjust:
- System role and expertise
- Output structure
- Optimization instructions
- Style-specific guidelines

#### Adding New Sections

1. Add section to `available_sections` in frontend
2. Update prompt to handle new section
3. Add HTML builder method in service
4. Update frontend display logic

## 🧪 Testing

### Run Complete Test Suite

```bash
cd backend
python test_cv_builder.py
```

**Tests Include:**
- Authentication
- User data retrieval
- Style list retrieval
- General CV generation
- Job-tailored CV generation
- All 5 CV styles
- HTML preview generation

### Manual Testing Checklist

- [ ] Generate CV without job (general)
- [ ] Generate CV with saved job
- [ ] Generate CV with custom job details
- [ ] Test all 5 styles
- [ ] Toggle different section combinations
- [ ] View HTML preview
- [ ] Download PDF
- [ ] Verify ATS score display
- [ ] Check optimization tips
- [ ] Test with minimal profile data
- [ ] Test with complete profile data

## 📊 Data Flow

```
User Profile Data (Database)
    ↓
CVBuilder.jsx (Frontend)
    ↓
POST /api/cv-builder/quick-generate
    ↓
cv_builder.py (Routes) → Gather user data
    ↓
cv_builder_service.py (Service)
    ↓
Google Gemini AI API
    ↓
Structured CV JSON
    ↓
HTML Generation
    ↓
Frontend Display + PDF Download Option
```

## 🔒 Security Considerations

1. **API Key Protection:**
   - Store Gemini API key in environment variables
   - Never expose in client-side code
   - Rotate keys periodically

2. **Authentication:**
   - All endpoints require valid JWT token
   - Role-based access (job_seeker, admin only)
   - Token validation on every request

3. **Data Privacy:**
   - User data never shared with third parties
   - AI-generated content based on user's own profile
   - PDF/HTML generated server-side

## 💰 Cost Optimization

### Gemini API Free Tier
- **Model:** gemini-2.5-flash (optimized for speed/cost)
- **Free Quota:** 15 RPM, 1M TPM, 1500 RPD
- **Sufficient for:** ~1000 CV generations per day

### Best Practices
1. Cache CV content for 24 hours per user
2. Implement rate limiting (max 5 CVs per user per hour)
3. Use quick-generate endpoint for efficiency
4. Monitor API usage in Google AI Studio

## 🐛 Troubleshooting

### Common Issues

**1. "AI service not configured" Error**
- Solution: Add GEMINI_API_KEY to backend `.env`

**2. "Failed to parse CV response" Error**
- Cause: AI returned invalid JSON
- Solution: Check AI prompt format, validate output structure

**3. WeasyPrint PDF Generation Fails**
- Solution: Install system dependencies:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install python3-cffi python3-brotli libpango-1.0-0 libpangocairo-1.0-0
  
  # macOS
  brew install cairo pango gdk-pixbuf libffi
  ```

**4. No Jobs in Dropdown**
- Cause: User hasn't applied/saved any jobs
- Solution: Use custom job details input instead

**5. ATS Score Shows 0%**
- Cause: AI didn't return ATS data
- Solution: Check AI response parsing, update prompt if needed

## 📈 Future Enhancements

### Planned Features
- [ ] Multi-language CV generation
- [ ] CV version history
- [ ] A/B testing different CV versions
- [ ] Cover letter generation
- [ ] LinkedIn profile import
- [ ] Real-time collaboration
- [ ] Template customization
- [ ] CV analytics (views, downloads)

### Integration Opportunities
- Integration with job application flow
- Auto-apply with generated CV
- CV review by HR experts
- Skill gap analysis visualization
- Interview preparation based on CV

## 📚 API Reference

### Request/Response Examples

**Generate CV:**
```bash
curl -X POST http://localhost:5001/api/cv-builder/quick-generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "job_data": {
      "title": "Software Engineer",
      "description": "...",
      "requirements": "..."
    },
    "style": "professional",
    "sections": ["work", "education", "skills", "summary"]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "CV generated successfully",
  "data": {
    "cv_content": {
      "professional_summary": "...",
      "contact_information": {...},
      "core_competencies": [...],
      "professional_experience": [...],
      "education": [...],
      "ats_score": {
        "estimated_score": 88,
        "strengths": [...],
        "improvements": [...]
      },
      "optimization_tips": [...]
    },
    "html_preview": "<!DOCTYPE html>...",
    "style": "professional"
  }
}
```

## 🤝 Contributing

When contributing to CV Builder:

1. **Follow Existing Patterns:**
   - Service layer for business logic
   - Routes for API endpoints
   - Frontend components for UI

2. **Test Thoroughly:**
   - Add tests to `test_cv_builder.py`
   - Test all CV styles
   - Verify ATS optimization

3. **Document Changes:**
   - Update this guide
   - Add inline code comments
   - Update API reference

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review test script for examples
- Examine service code for AI prompts
- Test with `test_cv_builder.py`

---

**Version:** 1.0.0  
**Last Updated:** December 12, 2025  
**Author:** TalentSphere Development Team
