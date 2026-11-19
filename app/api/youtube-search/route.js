import { NextResponse } from 'next/server';

// YouTube Data API v3 search endpoint
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';
// Fix the API key retrieval - prioritize the server environment variable
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// Helper function to calculate text similarity (improved approach)
const calculateSimilarity = (str1, str2) => {
  if (!str1 || !str2) return 0;

  const a = str1.toLowerCase().split(' ').filter(word => word.length > 2);
  const b = str2.toLowerCase().split(' ').filter(word => word.length > 2);

  if (a.length === 0 || b.length === 0) return 0;

  const matches = a.filter(x => b.includes(x)).length;
  return matches / Math.max(a.length, b.length);
};

// Helper function to extract key terms from text
const extractKeyTerms = (text, maxTerms = 15) => {
  if (!text) return [];

  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were',
    'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its',
    'our', 'their', 'me', 'him', 'us', 'them', 'what', 'where', 'when', 'why', 'how', 'which', 'who', 'whom'
  ]);

  // Extract words, filter out stop words and short words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(' ')
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count frequency of each word
  const freq = {};
  words.forEach(word => {
    freq[word] = (freq[word] || 0) + 1;
  });

  // Sort by frequency and return top terms
  return Object.entries(freq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxTerms)
    .map(([word]) => word);
};

// Helper function to check if text contains educational keywords
const isEducationalContent = (title, description) => {
  const educationalKeywords = [
    'tutorial', 'lesson', 'learn', 'guide', 'how to', 'explained', 'beginner',
    'introduction', 'basics', 'fundamentals', 'course', 'training', 'lecture',
    'walkthrough', 'step by step', 'demonstration', 'example', 'teach', 'educational',
    'workshop', 'masterclass', 'comprehensive', 'complete guide', 'full course'
  ];

  const text = (title + ' ' + description).toLowerCase();
  return educationalKeywords.some(keyword => text.includes(keyword));
};

// Helper function to check if video is from a reputable educational channel
const isFromReputableChannel = (title, description) => {
  const reputableChannels = [
    'khan academy', 'coursera', 'edx', 'mit', 'stanford', 'harvard', 'google developers',
    'microsoft developer', 'aws', 'ibm', 'nasa', 'ted', 'crashcourse', 'minute physics',
    'kurzgesagt', 'national geographic', 'bbc', 'cnn', 'npr', 'ted-ed'
  ];

  const text = (title + ' ' + description).toLowerCase();
  return reputableChannels.some(channel => text.includes(channel));
};

// Helper function to calculate video quality score
const calculateVideoQuality = (video) => {
  let qualityScore = 0;

  // Bonus for high view count (logarithmic scale to prevent domination)
  if (video.viewCount) {
    qualityScore += Math.log10(video.viewCount + 1) * 0.5;
  }

  // Bonus for high like ratio
  if (video.likeCount && video.viewCount && video.viewCount > 0) {
    const likeRatio = video.likeCount / video.viewCount;
    qualityScore += likeRatio * 2; // Up to 2 points for like ratio
  }

  // Bonus for substantial comment count (indicates engagement)
  if (video.commentCount && video.commentCount > 10) {
    qualityScore += Math.min(Math.log10(video.commentCount) * 0.5, 1); // Cap at 1 point
  }

  return qualityScore;
};

// Helper function to fetch with timeout and retry
const fetchWithTimeout = async (url, options = {}, timeout = 15000, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
};

export async function POST(request) {
  try {
    // Check if YouTube API key is set
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured. Please set YOUTUBE_API_KEY in your environment variables.');
      return NextResponse.json({
        error: 'YouTube API key is not configured. Please set YOUTUBE_API_KEY in your environment variables.'
      }, { status: 500 });
    }

    const body = await request.json();
    const { query, courseTitle, chapterName, chapterDescription, chapterContent, maxResults = 15, duration } = body;

    if (!query) {
      return NextResponse.json({
        error: 'Query parameter is required'
      }, { status: 400 });
    }

    // Construct the YouTube API URL with better search parameters
    const youtubeUrl = new URL(YOUTUBE_API_URL);
    youtubeUrl.searchParams.append('key', YOUTUBE_API_KEY);
    youtubeUrl.searchParams.append('q', query);
    youtubeUrl.searchParams.append('part', 'snippet');
    youtubeUrl.searchParams.append('type', 'video');
    youtubeUrl.searchParams.append('maxResults', Math.min(maxResults, 25).toString()); // YouTube API limit
    youtubeUrl.searchParams.append('videoEmbeddable', 'true');
    youtubeUrl.searchParams.append('videoSyndicated', 'true');
    youtubeUrl.searchParams.append('order', 'relevance'); // Order by relevance first
    youtubeUrl.searchParams.append('relevanceLanguage', 'en'); // Prefer English content
    youtubeUrl.searchParams.append('regionCode', 'US'); // US region for better results

    // Add duration filter if provided
    if (duration) {
      // Parse the duration to minutes for better mapping
      const parseDuration = (durationStr) => {
        if (!durationStr) return 0;
        const str = String(durationStr).toLowerCase();

        // Handle various formats like "1 Hour", "2 Hours", "1h", "2h", etc.
        if (str.includes('hour') || str.includes('hr') || str.includes('h')) {
          const hourMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|h)/);
          if (hourMatch) {
            return Math.round(parseFloat(hourMatch[1]) * 60);
          }
        }

        // Handle minutes
        if (str.includes('min') || str.includes('m')) {
          const minMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:min|m)/);
          if (minMatch) {
            return Math.round(parseFloat(minMatch[1]));
          }
        }

        // Default parsing
        const numberMatch = str.match(/(\d+(?:\.\d+)?)/);
        return numberMatch ? Math.round(parseFloat(numberMatch[1])) : 0;
      };

      const durationInMinutes = parseDuration(duration);

      // Map to YouTube duration filters based on minutes
      let youtubeDuration;
      if (durationInMinutes > 0 && durationInMinutes <= 4) {
        youtubeDuration = 'short'; // Less than 4 minutes
      } else if (durationInMinutes > 4 && durationInMinutes <= 20) {
        youtubeDuration = 'medium'; // 4-20 minutes
      } else if (durationInMinutes > 20) {
        youtubeDuration = 'long'; // Longer than 20 minutes
      }

      // Fallback for string-based matching
      if (!youtubeDuration) {
        if (duration.includes('1') && (duration.includes('hour') || duration.includes('hr') || duration.includes('h'))) {
          youtubeDuration = 'short'; // 1 hour -> short videos
        } else if (duration.includes('2') && (duration.includes('hour') || duration.includes('hr') || duration.includes('h'))) {
          youtubeDuration = 'medium'; // 2 hours
        } else if ((duration.includes('3') || duration.includes('more') || duration.includes('greater')) &&
          (duration.includes('hour') || duration.includes('hr') || duration.includes('h'))) {
          youtubeDuration = 'long'; // 3+ hours
        }
      }

      if (youtubeDuration) {
        youtubeUrl.searchParams.append('videoDuration', youtubeDuration);
      }
    }

    // Make the request to YouTube API with timeout and retry
    console.log('Making YouTube API request with URL:', youtubeUrl.toString());
    const response = await fetchWithTimeout(youtubeUrl.toString(), {}, 15000, 3);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API Error:', errorText);
      return NextResponse.json({
        error: `YouTube API error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`Found ${data.items?.length || 0} videos from YouTube API`);

    // Extract and filter video information
    let videos = [];
    if (data.items && Array.isArray(data.items)) {
      videos = data.items.map(item => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        channelTitle: item.snippet.channelTitle
      }));
    }

    console.log(`Found ${videos.length} videos from YouTube API`);

    // Basic filtering to ensure we have valid video IDs
    videos = videos.filter(v => v.videoId);

    // Return the top video(s)
    // We only need the first one for the chapter, but returning a few is helpful for debugging
    return NextResponse.json({ videos: videos.slice(0, 5) }, { status: 200 });

  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    // Return a more user-friendly error message
    const userMessage = error.message.includes('fetch') ?
      'Failed to connect to YouTube API. Please check your internet connection and try again.' :
      `Failed to search YouTube videos: ${error.message}`;

    return NextResponse.json({
      error: userMessage
    }, { status: 500 });
  }
}