# AI-Powered Job Parser Feature

## Overview

The AI Job Parser is an intelligent feature that uses Google's Gemini AI to automatically extract structured information from external job postings and auto-fill the job creation form. This significantly reduces the time and effort required to post external jobs from various sources like LinkedIn, Indeed, Glassdoor, or company career pages.

## Features

- **Intelligent Parsing**: Extracts 25+ fields including job title, company info, requirements, salary, location, and more
- **Multi-Source Support**: Works with job postings from LinkedIn, Indeed, Glassdoor, company websites, and more
- **Markdown Conversion**: Automatically converts job descriptions to properly formatted markdown
- **Smart Validation**: Validates and standardizes extracted data to match form requirements
- **Error Handling**: Comprehensive error messages with suggestions for resolution
- **Real-time Feedback**: Loading indicators and success/error notifications

## Setup

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variable

Add your API key to the appropriate environment file:

**For Development** (`.env.development`):
```bash
VITE_GEMINI_API_KEY=your-actual-api-key-here
```

**For Production** (`.env.production`):
```bash
VITE_GEMINI_API_KEY=your-actual-api-key-here
```

**Note**: Never commit your actual API key to version control!

### 3. Restart Development Server

After adding the API key, restart your development server:
```bash
npm run dev
# or
pnpm dev
```

## Usage

### From the External Job Creation Page:

1. Click the **"AI Auto-Fill"** button in the header (purple badge with "Beta")
2. A collapsible panel will appear with a large text area
3. Paste the complete job posting content
4. Click **"Parse with AI & Auto-Fill Form"**
5. Wait for the AI to process (usually 3-10 seconds)
6. Review and edit the auto-filled fields
7. Submit the form as normal

### Supported Job Posting Formats:

The AI can extract information from various formats:

#### LinkedIn Format
```
Senior Software Engineer
TechCorp · San Francisco, CA (Hybrid)
$120,000 - $180,000/year

About the role:
We're looking for an experienced software engineer...
```

#### Indeed Format
```
Job Title: Frontend Developer
Company: StartupCo
Location: Remote
Salary: $80k - $120k per year

Job Description:
Join our team as a Frontend Developer...
```

#### Company Website Format
```
Position: Full Stack Engineer
Department: Engineering
Type: Full-time
Location: New York, NY

We are seeking a talented full stack engineer...
```

## Extracted Fields

The AI parser automatically extracts and fills the following form fields:

### Basic Information
- Job Title
- Job Summary (1-line description)
- Job Description (converted to markdown)

### Company Information
- Company Name
- Company Website
- Company Logo URL (if available)

### Job Details
- Employment Type (full-time, part-time, contract, etc.)
- Experience Level (entry, mid, senior, executive)
- Job Category (intelligent matching)

### Location
- Location Type (remote, on-site, hybrid)
- City
- State/Province
- Country

### Compensation
- Minimum Salary
- Maximum Salary
- Currency (USD, EUR, GBP, CAD)
- Salary Period (yearly, monthly, hourly)
- Salary Negotiable (boolean)
- Show Salary (boolean)

### Requirements
- Required Skills (comma-separated)
- Preferred Skills (comma-separated)
- Minimum Years of Experience
- Maximum Years of Experience
- Education Requirements

### Application
- Application Type (external, email)
- Application URL
- Application Email
- Application Instructions

### Metadata
- Source URL (original posting)
- Job Source (marked as 'external')

## Tips for Best Results

1. **Include Complete Content**: Paste the entire job posting including all sections
2. **More Details = Better Accuracy**: The more information provided, the better the extraction
3. **Minimum 50 Characters**: For meaningful parsing, provide at least 50 characters
4. **Review Before Publishing**: Always review auto-filled fields for accuracy
5. **Edit as Needed**: The AI provides a strong starting point - customize as needed

## Error Handling

### Common Errors and Solutions

#### "AI service not configured"
- **Cause**: Missing `VITE_GEMINI_API_KEY` in environment variables
- **Solution**: Add your API key to `.env.development` or `.env.production`

#### "Invalid API key"
- **Cause**: The API key is incorrect or has been revoked
- **Solution**: Generate a new API key from Google AI Studio

#### "API quota exceeded"
- **Cause**: You've exceeded the free tier limits
- **Solution**: Wait until quota resets or upgrade to a paid plan

#### "Failed to parse AI response"
- **Cause**: The AI returned unexpected format
- **Solution**: Try again with clearer job posting content

## API Limits (Free Tier)

Google Gemini AI free tier includes:
- **15 requests per minute** (gemini-1.5-flash)
- **1,500 requests per day**
- **1 million tokens per day**

These limits are more than sufficient for typical usage. The stable model provides better reliability than experimental models.

## Technical Architecture

### Components

1. **AI Service** (`/src/services/aiJobParser.js`)
   - Handles API communication with Gemini
   - Validates and cleans extracted data
   - Provides error handling and fallbacks

2. **UI Component** (`/src/pages/external-admin/CreateExternalJob.jsx`)
   - Collapsible AI parser panel
   - Text input for job content
   - Loading states and progress indicators
   - Success/error notifications

### Data Flow

```
User Input (Raw Job Posting)
    ↓
Google Gemini AI API
    ↓
JSON Response
    ↓
Validation & Cleaning
    ↓
Form Data Update
    ↓
User Review & Edit
    ↓
Submit to Backend
```

## AI Model

- **Model**: `gemini-1.5-flash`
- **Optimized for**: Fast response times with high accuracy and stable rate limits
- **Capabilities**: Text understanding, extraction, formatting
- **Advantages**: Stable model with generous free tier limits

## Privacy & Security

- API key is stored only in environment variables (not in code)
- Job content is sent to Google's Gemini API for processing
- No data is stored by the AI service beyond the request/response cycle
- All communication is over HTTPS

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for bulk job import (multiple jobs at once)
- [ ] PDF/Word document parsing
- [ ] Browser extension for one-click capture from job sites
- [ ] Historical parsing accuracy tracking
- [ ] Custom AI training for specific job types
- [ ] Automatic company logo fetching from Clearbit/other APIs
- [ ] Skills taxonomy matching and standardization
- [ ] Salary benchmarking and suggestions

## Troubleshooting

### AI Parser Button Not Visible
- Check that you're on the External Job Creation page
- Ensure you're logged in as an external admin

### Parsing Takes Too Long
- Check your internet connection
- Verify API key is valid
- Check Gemini API status page

### Inaccurate Extractions
- Provide more complete job posting content
- Ensure the content is in English (or supported language)
- Try reformatting the input for clarity

## Support

For issues or questions:
1. Check this README first
2. Review browser console for error messages
3. Verify environment configuration
4. Check Google AI Studio for API status
5. Contact development team

## Credits

- **AI Provider**: Google Gemini AI
- **Integration**: TalentSphere Development Team
- **Version**: 1.0.0 (Beta)

---

**Note**: This is a beta feature. While it's highly accurate, always review auto-filled information before publishing jobs.
