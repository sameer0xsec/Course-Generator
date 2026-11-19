import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    
    console.log('Environment variable check:');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key preview:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'None');
    
    if (apiKey) {
      const lowerApiKey = apiKey.toLowerCase();
      // More precise validation - check for exact placeholder strings
      const isPlaceholder = 
        lowerApiKey === 'your_perplexity_api_key_here' ||
        lowerApiKey === 'your_perplexity_api_key' ||
        lowerApiKey === 'placeholder' ||
        lowerApiKey === 'test' ||
        (lowerApiKey.includes('your_perplexity_api_key') && lowerApiKey.length < 50) || // Only consider it a placeholder if it's short
        apiKey.length < 10;
      
      console.log('Is placeholder key:', isPlaceholder);
      
      return NextResponse.json({
        success: true,
        hasApiKey: !!apiKey,
        keyLength: apiKey.length,
        isPlaceholder: isPlaceholder,
        keyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`,
        fullKeyAnalysis: {
          exactMatchYourKey: lowerApiKey === 'your_perplexity_api_key_here',
          exactMatchYourKeyShort: lowerApiKey === 'your_perplexity_api_key',
          exactMatchPlaceholder: lowerApiKey === 'placeholder',
          exactMatchTest: lowerApiKey === 'test',
          containsYourKey: lowerApiKey.includes('your_perplexity_api_key'),
          containsPlaceholder: lowerApiKey.includes('placeholder'),
          containsTest: lowerApiKey.includes('test'),
          tooShort: apiKey.length < 10,
          keyLooksValid: apiKey.startsWith('pplx-') && apiKey.length > 50
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        hasApiKey: false,
        error: 'API key not found in environment variables'
      });
    }
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}