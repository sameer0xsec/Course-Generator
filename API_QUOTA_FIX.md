# 🔧 Fixing Perplexity API Quota Errors

## Problem
You're seeing this error:
```
Perplexity API error: 401 - {"error":{"message":"You exceeded your current quota, please check your plan and billing details."}}
```

## Root Cause
Your Perplexity API key has exceeded its usage quota. This happens when:
- You're on a free tier with limited monthly requests
- You've made too many API requests in the current billing period
- Your API plan needs to be upgraded

## Solutions

### Option 1: Check & Upgrade Your Perplexity Plan (Recommended)

1. **Visit Perplexity Settings**: Go to https://www.perplexity.ai/settings/api
2. **Check Your Usage**: Look at your current usage and quota limits
3. **Upgrade if Needed**: Consider upgrading to a paid plan for higher limits
4. **Wait for Reset**: Free tiers typically reset monthly - wait for your quota to refresh

### Option 2: Optimize API Usage

To reduce API calls and stay within quota:

1. **Generate Content Once**: Avoid regenerating course content multiple times
2. **Save Progress**: Save courses to dashboard after generation to avoid re-generating
3. **Use Shorter Prompts**: Simpler prompts use fewer tokens
4. **Batch Operations**: Generate all chapters in one request when possible

### Option 3: Add Alternative AI Providers (Advanced)

Consider implementing fallback to other AI providers:
- Google Gemini API
- OpenAI GPT API  
- Anthropic Claude API

## Current Implementation Updates

I've updated your code to provide better error messages:

### What Changed:
- ✅ Better detection of quota errors vs rate limit errors
- ✅ User-friendly error messages explaining the issue
- ✅ Direct link to Perplexity settings page
- ✅ Improved logging for debugging

### Where:
- `app/create-course/[courseId]/_components/ChapterList.jsx` - Chapter content generation
- `configs/AiModel.jsx` - Already has retry logic and quota handling

## Testing the Fix

When you try to generate content now, you should see:
```
⚠️ AI API Quota Exceeded: Your Perplexity API key has run out of credits. 
Please check your usage at https://www.perplexity.ai/settings/api or wait for the quota to reset.
```

Instead of the generic 401 error.

## Prevention Tips

1. **Monitor Usage**: Check your Perplexity dashboard regularly
2. **Set Limits**: Consider adding usage tracking in your app
3. **Cache Results**: Store generated content to avoid re-generation
4. **User Notifications**: Warn users when approaching quota limits

## Quick Reference

- **Perplexity Dashboard**: https://www.perplexity.ai/settings/api
- **API Documentation**: https://docs.perplexity.ai/
- **Support**: support@perplexity.ai

## Next Steps

1. ✅ Check your Perplexity API usage at the link above
2. ✅ Decide if you need to upgrade your plan
3. ✅ Wait for quota reset if on free tier
4. ✅ Test content generation again after quota resets

---

**Note**: The code changes I made will help you identify quota issues more clearly, but you'll need to address the underlying quota limitation through Perplexity's platform.
