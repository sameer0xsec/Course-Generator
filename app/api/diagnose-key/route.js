import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from environment variables
    // Try both NEXT_PUBLIC_ and regular environment variable
    const apiKey = process.env.PERPLEXITY_API_KEY || process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
    
    console.log('Diagnosing API key...');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey ? apiKey.length : 0);
    console.log('API Key value:', apiKey);
    
    if (apiKey) {
      console.log('API Key preview:', `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
      
      // Check validation logic step by step
      const lowerApiKey = apiKey.toLowerCase();
      console.log('Lowercase key:', lowerApiKey);
      
      const exactMatch1 = lowerApiKey === 'your_perplexity_api_key_here';
      const exactMatch2 = lowerApiKey === 'your_perplexity_api_key';
      const exactMatch3 = lowerApiKey === 'placeholder';
      const exactMatch4 = lowerApiKey === 'test';
      const containsPlaceholder = lowerApiKey.includes('your_perplexity_api_key') && lowerApiKey.length < 50;
      const tooShort = apiKey.length < 10;
      
      console.log('Validation checks:');
      console.log('  exactMatch1 (your_perplexity_api_key_here):', exactMatch1);
      console.log('  exactMatch2 (your_perplexity_api_key):', exactMatch2);
      console.log('  exactMatch3 (placeholder):', exactMatch3);
      console.log('  exactMatch4 (test):', exactMatch4);
      console.log('  containsPlaceholder (your_perplexity_api_key && <50 chars):', containsPlaceholder);
      console.log('  tooShort (<10 chars):', tooShort);
      
      const isPlaceholder = 
        exactMatch1 || exactMatch2 || exactMatch3 || exactMatch4 || containsPlaceholder || tooShort;
      
      console.log('Final isPlaceholder result:', isPlaceholder);
      
      return NextResponse.json({
        success: true,
        hasApiKey: !!apiKey,
        keyLength: apiKey.length,
        keyPreview: `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`,
        isPlaceholder: isPlaceholder,
        validationDetails: {
          exactMatch1,
          exactMatch2,
          exactMatch3,
          exactMatch4,
          containsPlaceholder,
          tooShort
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        hasApiKey: false,
        error: 'API key not found in environment variables. Please set PERPLEXITY_API_KEY or NEXT_PUBLIC_PERPLEXITY_API_KEY in your environment variables.'
      });
    }
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}