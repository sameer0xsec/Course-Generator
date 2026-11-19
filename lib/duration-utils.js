/**
 * Utility functions for handling course duration constraints
 */

/**
 * Parse a duration string (e.g., "15 minutes", "1 hour") into minutes
 * @param {string} durationStr - Duration string
 * @returns {number} Duration in minutes
 */
export function parseDurationToMinutes(durationStr) {
  if (!durationStr || typeof durationStr !== 'string') {
    return 0;
  }
  
  const lowerStr = durationStr.toLowerCase();
  
  // Handle hours
  if (lowerStr.includes('hour')) {
    const hoursMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*hour/);
    if (hoursMatch) {
      return Math.round(parseFloat(hoursMatch[1]) * 60);
    }
  }
  
  // Handle minutes
  if (lowerStr.includes('minute')) {
    const minutesMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*minute/);
    if (minutesMatch) {
      return parseInt(minutesMatch[1], 10);
    }
  }
  
  // Handle mixed format like "1 hour 30 minutes"
  if (lowerStr.includes('hour') && lowerStr.includes('minute')) {
    const hoursMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*hour/);
    const minutesMatch = lowerStr.match(/(\d+(?:\.\d+)?)\s*minute/);
    const hours = hoursMatch ? parseFloat(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
    return Math.round(hours * 60 + minutes);
  }
  
  // Default fallback - try to extract any number
  const numberMatch = lowerStr.match(/(\d+(?:\.\d+)?)/);
  if (numberMatch) {
    // If no unit specified, assume minutes
    return parseInt(numberMatch[1], 10);
  }
  
  return 0;
}

/**
 * Format minutes into a human-readable duration string
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export function formatMinutesToDuration(minutes) {
  if (minutes <= 0) {
    return "Duration not set";
  }
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Validate if the total course duration matches user preference
 * @param {Array} chapters - Array of chapter objects with duration properties
 * @param {string} userPreferredDuration - User's preferred duration
 * @returns {Object} Validation result with status and suggestions
 */
export function validateCourseDuration(chapters, userPreferredDuration) {
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return { isValid: false, message: "No chapters provided" };
  }
  
  if (!userPreferredDuration) {
    return { isValid: true, message: "No duration preference specified" };
  }
  
  // Calculate total duration
  const totalMinutes = chapters.reduce((sum, chapter) => {
    return sum + parseDurationToMinutes(chapter.duration || "0");
  }, 0);
  
  // Define acceptable ranges for user preferences
  let minMinutes, maxMinutes, preferenceLabel;
  
  switch(userPreferredDuration) {
    case "1 Hour":
      minMinutes = 45;  // 45 minutes
      maxMinutes = 75;  // 1 hour 15 minutes
      preferenceLabel = "1 hour";
      break;
    case "2 Hours":
      minMinutes = 90;  // 1 hour 30 minutes
      maxMinutes = 150; // 2 hours 30 minutes
      preferenceLabel = "2 hours";
      break;
    case "More than 3 Hours":
      minMinutes = 180; // 3 hours
      maxMinutes = 600; // 10 hours (reasonable upper limit)
      preferenceLabel = "more than 3 hours";
      break;
    default:
      return { isValid: true, message: "Unknown duration preference, skipping validation" };
  }
  
  // Check if total duration is within acceptable range
  if (totalMinutes >= minMinutes && totalMinutes <= maxMinutes) {
    return { 
      isValid: true, 
      message: `Total duration (${formatMinutesToDuration(totalMinutes)}) is within the preferred range for ${preferenceLabel}`,
      totalMinutes
    };
  } else if (totalMinutes < minMinutes) {
    const shortfall = minMinutes - totalMinutes;
    return { 
      isValid: false, 
      message: `Total duration (${formatMinutesToDuration(totalMinutes)}) is ${formatMinutesToDuration(shortfall)} shorter than the minimum expected for ${preferenceLabel}`,
      totalMinutes,
      shortfall,
      suggestion: `Consider adding more content or extending chapter durations by approximately ${Math.ceil(shortfall / chapters.length)} minutes per chapter`
    };
  } else {
    const excess = totalMinutes - maxMinutes;
    return { 
      isValid: false, 
      message: `Total duration (${formatMinutesToDuration(totalMinutes)}) is ${formatMinutesToDuration(excess)} longer than the maximum expected for ${preferenceLabel}`,
      totalMinutes,
      excess,
      suggestion: `Consider reducing content or shortening chapter durations by approximately ${Math.ceil(excess / chapters.length)} minutes per chapter`
    };
  }
}

/**
 * Adjust chapter durations to match user preference
 * @param {Array} chapters - Array of chapter objects
 * @param {string} userPreferredDuration - User's preferred duration
 * @returns {Array} Adjusted chapters with updated durations
 */
export function adjustChapterDurations(chapters, userPreferredDuration) {
  if (!chapters || !Array.isArray(chapters) || chapters.length === 0) {
    return chapters;
  }
  
  if (!userPreferredDuration) {
    return chapters;
  }
  
  // Calculate current total duration
  const currentTotalMinutes = chapters.reduce((sum, chapter) => {
    return sum + parseDurationToMinutes(chapter.duration || "0");
  }, 0);
  
  // Define target duration ranges
  let targetMinutes;
  
  switch(userPreferredDuration) {
    case "1 Hour":
      targetMinutes = 60;   // Target 1 hour
      break;
    case "2 Hours":
      targetMinutes = 120;  // Target 2 hours
      break;
    case "More than 3 Hours":
      targetMinutes = 240;  // Target 4 hours as midpoint
      break;
    default:
      return chapters; // No adjustment for unknown preferences
  }
  
  // If current duration is close enough (within 15%), don't adjust
  if (Math.abs(currentTotalMinutes - targetMinutes) <= targetMinutes * 0.15) {
    return chapters;
  }
  
  // Calculate scaling factor
  const scaleFactor = targetMinutes / currentTotalMinutes;
  
  // Adjust each chapter's duration
  return chapters.map(chapter => {
    const currentMinutes = parseDurationToMinutes(chapter.duration || "0");
    const adjustedMinutes = Math.max(5, Math.round(currentMinutes * scaleFactor)); // Minimum 5 minutes per chapter
    const adjustedDuration = formatMinutesToDuration(adjustedMinutes);
    
    return {
      ...chapter,
      duration: adjustedDuration
    };
  });
}