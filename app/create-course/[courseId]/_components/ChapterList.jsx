import React, { useState, useEffect, useMemo } from 'react'
import { ClockIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { GenerateChapterContent_AI } from '@/configs/AiModel';
import { useRouter } from 'next/navigation';
import ChapterContent from './ChapterContent';

function ChapterList({ course, onCourseUpdate }) {
    const router = useRouter();
    const [expandedChapter, setExpandedChapter] = useState(null);
    // Add state for editable chapters
    const [editableChapters, setEditableChapters] = useState([]);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [contentGenerated, setContentGenerated] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [courseUrl, setCourseUrl] = useState('');
    const [videoSearchStatus, setVideoSearchStatus] = useState({}); // Track video search status for each chapter

    // Check if the course is already saved to dashboard (public)
    // Improved logic: Only lock editing if course is public AND has content generated
    const hasGeneratedContent = useMemo(() => {
        if (!course?.courseOutput) return false;
        try {
            const output = typeof course.courseOutput === 'string' ? JSON.parse(course.courseOutput) : course.courseOutput;
            // Check if any chapter has significant content
            const chapters = output.course?.chapters || output.chapters || [];
            return chapters.some(c => c.content && c.content.length > 50);
        } catch (e) {
            return false;
        }
    }, [course]);

    const isCourseSaved = (course?.isPublic ?? false) && hasGeneratedContent;
    console.log("ChapterList - isCourseSaved:", isCourseSaved, "isPublic:", course?.isPublic, "hasContent:", hasGeneratedContent);

    // Check if videos should be included
    const includeVideos = course?.includeVideo === 'Yes';

    // safe parse helper
    const tryParse = (val) => {
        if (typeof val !== "string") return val;
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    };

    // Parse course output safely
    const parsedCourseOutput = useMemo(() => {
        if (!course) return null;
        return tryParse(course.courseOutput);
    }, [course]);

    // Extract course data
    const courseData = useMemo(() => {
        if (!parsedCourseOutput) return null;
        return parsedCourseOutput.course || parsedCourseOutput;
    }, [parsedCourseOutput]);

    useEffect(() => {
        if (courseData?.chapters) {
            // Initialize editable chapters with the course data
            const initialChapters = courseData.chapters.map((chapter, index) => ({
                ...chapter,
                isEditing: false
            }));
            setEditableChapters(initialChapters);
        }
    }, [courseData]);

    const toggleChapter = (index) => {
        setExpandedChapter(expandedChapter === index ? null : index);
    };

    const updateChapterContent = (index, field, value) => {
        const updatedChapters = [...editableChapters];
        updatedChapters[index] = { ...updatedChapters[index], [field]: value };
        setEditableChapters(updatedChapters);
    };

    const generateCourseContent = async () => {
        setIsGeneratingContent(true);
        setShowSuccessMessage(false);
        setVideoSearchStatus({}); // Reset video search status

        try {
            const currentCategory = course?.category || 'Uncategorized';
            // Clone the chapters to avoid modifying the original
            let updatedChapters = [...editableChapters];

            // Generate content for each chapter
            // Generate content for each chapter
            for (let i = 0; i < updatedChapters.length; i++) {
                const chapter = updatedChapters[i];
                let extractedContent = '';
                let videoId = '';
                // Preserve the existing duration exactly as it is
                const duration = chapter.duration || 'Not set';

                // 1. Generate AI Content (Independent Try/Catch)
                try {
                    // Update main status
                    console.log(`Processing chapter ${i + 1}: ${chapter.name}`);

                    let extraPrompt = "and include a Code Example section (using typical markdown code blocks like ```python) if applicable.";

                    // Check for non-technical categories to replace code with tables
                    if (['Health', 'Fitness', 'Creativity', 'Creative', 'Yoga', 'Exercise'].some(c => currentCategory.toLowerCase().includes(c.toLowerCase()))) {
                        extraPrompt = "and include a Comparison Table or Chart (using Markdown table format) to visualize the concepts. DO NOT include code snippets.";
                    }

                    const PROMPT = `Explain the concept in Detail on Topic: ${courseData?.name || course?.name}, Chapter:${chapter.name}. 

IMPORTANT: OUTPUT IN RAW MARKDOWN FORMAT ONLY. DO NOT USE JSON. DO NOT WRAP IN CODE BLOCKS. 

Start with a main title (H2), followed by a detailed explanation (use paragraphs, bullet points, bold text), ${extraPrompt}`;

                    console.log("Sending prompt to AI for chapter", i + 1);

                    let result;
                    let attempts = 0;
                    const maxAttempts = 2;

                    while (attempts < maxAttempts) {
                        try {
                            result = await GenerateChapterContent_AI.sendMessage(PROMPT);
                            break;
                        } catch (apiError) {
                            attempts++;
                            console.error(`AI generation error (attempt ${attempts}/${maxAttempts}):`, apiError.message);
                            
                            // Check for specific error types
                            const isQuotaError = apiError.message.includes('401') || 
                                               apiError.message.includes('quota') ||
                                               apiError.message.includes('insufficient_quota');
                            const isRateLimitError = apiError.message.includes('429') ||
                                               apiError.message.includes('rate limit');
                            
                            if (isQuotaError) {
                                throw new Error('⚠️ AI API quota or rate limit reached. Please wait a moment before trying again.');
                            }
                            
                            if (isRateLimitError && attempts < maxAttempts) {
                                console.warn(`⚠️ Rate limit hit, waiting 10s before retry...`);
                                await new Promise(r => setTimeout(r, 10000));
                            } else if (!isRateLimitError) {
                                throw apiError;
                            }
                        }
                    }

                    const response = await result.response;
                    const textResponse = await response.text();

                    // Try to parse the JSON response
                    try {
                        // 1. Check for obviously non-JSON content to skip parsing immediately
                        // If it doesn't start with { or [ (ignoring whitespace and markdown blocks), it's likely text
                        const strippedStart = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
                        if (!strippedStart.startsWith('{') && !strippedStart.startsWith('[')) {
                            throw new Error('Response is likely Markdown logic, skipping JSON parse');
                        }

                        // If the response clearly looks like Markdown (starts with # or contains headers), skip JSON parsing
                        if (textResponse.trim().startsWith('#') || textResponse.includes('## ')) {
                            throw new Error('Response is likely Markdown, skipping JSON parse');
                        }

                        let cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();

                        // Aggressive JSON sanitization to fix "Bad escaped character"
                        cleanJson = cleanJson.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

                        // Handle unescaped single quotes which are invalid in JSON but common in text
                        // This is risky if it replaces quotes inside actual strings, but worth it for stability
                        // cleanJson = cleanJson.replace(/\\'/g, "'"); 

                        const parsedData = JSON.parse(cleanJson);

                        let markdownContent = '';

                        // Helper function to find all objects with a 'title' property in a deep structure
                        const findAllContentItems = (obj, items = []) => {
                            if (Array.isArray(obj)) {
                                obj.forEach(item => findAllContentItems(item, items));
                            } else if (obj !== null && typeof obj === 'object') {
                                if (obj.title) {
                                    items.push(obj);
                                }
                                // Recursively search all values
                                Object.values(obj).forEach(val => findAllContentItems(val, items));
                            }
                            return items;
                        };

                        // Find all content items regardless of structure
                        let contentArray = findAllContentItems(parsedData);

                        // If no items found but parsedData is an object with description, treat it as a single item
                        if (contentArray.length === 0 && parsedData.description) {
                            contentArray = [parsedData];
                        }

                        contentArray.forEach(item => {
                            if (item.title) {
                                markdownContent += `## ${item.title}\n\n`;
                            }

                            // Support both 'explanation' (new prompt) and 'description' (fallback)
                            const explanation = item.explanation || item.description;
                            if (explanation) {
                                markdownContent += `${explanation}\n\n`;
                            }

                            const codeExample = item['Code Example'] || item.code_example;
                            if (codeExample) {
                                // Clean up <precode> tags if present, as we'll use markdown code blocks
                                let cleanCode = codeExample.replace(/<precode>/g, '').replace(/<\/precode>/g, '');
                                markdownContent += `### Code Example

\`\`\`html
${cleanCode}
\`\`\`

`;
                            }
                        });

                        extractedContent = markdownContent || textResponse;

                    } catch (jsonError) {
                        // Silent fallback - we expect Markdown now, so JSON failure is actually normal/good
                        // Only log if it's REALLY weird, otherwise assume it's just text
                        // console.log("Parsing as Markdown...");

                        // Simple cleanup of the text response
                        let cleanText = textResponse;

                        // Remove markdown code block wrappers if they wrap the whole response
                        if (cleanText.trim().startsWith('```markdown')) {
                            cleanText = cleanText.replace(/```markdown/g, '').replace(/```$/g, '');
                        } else if (cleanText.trim().startsWith('```')) {
                            // Only remove if it's wrapping the whole thing, not just a code block inside
                            // Heuristic: check if it ends with ```
                            if (cleanText.trim().endsWith('```')) {
                                cleanText = cleanText.replace(/```/g, ''); // forceful removal might be too aggressive for code blocks inside
                            }
                        }

                        // If it came back as JSON string but failed parse, strip the quotes/braces
                        if (cleanText.trim().startsWith('{') && cleanText.includes('"content"')) {
                            // Try to regex extract the content field specifically
                            const contentMatch = cleanText.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s); // /s for dot matches newline
                            if (contentMatch && contentMatch[1]) {
                                cleanText = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                            }
                        }

                        extractedContent = cleanText.trim();

                        // Ensure it has a title if missing
                        if (!extractedContent.includes('# ')) {
                            extractedContent = `## ${chapter.name}\n\n${extractedContent}`;
                        }

                        // Regex Fallback to extract content even if JSON is broken
                        let regexContent = '';

                        // Try to find title
                        const titleMatch = textResponse.match(/"title"\s*:\s*"([^"]*)"/i);
                        if (titleMatch && titleMatch[1]) {
                            regexContent += `## ${titleMatch[1]}\n\n`;
                        }

                        // Try to find explanation or description
                        const explMatch = textResponse.match(/"(explanation|description)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
                        if (explMatch && explMatch[2]) {
                            // Unescape the string manually if needed, simplified
                            const cleanExpl = explMatch[2].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                            regexContent += `${cleanExpl}\n\n`;
                        }

                        // Try to find code example
                        const codeMatch = textResponse.match(/"(Code Example|code_example)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
                        if (codeMatch && codeMatch[2]) {
                            const cleanCode = codeMatch[2]
                                .replace(/\\n/g, '\n')
                                .replace(/\\"/g, '"')
                                .replace(/<precode>/g, '')
                                .replace(/<\/precode>/g, '');
                            regexContent += `### Code Example

\`\`\`html
${cleanCode}
\`\`\`

`;
                        }

                        // If regex extraction worked, use it. Otherwise fallback to raw text but clean it up
                        if (regexContent.length > 20) {
                            extractedContent = regexContent;
                        } else {
                            // Last resort: just strip the JSON braces if possible
                            extractedContent = textResponse.replace(/{|}|"content":|"/g, '').trim();
                        }
                    }

                    // Remove citation numbers like [1], [2], [1, 2] entirely
                    if (extractedContent) {
                        extractedContent = extractedContent.replace(/\[\d+(?:,\s*\d+)*\]/g, '');
                    }

                    // Basic validation
                    if (!extractedContent || extractedContent.length < 50) {
                        extractedContent = `## ${chapter.name}

${chapter.about}

Content generation incomplete.`;
                    }

                } catch (generationError) {
                    console.error(`Error generating content for chapter ${chapter.name}:`, generationError);
                    extractedContent = `## ${chapter.name}\n\nContent generation is currently unavailable (Error: ${generationError.message}). Please refer to the video tutorial below if available.`;
                }

                // 2. YouTube Search (Independent Try/Catch)
                if (includeVideos) {
                    try {
                        setVideoSearchStatus(prev => ({
                            ...prev,
                            [i]: { status: 'searching', message: `Searching for video...` }
                        }));

                        const courseName = courseData?.name || course?.name || '';
                        const searchQuery = `${courseName} ${chapter.name} tutorial`.trim();
                        console.log("Searching YouTube:", searchQuery);

                        const videoResponse = await fetch('/api/youtube-search', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                query: searchQuery,
                                courseTitle: course?.name,
                                chapterName: chapter.name,
                                chapterDescription: chapter.about,
                                maxResults: 5,
                                duration: course?.duration
                            })
                        });

                        if (videoResponse.ok) {
                            const videoData = await videoResponse.json();
                            if (videoData.videos && videoData.videos.length > 0) {
                                videoId = videoData.videos[0].videoId;
                                setVideoSearchStatus(prev => ({
                                    ...prev,
                                    [i]: { status: 'success', message: `Found video: ${videoData.videos[0].title}` }
                                }));
                            } else {
                                setVideoSearchStatus(prev => ({
                                    ...prev,
                                    [i]: { status: 'not_found', message: 'No video found' }
                                }));
                            }
                        }
                    } catch (videoError) {
                        console.error('YouTube search error:', videoError);
                        setVideoSearchStatus(prev => ({
                            ...prev,
                            [i]: { status: 'error', message: 'Video search failed' }
                        }));
                    }
                }

                // 3. Save to Database (Independent Try/Catch)
                try {
                    const updatedChapter = {
                        ...chapter,
                        content: { content: extractedContent }, // Ensure object structure
                        duration: duration,
                        videoId: videoId
                    };

                    updatedChapters[i] = updatedChapter;

                    // Save loop
                    console.log("Saving chapter to DB:", chapter.name);
                    const chapterResponse = await fetch('/api/chapters', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            courseId: course?.courseId || course?.id,
                            chapterId: i + 1,
                            chapterName: chapter.name,
                            content: { content: extractedContent },
                            videoId: videoId,
                            duration: duration
                        })
                    });

                    if (!chapterResponse.ok) {
                        console.error('Failed to save chapter:', await chapterResponse.text());
                    }
                } catch (saveError) {
                    console.error('Error saving chapter to DB:', saveError);
                }
            }

            // Generate Practice Questions and Exercises chapter based on the entire course
            // Generate Practice Questions and Exercises chapter based on the entire course
            // Skip practice chapter for Creative and Health categories
            // Generate Practice Questions and Exercises chapter based on the entire course
            // Skip practice chapter for Creative and Health/Fitness categories
            const skipPractice = ['Health', 'Fitness', 'Creativity', 'Creative', 'Yoga', 'Exercise'].some(c => currentCategory.toLowerCase().includes(c.toLowerCase()));

            if (!skipPractice) {
                console.log("Generating Practice Questions and Exercises chapter...");
                try {
                    // Create a summary of all chapters for context
                    const chaptersSummary = updatedChapters.map((ch, idx) =>
                        `Chapter ${idx + 1}: ${ch.name} - ${ch.about}`
                    ).join('\n');

                    const courseName = courseData?.name || course?.name || 'this course';

                    const PRACTICE_PROMPT = `Based on the following course "${courseName}", generate comprehensive practice questions and exercises.

Course Chapters:
${chaptersSummary}

IMPORTANT: OUTPUT IN RAW MARKDOWN FORMAT ONLY. DO NOT USE JSON. DO NOT WRAP IN CODE BLOCKS.

Generate the following sections:
1. **Multiple Choice Questions** (5-10 questions). For the answer/explanation, use HTML <details><summary>Check Answer</summary>Answer content (use HTML tags like &lt;strong&gt; for bold, &lt;p&gt; for paragraphs, &lt;ul&gt;&lt;li&gt; for lists).</details>
2. **Short Answer Questions** (3-5 questions). Use <details><summary>Check Answer</summary>Answer content (use HTML formatting).</details>
3. **Practical Exercises** (2-3 hands-on projects)
4. **Discussion Questions** (2-3 questions)

Format each section with clear headings (H3) and numbered items. Ensure the answers are hidden inside the details tags.`;

                    console.log("Sending practice questions prompt to AI");

                    let practiceResult;
                    let attempts = 0;
                    const maxAttempts = 2;

                    while (attempts < maxAttempts) {
                        try {
                            practiceResult = await GenerateChapterContent_AI.sendMessage(PRACTICE_PROMPT);
                            break;
                        } catch (apiError) {
                            attempts++;
                            if (apiError.message.includes('quota') || apiError.message.includes('429')) {
                                if (attempts < maxAttempts) {
                                    console.warn(`Quota exceeded for practice chapter, waiting 10s...`);
                                    await new Promise(r => setTimeout(r, 10000));
                                } else {
                                    throw new Error('AI quota exceeded for practice chapter.');
                                }
                            } else {
                                throw apiError;
                            }
                        }
                    }

                    const practiceResponse = await practiceResult.response;
                    const practiceTextResponse = await practiceResponse.text();

                    // Clean up the response
                    let practiceContent = practiceTextResponse;
                    if (practiceContent.trim().startsWith('```markdown')) {
                        practiceContent = practiceContent.replace(/```markdown/g, '').replace(/```$/g, '');
                    } else if (practiceContent.trim().startsWith('```')) {
                        if (practiceContent.trim().endsWith('```')) {
                            practiceContent = practiceContent.replace(/```/g, '');
                        }
                    }
                    practiceContent = practiceContent.trim();

                    // Ensure it has a title
                    if (!practiceContent.includes('# ')) {
                        practiceContent = `## Practice Questions and Exercises\n\n${practiceContent}`;
                    }

                    // Create the practice chapter
                    const practiceChapter = {
                        name: 'Practice Questions and Exercises',
                        about: 'Test your knowledge and reinforce your learning with these practice questions and exercises',
                        content: { content: practiceContent },
                        duration: '30 minutes',
                        videoId: '', // No video for practice chapter
                        isPracticeChapter: true // Mark this as a special practice chapter
                    };

                    // Add practice chapter to the end
                    updatedChapters.push(practiceChapter);

                    // Save practice chapter to database with a special chapter ID
                    console.log("Saving practice chapter to DB");
                    const practiceChapterResponse = await fetch('/api/chapters', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            courseId: course?.courseId || course?.id,
                            chapterId: updatedChapters.length, // Use the next available ID
                            chapterName: practiceChapter.name,
                            content: { content: practiceContent },
                            videoId: '',
                            duration: '30 minutes'
                        })
                    });

                    if (!practiceChapterResponse.ok) {
                        console.error('Failed to save practice chapter:', await practiceChapterResponse.text());
                    }

                    console.log("Practice chapter generated and saved successfully");
                } catch (practiceError) {
                    console.error('Error generating practice chapter:', practiceError);
                    // Add a fallback practice chapter
                    const fallbackPracticeChapter = {
                        name: 'Practice Questions and Exercises',
                        about: 'Test your knowledge and reinforce your learning',
                        content: { content: `## Practice Questions and Exercises

Review the course material and create your own practice questions based on what you've learned.

### Reflection
- What were the key concepts you learned?
- How can you apply this knowledge?
- What areas need more practice?` },
                        duration: '30 minutes',
                        videoId: '',
                        isPracticeChapter: true
                    };
                    updatedChapters.push(fallbackPracticeChapter);
                }
            } else {
                console.log(`Skipping Practice Chapter for category: ${currentCategory}`);
            }

            // Prepare the updated course data with new chapter content
            const updatedCourseData = {
                courseId: course?.courseId || course?.id,
                courseOutput: {
                    ...parsedCourseOutput,
                    course: {
                        ...courseData,
                        chapters: updatedChapters
                    }
                }
            };

            // Update the course in the database
            const response = await fetch('/api/courses', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedCourseData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update course content');
            }

            // Set content generated flag
            setContentGenerated(true);

            // Show success message
            setShowSuccessMessage(true);
            setCourseUrl(`${window.location.origin}/create-course/${course?.courseId || course?.id}?view=dashboard`);
        } catch (error) {
            console.error('Error generating course content:', error);
            alert(`Failed to generate course content: ${error.message}`);
        } finally {
            setIsGeneratingContent(false);
        }
    };

    // Function to save course to dashboard
    const saveToDashboard = async (courseData) => {
        try {
            const courseId = courseData.courseId || course?.courseId || course?.id;
            if (!courseId) throw new Error('Course ID not found');

            // Extract course information
            const title = courseData.courseOutput?.course?.name || course?.name || 'Untitled Course';
            const description = courseData.courseOutput?.course?.description || course?.description || 'No description provided';
            const category = course?.category || 'Uncategorized';
            // Use the AI-generated image URL if available, otherwise fallback to course banner image or placeholder
            const courseBannerImage = courseData.courseOutput?.course?.courseBannerImage || course?.courseBannerImage || '/guide-book.png';

            const payload = {
                courseId,
                courseData: {
                    title,
                    category,
                    courseOutput: courseData.courseOutput,
                    description,
                    courseBannerImage: courseBannerImage || courseData.courseBannerImage || courseData.imageUrl || '/guide-book.png',
                },
            };

            const response = await fetch('/api/save-to-dashboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save course to dashboard');

            console.log('Course saved to dashboard successfully!');
        } catch (error) {
            console.error('Error saving course to dashboard:', error);
            throw new Error('Failed to save course to dashboard: ' + error.message);
        }
    };

    if (!Array.isArray(editableChapters) || editableChapters.length === 0) {
        return (
            <div className='mt-3'>
                <h2 className='font-medium text-2xl'>Chapters</h2>
                <p className='text-sm text-gray-500 mt-2'>No chapters available</p>
                {/* Debug info */}
                <div className='mt-4 p-4 bg-yellow-50 rounded'>
                    <p className='text-sm text-gray-600'>Debug Info:</p>
                    <p className='text-xs'>Course data type: {typeof course}</p>
                    <p className='text-xs'>Course keys: {course ? Object.keys(course).join(', ') : 'null'}</p>
                    <p className='text-xs'>Parsed course output: {JSON.stringify(parsedCourseOutput, null, 2)}</p>
                </div>
            </div>
        )
    }

    // Show success message after content generation
    if (showSuccessMessage) {
        return (
            <div className='mt-3 mb-20 flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-lg border border-green-100'>
                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6'>
                    <CheckCircleIcon className='text-green-500 w-10 h-10' />
                </div>
                <h2 className='text-3xl font-bold text-gray-800 mb-4 text-center'>Congratulations! 🎉</h2>
                <p className='text-gray-600 mb-2 text-center max-w-md'>
                    Your course content has been successfully generated.
                </p>
                <p className='text-gray-500 mb-8 text-center max-w-md'>
                    You can now save it to your dashboard and start sharing your knowledge.
                </p>

                <div className='bg-gray-50 p-6 rounded-lg w-full max-w-md mb-8 border border-gray-200'>
                    <div className='flex items-center mb-3'>
                        <LinkIcon className='text-gray-500 w-5 h-5 mr-2' />
                        <p className='text-sm font-medium text-gray-700'>Course URL</p>
                    </div>
                    <a
                        href={courseUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-blue-600 hover:text-blue-800 hover:underline break-all text-sm font-mono p-3 bg-white rounded border block'
                    >
                        {courseUrl}
                    </a>
                </div>

                <div className='flex flex-col sm:flex-row gap-4 w-full max-w-md'>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className='flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg'
                    >
                        Go to Dashboard
                    </Button>

                </div>
            </div>
        );
    }

    return (
        <div className='mt-3 mb-20' id="chapters-section">
            <div className='flex justify-between items-center mb-4'>
                <h2 className='font-medium text-2xl'>Chapters</h2>
                {!isCourseSaved && (
                    <Button
                        onClick={generateCourseContent}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={isGeneratingContent}
                    >
                        {isGeneratingContent ? 'Generating...' : 'Generate Course Content'}
                    </Button>
                )}
                {isCourseSaved && (
                    <div className="text-sm text-gray-500">Course is saved - editing disabled</div>
                )}
            </div>

            {/* Show video search status messages */}
            {isGeneratingContent && includeVideos && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 font-medium">Searching for relevant educational videos for each chapter...</p>
                    <p className="text-blue-600 text-sm mt-1">This may take a few moments. Videos will be displayed when you view each chapter.</p>
                </div>
            )}

            {/* Display chapters in a grid layout */}
            <div className='mt-4 space-y-3'>
                {editableChapters.map((chapter, idx) => {
                    const name = chapter?.name ?? chapter?.title ?? `Chapter ${idx + 1}`;
                    const about = chapter?.about ?? chapter?.description ?? '';
                    const rawContent = chapter?.content ?? '';
                    const content = typeof rawContent === 'string' ? rawContent : (rawContent?.content || '');
                    const duration = chapter?.duration ?? 'Not set';
                    const isPracticeChapter = chapter?.isPracticeChapter || false;
                    const isEditing = chapter.isEditing;

                    return (
                        <div key={idx} className={`border rounded-lg p-5 bg-white ${isPracticeChapter ? 'bg-amber-50 border-amber-200' : ''}`}>
                            <div className='flex items-start gap-4'>
                                {/* Chapter Number/Icon */}
                                {isPracticeChapter ? (
                                    <div className='bg-amber-500 flex-none h-10 w-10 text-white rounded-full flex items-center justify-center text-center shadow-sm'>
                                        <span className='font-medium text-xl'>📝</span>
                                    </div>
                                ) : (
                                    <div className='bg-primary flex-none h-10 w-10 text-white rounded-full flex items-center justify-center text-center shadow-sm'>
                                        <span className='font-medium'>{idx + 1}</span>
                                    </div>
                                )}

                                {/* Chapter Details */}
                                <div className='flex-1'>
                                    {/* Title and Edit Button Row */}
                                    <div className='flex justify-between items-start'>
                                        <h3 className='font-bold text-lg text-gray-800 mb-1'>
                                            {name}
                                            {duration !== 'Not set' && !name.includes(duration) && !name.match(/\(\d+\s*(min|hour|hr|minute)/i) && (
                                                <span className='text-sm font-medium text-gray-500 ml-1'>({duration})</span>
                                            )}
                                        </h3>

                                        {!isCourseSaved && !isEditing && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => updateChapterContent(idx, 'isEditing', true)}
                                                className="ml-4"
                                            >
                                                Edit Description
                                            </Button>
                                        )}
                                    </div>

                                    {/* Description or Editor */}
                                    {isEditing ? (
                                        <div className='mt-2'>
                                            <Textarea
                                                value={chapter.about || ''}
                                                onChange={(e) => updateChapterContent(idx, 'about', e.target.value)}
                                                className='w-full border rounded-md p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary'
                                                rows={4}
                                            />
                                            <div className='flex justify-end mt-2'>
                                                <Button
                                                    onClick={() => updateChapterContent(idx, 'isEditing', false)}
                                                    size="sm"
                                                    className="bg-primary text-white"
                                                >
                                                    Save
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className='text-gray-600 text-sm leading-relaxed truncate' title={about}>Topics: {about.substring(0, 100)}{about.length > 100 ? '...' : ''}</p>
                                    )}

                                    {/* Video Search Status */}
                                    {isGeneratingContent && includeVideos && videoSearchStatus[idx] && (
                                        <div className={`mt-3 p-2 rounded text-sm ${videoSearchStatus[idx].status === 'searching' ? 'bg-blue-50 text-blue-700' :
                                            videoSearchStatus[idx].status === 'success' ? 'bg-green-50 text-green-700' :
                                                videoSearchStatus[idx].status === 'not_found' ? 'bg-yellow-50 text-yellow-700' :
                                                    'bg-red-50 text-red-700'
                                            }`}>
                                            {videoSearchStatus[idx].message}
                                        </div>
                                    )}

                                    {/* Content Preview (if generated) */}
                                    {content && (
                                        <div className='mt-4 pt-4 border-t'>
                                            <h4 className='font-medium text-gray-800 mb-2'>Content Preview:</h4>
                                            <div className='bg-gray-50 p-3 rounded border max-h-40 overflow-y-auto text-sm text-gray-600'>
                                                <ChapterContent content={content.substring(0, 300) + (content.length > 300 ? '...' : '')} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tip Box */}
            {!isCourseSaved && (
                <div className='mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start'>
                    <span className='mr-2 text-blue-500 font-bold'>Tip:</span>
                    <p className='text-blue-700 text-sm'>
                        Click "Edit Description" to modify chapter descriptions before generating course content. After editing, click "Save" to preserve your changes, then click "Generate Course Content" to create detailed course materials. Videos will be included for each chapter based on your selection.
                    </p>
                </div>
            )}
        </div>
    );
}

export default ChapterList;