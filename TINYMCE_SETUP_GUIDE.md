# TinyMCE Rich Text Editor Setup Guide

## Overview
The CreateExternalJob component uses TinyMCE as the rich text editor for job descriptions. To use the full functionality without limitations, you need to configure a TinyMCE API key.

## Getting a TinyMCE API Key

### Free Tier
TinyMCE offers a free tier that includes:
- Up to 1,000 editor loads per month
- All core editing features
- Cloud-based deployment

### Steps to Get Your API Key:

1. **Visit TinyMCE Website**
   - Go to [https://www.tiny.cloud/](https://www.tiny.cloud/)
   - Click "Get API Key" or "Sign Up"

2. **Create Account**
   - Sign up with your email address
   - Verify your email address
   - Complete the registration process

3. **Get Your API Key**
   - Log into your TinyMCE Cloud dashboard
   - Navigate to "My Account" → "API Key Management"
   - Copy your API key

4. **Configure in Your Project**
   - Add the API key to your `.env` file:
   ```env
   VITE_TINYMCE_API_KEY=your-actual-api-key-here
   ```
   - Restart your development server

## Configuration Details

### Environment Variables
The editor looks for the API key in the following environment variable:
```env
VITE_TINYMCE_API_KEY=your-api-key-here
```

### Features Enabled with API Key
- ✅ No "This domain is not registered" warnings
- ✅ Full editor functionality
- ✅ Cloud-based deployment
- ✅ Latest editor features
- ✅ Better performance

### Fallback Mode
If no API key is provided:
- ⚠️ Editor runs in demo mode
- ⚠️ Warning message displayed
- ⚠️ "This domain is not registered" notification
- ✅ Basic functionality still works

## Deployment Considerations

### Development
- Use your API key in `.env` file
- Add `.env` to `.gitignore` (already done)

### Production
- Set the `VITE_TINYMCE_API_KEY` environment variable in your hosting platform
- For Vercel: Add to Environment Variables in project settings
- For Netlify: Add to Site Settings → Environment Variables
- For Render: Add to Environment Variables

### Domain Registration
If you're using a custom domain:
1. Log into your TinyMCE Cloud dashboard
2. Go to "My Account" → "Approved Domains"
3. Add your production domain(s)

## Usage Statistics

### Free Tier Limits
- **1,000 editor loads/month**: Each time a user opens the rich text editor
- **Monitoring**: Check usage in TinyMCE Cloud dashboard
- **Upgrade**: Available if you exceed limits

### What Counts as a Load
- Opening the CreateExternalJob page with rich text editor
- Refreshing the page with editor visible
- Each unique user session

## Troubleshooting

### Common Issues

1. **"This domain is not registered" warning**
   - Solution: Add your domain to approved domains list
   - Or: Check if API key is correctly set

2. **Editor not loading**
   - Check if API key is valid
   - Verify internet connection
   - Check browser console for errors

3. **Development vs Production**
   - Ensure API key is set in both environments
   - Add both localhost and production domains

### Support
- TinyMCE Documentation: [https://www.tiny.cloud/docs/](https://www.tiny.cloud/docs/)
- Support Portal: Available in your TinyMCE Cloud dashboard

## Alternative Editors

If you prefer not to use TinyMCE with an API key, the CreateExternalJob component also includes:
- **Markdown Editor**: No API key required
- **Toggle Switch**: Users can choose between Rich Text and Markdown
- **Same Functionality**: Both editors provide professional job description formatting
