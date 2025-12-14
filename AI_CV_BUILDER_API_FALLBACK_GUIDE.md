# CV Builder AI API Fallback System

## Overview
The CV Builder V3 now includes an intelligent automatic fallback system that seamlessly switches from Google Gemini to OpenRouter API when usage limits are hit, ensuring uninterrupted CV generation.

## Key Features

### 1. **Automatic API Switching**
- Primary provider: Google Gemini API (`gemini-1.5-flash`)
- Fallback provider: OpenRouter API (`openai/gpt-4o-mini`)
- Automatic detection of Gemini quota exhaustion
- Seamless transition without user intervention

### 2. **Intelligent Quota Detection**
The system monitors for multiple quota exhaustion indicators:
- `RESOURCE_EXHAUSTED` errors
- HTTP 429 (Too Many Requests)
- "Quota exceeded" messages
- "Rate limit" errors
- "Insufficient quota" messages

### 3. **Transparent Tracking**
- Logs API provider switches
- Tracks provider usage in CV metadata
- Creates todo items for user awareness
- Console warnings when fallback is activated

## Implementation Details

### Code Structure

```python
class CVBuilderServiceV3:
    def __init__(self):
        # API configuration
        self._gemini_api_key = os.getenv('GEMINI_API_KEY')
        self._openrouter_api_key = os.getenv('OPENROUTER_API_KEY')
        
        # State management
        self._current_provider = 'gemini'
        self._gemini_quota_exhausted = False
        self._provider_switch_count = 0
```

### Request Flow

```
User Request
    ↓
Try Gemini API
    ↓
Quota Exhausted? ──Yes→ Switch to OpenRouter
    ↓                         ↓
  Success                   Success
    ↓                         ↓
Generate CV with metadata
```

### API Methods

#### `_make_api_request_with_retry(prompt, max_retries=3)`
Main entry point that manages API selection and fallback logic.

**Flow:**
1. Check if Gemini quota is exhausted
2. If not exhausted, try Gemini API
3. On quota error, mark Gemini as exhausted
4. Switch to OpenRouter automatically
5. Continue with OpenRouter for remaining requests

#### `_call_gemini_api(prompt, max_retries=3)`
Handles Gemini API calls with retry logic and exponential backoff.

**Features:**
- Rate limiting (2 seconds between requests)
- 3 retry attempts with exponential backoff
- Empty response handling

#### `_call_openrouter_api(prompt, temperature=0.7, max_tokens=4096)`
Handles OpenRouter API calls using REST API.

**Configuration:**
- Model: `openai/gpt-4o-mini` (cost-effective)
- Temperature: 0.7 (balanced creativity)
- Max tokens: 4096 (matches Gemini)
- Timeout: 60 seconds

## Environment Configuration

### Required Environment Variables

```bash
# Primary AI API (required)
GEMINI_API_KEY=your-google-gemini-api-key

# Fallback AI API (optional but recommended)
OPENROUTER_API_KEY=your-openrouter-api-key

# Site identification for OpenRouter (optional)
SITE_URL=https://jobs.afritechbridge.online
SITE_NAME=TalentSphere
```

### How to Get API Keys

#### Google Gemini API Key
1. Visit: https://aistudio.google.com/app/apikey
2. Create or select a project
3. Generate API key
4. Add to `.env`: `GEMINI_API_KEY=your-key-here`

#### OpenRouter API Key
1. Visit: https://openrouter.ai/
2. Sign up for an account
3. Navigate to Settings → API Keys
4. Create a new API key
5. Add to `.env`: `OPENROUTER_API_KEY=your-key-here`

### Free Tier Information

**Google Gemini Free Tier:**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per minute

**OpenRouter Pricing (gpt-4o-mini):**
- $0.15 per 1M input tokens
- $0.60 per 1M output tokens
- Very cost-effective for fallback usage

## Usage Examples

### Successful Fallback Scenario

```python
# Initialize service
cv_service = CVBuilderServiceV3()

# Generate CV - will automatically handle quota
result = cv_service.generate_cv_section_by_section(
    user_data=user_profile,
    job_data=job_info,
    cv_style="professional"
)

# Check which API was used
print(result['api_metadata'])
# Output:
# {
#   'primary_provider': 'gemini',
#   'current_provider': 'openrouter',
#   'gemini_quota_exhausted': True,
#   'provider_switches': 1,
#   'fallback_enabled': True
# }
```

### Console Output Example

When fallback occurs:
```
============================================================
⚠️  Gemini API quota exhausted: RESOURCE_EXHAUSTED
🔄 Automatically switching to OpenRouter API...
============================================================

[CV Builder V3] Using OpenRouter API (fallback mode)
[CV Builder V3] Section 'summary': processing
[CV Builder V3] Section 'summary': completed - 52 words

[CV Builder V3] ✅ Generation complete
[CV Builder V3] API Provider: OPENROUTER
[CV Builder V3] ⚠️  Gemini quota exhausted - OpenRouter fallback used
[CV Builder V3] Sections generated: 8
[CV Builder V3] Todos for follow-up: 1
```

## API Response Metadata

Every generated CV includes comprehensive API metadata:

```json
{
  "metadata": {
    "generated_at": "2025-12-14T10:30:00",
    "style": "professional",
    "version": "3.0-targeted-sections"
  },
  "api_metadata": {
    "primary_provider": "gemini",
    "current_provider": "openrouter",
    "gemini_quota_exhausted": true,
    "provider_switches": 1,
    "fallback_enabled": true
  },
  "professional_summary": "...",
  "professional_experience": [...],
  "todos": [
    {
      "section": "api_quota",
      "issue": "Gemini quota exhausted - using OpenRouter",
      "suggestion": "OpenRouter fallback activated. Switch count: 1",
      "priority": "medium"
    }
  ]
}
```

## Error Handling

### Gemini Unavailable (No API Key)
```python
ValueError: GEMINI_API_KEY not found in environment variables.
```

### OpenRouter Unavailable (No API Key)
```python
ValueError: OPENROUTER_API_KEY not found in environment variables. Add it to use fallback.
```

### Both APIs Fail
```python
Exception: No API provider available
```

## Installation

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

The `requirements.txt` now includes:
```txt
# HTTP Requests
requests==2.32.3
```

### 2. Configure Environment
```bash
cp .env.template .env
```

Edit `.env`:
```bash
# Required
GEMINI_API_KEY=your-gemini-key

# Recommended (for fallback)
OPENROUTER_API_KEY=your-openrouter-key
SITE_URL=https://your-domain.com
SITE_NAME=YourAppName
```

### 3. Test the System
```python
from src.services.cv_builder_service_v3 import CVBuilderServiceV3

service = CVBuilderServiceV3()

# Generate test CV
result = service.generate_cv_section_by_section(
    user_data=test_user_data,
    job_data=test_job_data
)

# Check API provider
print(f"Used: {result['api_metadata']['current_provider']}")
```

## Monitoring & Debugging

### Check Current Provider
```python
print(f"Current provider: {service._current_provider}")
print(f"Gemini exhausted: {service._gemini_quota_exhausted}")
print(f"Switch count: {service._provider_switch_count}")
```

### Force OpenRouter Usage
```python
service._gemini_quota_exhausted = True
service._current_provider = 'openrouter'
```

### Monitor Todos
```python
for todo in result['todos']:
    if todo['section'] == 'api_quota':
        print(f"API Status: {todo['suggestion']}")
```

## Best Practices

### 1. **Always Configure Fallback**
Set `OPENROUTER_API_KEY` to ensure uninterrupted service when Gemini quota is exhausted.

### 2. **Monitor Usage**
Check `api_metadata` in generated CVs to track API provider switches and plan quota management.

### 3. **Cost Management**
OpenRouter charges per token. Monitor usage through their dashboard: https://openrouter.ai/dashboard

### 4. **Rate Limiting**
Both APIs have rate limits. The system includes built-in rate limiting (2 seconds between requests).

### 5. **Error Logging**
Monitor application logs for quota warnings and provider switches.

## Performance Comparison

| Feature | Gemini (Free) | OpenRouter (gpt-4o-mini) |
|---------|---------------|--------------------------|
| Quality | High | Very High |
| Speed | Fast | Fast |
| Cost | Free (limited) | ~$0.001 per CV |
| Reliability | Quota limits | Pay-as-you-go |
| Rate Limit | 15 req/min | Flexible |

## Troubleshooting

### Issue: "OPENROUTER_API_KEY not found"
**Solution:** Add OpenRouter API key to `.env` file.

### Issue: OpenRouter returns 401 Unauthorized
**Solution:** Verify API key is correct and account has credits.

### Issue: Both APIs fail
**Solution:** Check network connectivity and API key validity.

### Issue: High OpenRouter costs
**Solution:** 
- Monitor usage on OpenRouter dashboard
- Consider upgrading Gemini quota
- Implement request batching

## Advanced Configuration

### Custom Model Selection
Edit `cv_builder_service_v3.py`:

```python
def _call_openrouter_api(self, prompt: str, ...):
    payload = {
        "model": "openai/gpt-4o",  # Use premium model
        # or
        "model": "anthropic/claude-3-haiku",  # Alternative
        # or
        "model": "google/gemini-pro",  # Paid Gemini
        ...
    }
```

### Adjust Retry Logic
```python
def _call_gemini_api(self, prompt: str, max_retries: int = 5):
    # Increase retry attempts
    ...
```

### Custom Quota Detection
Add custom error patterns:
```python
quota_indicators = [
    'resource_exhausted',
    'custom_error_pattern',
    'another_indicator'
]
```

## API Endpoints Affected

The fallback system is used by these endpoints:

- `POST /api/cv/generate` - Main CV generation
- `POST /api/cv/generate-section` - Individual section generation
- `POST /api/cv/enhance-experience` - Experience enhancement
- `POST /api/cv/optimize-for-job` - Job-specific optimization

## Future Enhancements

### Planned Features
1. **Smart Provider Selection** - Choose provider based on workload
2. **Cost Optimization** - Use cheaper models for simpler tasks
3. **Provider Health Checks** - Pre-flight API availability checks
4. **Usage Analytics** - Track API costs and usage patterns
5. **Multi-Provider Load Balancing** - Distribute requests across providers

### Potential Additions
- Azure OpenAI integration
- Anthropic Claude direct integration
- Custom model fine-tuning
- Caching frequently generated sections

## Support

For issues or questions:
- Check logs: `/var/log/talentsphere/`
- Review todos in CV metadata
- Monitor API dashboards
- Contact support with API metadata included

## License & Credits

This implementation uses:
- Google Gemini API (Google LLC)
- OpenRouter API (OpenRouter)
- Flask (Pallets)
- Requests library (Python Software Foundation)

---

**Last Updated:** December 14, 2025  
**Version:** 3.0  
**Status:** Production Ready ✅
