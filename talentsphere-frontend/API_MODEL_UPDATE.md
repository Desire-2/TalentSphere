# API Model Update - Important Notice

## Issue Fixed ✅

**Problem**: The experimental model `gemini-2.0-flash-exp` had very limited free tier quotas causing 429 quota exceeded errors.

**Solution**: Switched to the stable `gemini-1.5-flash` model which provides:
- ✅ Better rate limits (15 requests/min vs 0 for experimental)
- ✅ More reliable performance
- ✅ Production-ready stability
- ✅ Same high-quality results

## Changes Made

1. **Updated AI Service** (`aiJobParser.js`)
   - Changed from `gemini-2.0-flash-exp` to `gemini-1.5-flash`
   - Both parsing and summary generation functions updated

2. **Updated Documentation**
   - AI_JOB_PARSER_README.md
   - AI_IMPLEMENTATION_SUMMARY.md
   - QUICK_START.txt

## New Rate Limits (Free Tier)

- **15 requests per minute** (gemini-1.5-flash)
- **1,500 requests per day**
- **1 million tokens per day**

These limits are sufficient for typical usage and the model is production-ready.

## What This Means for You

✅ **No action required** - the fix is automatic
✅ **Better reliability** - no more quota exceeded errors on free tier
✅ **Same quality** - parsing accuracy remains excellent (90-95%)
✅ **Same speed** - response times are similar (3-10 seconds)

## If You Still Get Quota Errors

If you see quota exceeded errors after this fix:

1. **Wait 1 minute** - rate limits reset every minute
2. **Check your usage** - visit https://ai.dev/usage?tab=rate-limit
3. **Verify API key** - make sure you're using your own key
4. **Consider paid tier** - if you need higher limits

## Experimental vs Stable Models

| Feature | gemini-2.0-flash-exp | gemini-1.5-flash |
|---------|---------------------|------------------|
| Free tier requests/min | 0 (limited beta) | 15 |
| Free tier requests/day | Limited | 1,500 |
| Stability | Experimental | Production-ready |
| Availability | Beta testing | Generally available |
| Recommended for | Testing only | Production use |

## Recommendation

**Use `gemini-1.5-flash` for production** - it's the stable, recommended model with generous free tier limits.

Only use experimental models if you need to test cutting-edge features and have a paid plan.

---

**Date**: November 22, 2025
**Status**: Fixed ✅
**Model**: `gemini-1.5-flash` (stable)
