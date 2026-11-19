'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ClockIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { GenerateChapterContent_AI } from '@/configs/AiModel';

function ChapterLayout({ course, onCourseUpdate }) {
    const router = useRouter();
    const [expandedChapter, setExpandedChapter] = useState(null);
    // Add state for editable chapters
    const [editableChapters, setEditableChapters] = useState([]);
    const [isGeneratingContent, setIsGeneratingContent] = useState(false);
    const [contentGenerated, setContentGenerated] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [courseUrl, setCourseUrl] = useState('');

    // Check if the course is already saved to dashboard (public)
    const isCourseSaved = course?.isPublic ?? false;
    console.log("ChapterLayout - isCourseSaved:", isCourseSaved); // Debug: Log isCourseSaved value

    // Check if videos should be included
    const includeVideos = course?.includeVideo === 'Yes';

    // safe parse helper
    const tryParse = (val) => {
        if (typeof val !== "string") return val;
        try { return JSON.parse(val); } catch { return val; }
    };

    // parse common course containers
    const parsedCourseOutput = tryParse(course?.courseOutput);
    const parsedRowCourse = tryParse(course?.course);

    // resolve chapters from common locations
    let courseData = parsedCourseOutput?.course ?? parsedCourseOutput ?? parsedRowCourse?.course ?? parsedRowCourse ?? course?.course ?? course;
    let chaptersRaw = courseData?.chapters ?? [];

    // if chapters are a stringified array, parse it
    if (typeof chaptersRaw === 'string') {
        const parsed = tryParse(chaptersRaw);
        chaptersRaw = Array.isArray(parsed) ? parsed : [];
    }
    // ensure array
    const chapters = Array.isArray(chaptersRaw) ? chaptersRaw.map(ch => tryParse(ch) ?? ch) : [];

    // Create a stable string representation of chapters for dependency array
    const chaptersString = useMemo(() => JSON.stringify(chapters), [chapters]);

    // Initialize editable chapters when chapters change
    useEffect(() => {
        const parsedChapters = JSON.parse(chaptersString);
        setEditableChapters(parsedChapters.map((chapter, index) => ({
            ...chapter,
            id: index,
            isEditing: false
        })));
    }, [chaptersString]); // Use the stable string representation

    // Check if content has been generated (chapters have detailed content)
    useEffect(() => {
        if (chapters && chapters.length > 0) {
            const hasDetailedContent = chapters.some(chapter =>
                chapter?.content && chapter.content.length > 100
            );
            setContentGenerated(hasDetailedContent);
        }
    }, [chapters]);

    // Function to toggle expand/collapse of a chapter
    const toggleChapter = (index) => {
        setExpandedChapter(prev => prev === index ? null : index);
    };

    // Function to toggle edit mode for a chapter description
    const toggleEditChapter = (index) => {
        setEditableChapters(prev => prev.map((chapter, idx) =>
            idx === index ? { ...chapter, isEditing: !chapter.isEditing } : chapter
        ));
    };

    // Function to update chapter description
    const updateChapterDescription = (index, value) => {
        setEditableChapters(prev => prev.map((chapter, idx) =>
            idx === index ? { ...chapter, about: value } : chapter
        ));
    };

    // Function to save edited chapter
    const saveChapterEdit = (index) => {
        // Update the course data with the edited chapter
        const updatedChapters = [...editableChapters];
        updatedChapters[index] = {
            ...updatedChapters[index],
            isEditing: false
        };

        setEditableChapters(updatedChapters);

        // Call the parent's update handler if provided
        if (onCourseUpdate) {
            const updatedCourse = {
                ...course,
                courseOutput: {
                    ...parsedCourseOutput,
                    course: {
                        ...courseData,
                        chapters: updatedChapters
                    }
                }
            };
            onCourseUpdate(updatedCourse);
        }

        toggleEditChapter(index);
    };

    // Generate course content for all chapters using real Perplexity API
    const generateCourseContent = async () => {
        try {
            setIsGeneratingContent(true);
            setShowSuccessMessage(false);

            // Get the course data
            const row = course ?? {};
            const courseOutput = typeof row.courseOutput === 'object' ? row.courseOutput : row.courseOutput;
            const rowCourse = typeof row.course === 'object' ? row.course : row.course;
            const courseData =
                (courseOutput && courseOutput.course) ? courseOutput.course :
                    (rowCourse && typeof rowCourse === 'object') ? rowCourse :
                        (typeof row === 'object' ? row : {});

            // Get user preferences for course duration
            const courseDuration = row.duration || course?.duration || 'Not specified';

            const parsedCourseOutput = courseOutput;

            // Generate detailed content for each chapter using Perplexity
            // Initialize with existing chapters to ensure we don't lose data if generation fails partway
            const updatedChapters = [...editableChapters];

            for (let i = 0; i < updatedChapters.length; i++) {
                const chapter = updatedChapters[i];
                try {
                    // Create a prompt for generating detailed content based on chapter description
                    // Include duration guidance based on user preference
                    let durationGuidance = "";
                    switch (courseDuration) {
                        case "1 Hour":
                            durationGuidance = "Keep the content concise and focused, suitable for a 1-hour total course (approximately 10-20 minutes for this chapter).";
                            break;
                        case "2 Hours":
                            durationGuidance = "Provide comprehensive but focused content, suitable for a 2-hour total course (approximately 15-30 minutes for this chapter).";
                            break;
                        case "More than 3 Hours":
                            durationGuidance = "Provide detailed, in-depth content with examples and explanations, suitable for a 3+ hour total course (approximately 30-60 minutes for this chapter).";
                            break;
                        default:
                            durationGuidance = `Create content appropriate for a course with total duration of ${courseDuration}.`;
                    }

                    console.log(`Generating content for chapter: "${chapter.name}" using description: "${chapter.about}"`);

                    const prompt = `Create detailed, educational content for a chapter with the following description: '${chapter.about}'.

OUTPUT FORMAT:
- Provide the content in RAW MARKDOWN format.
- Do NOT use JSON. Do NOT wrap the entire response in a code block.
- Start directly with a Header 2 (##) Title.
- Use paragraphs, bullet points, and code blocks (e.g. \`\`\`python) where appropriate.
- ${durationGuidance}

CONTENT GUIDELINES:
1. Begin with a brief introduction
2. Explain key concepts clearly
3. Provide practical examples
4. Add code snippets where relevant
5. Conclude with a summary`;

                    console.log("Generating chapter content with Gemini:", prompt);

                    let result;
                    let attempts = 0;
                    const maxAttempts = 3;

                    while (attempts < maxAttempts) {
                        try {
                            result = await GenerateChapterContent_AI.sendMessage(prompt);
                            break;
                        } catch (apiError) {
                            attempts++;
                            console.error(`Gemini generation error (attempt ${attempts}/${maxAttempts}):`, apiError.message);
                            if (attempts < maxAttempts) {
                                await new Promise(r => setTimeout(r, 2000));
                            } else {
                                throw apiError;
                            }
                        }
                    }

                    const textResponse = await result.response?.text();

                    if (!textResponse) {
                        throw new Error("Empty response from AI");
                    }

                    // Clean up the response
                    let finalContent = textResponse;

                    // Remove wrapping markdown code blocks if present (e.g. ```markdown ... ```)
                    if (finalContent.startsWith('```markdown')) {
                        finalContent = finalContent.replace(/```markdown/g, '').replace(/```$/g, '');
                    } else if (finalContent.startsWith('```')) {
                        // Only remove if it's wrapping the whole thing
                        if (finalContent.endsWith('```')) {
                            finalContent = finalContent.substring(3, finalContent.length - 3);
                        }
                    }

                    // If the AI disobeyed and sent JSON anyway, try to extract the content field
                    if (finalContent.trim().startsWith('{') && finalContent.includes('"content"')) {
                        try {
                            const jsonParsed = JSON.parse(finalContent);
                            if (jsonParsed.content) finalContent = jsonParsed.content;
                        } catch (e) {
                            // If parse fails, try regex extraction as fallback
                            const match = finalContent.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
                            if (match && match[1]) {
                                finalContent = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                            }
                        }
                    }

                    // Default to using the raw text (which should be markdown now)
                    let parsedResponse = {
                        content: finalContent.trim()
                    };

                    // Search for a relevant YouTube video for this chapter (only if includeVideos is true)
                    let videoId = '';
                    if (includeVideos) {
                        try {
                            // Improved search query: specific and concise keywords
                            const searchQuery = `${course?.name || ''} ${chapter.name} tutorial`;
                            console.log(`Searching YouTube for: ${searchQuery}`);

                            const videoResponse = await fetch('/api/youtube-search', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    query: searchQuery,
                                    courseTitle: course?.name,
                                    chapterName: chapter.name,
                                    chapterDescription: chapter.about, // Still pass description for potential server-side logic
                                    maxResults: 5
                                })
                            });

                            if (videoResponse.ok) {
                                const videoData = await videoResponse.json();
                                if (videoData.videos && videoData.videos.length > 0) {
                                    videoId = videoData.videos[0].videoId;
                                }
                            }
                        } catch (videoError) {
                            console.error(`Error searching for YouTube video for chapter ${chapter.name}:`, videoError);
                            // Continue without video if search fails
                        }
                    }

                    // Update the specific chapter in our array
                    updatedChapters[i] = {
                        ...chapter,
                        content: parsedResponse.content || chapter.content,
                        videoId: videoId
                    };

                    // Add a small delay between chapters to avoid rate limits
                    if (i < updatedChapters.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }

                } catch (chapterError) {
                    console.error(`Error generating content for chapter ${chapter.name}:`, chapterError);

                    // Check if this is a rate limit error with more comprehensive detection
                    const isQuotaError = chapterError.message.includes('quota') ||
                        chapterError.message.includes('429') ||
                        chapterError.message.includes('exceeded') ||
                        chapterError.message.includes('limit') ||
                        chapterError.message.includes('RESOURCE_EXHAUSTED') ||
                        chapterError.message.includes('rate');

                    if (isQuotaError) {
                        console.error('Quota error detected:', {
                            message: chapterError.message,
                            name: chapterError.name,
                            code: chapterError.code,
                            status: chapterError.status,
                            stack: chapterError.stack
                        });

                        // Try to get more information about the API key
                        const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
                        console.log('Current API key info:', {
                            hasKey: !!apiKey,
                            keyLength: apiKey ? apiKey.length : 0,
                            isPlaceholder: apiKey === 'your_perplexity_api_key_here' || apiKey === 'YOUR_PERPLEXITY_API_KEY_HERE'
                        });

                        throw new Error('You have exceeded your AI API quota. Please wait a few minutes before trying again, or consider upgrading your API plan. You can also check that your API key is valid in your environment variables.');
                    }

                    // No need to push, as updatedChapters[i] is already valid (the original chapter)
                    // We just log the error and continue with the original chapter content
                }
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
            setCourseUrl(`${window.location.origin}/create-course/${course?.courseId || course?.id}`);
        } catch (error) {
            console.error('Error generating course content:', error);
            alert(`Failed to generate course content: ${error.message}`);
        } finally {
            setIsGeneratingContent(false);
        }
    };

    if (!Array.isArray(chapters) || chapters.length === 0) {
        return (
            <div className='mt-3'>
                <h2 className='font-medium text-2xl'>Chapters</h2>
                <p className='text-sm text-gray-500 mt-2'>No chapters available</p>
            </div>
        )
    }

    // Show success message after content generation
    if (showSuccessMessage) {
        const courseName = courseData?.name || course?.name || 'Untitled Course';
        const courseDescription = courseData?.description || course?.description || 'No description available';
        const courseCategory = course?.category || 'General';
        const courseBannerImage = course?.courseBannerImage || courseData?.bannerImage || '/guide-book.png';

        return (
            <div className='mt-8 mb-20 max-w-5xl mx-auto'>
                {/* Header */}
                <h1 className='text-4xl font-bold text-center mb-8' style={{ color: '#7C3AED' }}>
                    Congrats! Your course is Ready
                </h1>

                {/* Course Card */}
                <div className='bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-6'>
                    <div className='flex flex-col md:flex-row gap-8'>
                        {/* Left Side - Course Info */}
                        <div className='flex-1'>
                            <div className='flex items-start gap-2 mb-4'>
                                <h2 className='text-3xl font-bold text-gray-900'>
                                    {courseName}
                                </h2>
                                <button
                                    onClick={() => router.push(`/create-course/${course?.courseId || course?.id}`)}
                                    className='text-gray-600 hover:text-gray-900 transition-colors'
                                    title='Edit course'
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </div>

                            <p className='text-gray-600 leading-relaxed mb-6'>
                                {courseDescription}
                            </p>

                            <div className='flex items-center gap-2 mb-6'>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                                </svg>
                                <span className='text-purple-600 font-medium'>{courseCategory}</span>
                            </div>
                        </div>

                        {/* Right Side - Course Thumbnail */}
                        <div className='md:w-96'>
                            <div className='relative w-full h-56 rounded-xl overflow-hidden shadow-md'>
                                <img
                                    src={courseBannerImage}
                                    alt={courseName}
                                    className='w-full h-full object-cover'
                                    onError={(e) => {
                                        e.target.src = '/guide-book.png';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course URL Section */}
                <div className='bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6'>
                    <label className='block text-sm font-semibold text-gray-700 mb-3'>
                        Course URL:
                    </label>
                    <div className='flex items-center gap-3'>
                        <input
                            type='text'
                            value={courseUrl}
                            readOnly
                            className='flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500'
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(courseUrl);
                                alert('URL copied to clipboard!');
                            }}
                            className='p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
                            title='Copy URL'
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex flex-col sm:flex-row gap-4'>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className='flex-1 bg-purple-600 hover:bg-purple-700 text-white py-6 text-lg rounded-xl transition-all duration-200 shadow-md hover:shadow-lg'
                    >
                        Go to Dashboard
                    </Button>
                    <Button
                        onClick={() => router.push('/create-course')}
                        variant="outline"
                        className='flex-1 py-6 text-lg rounded-xl border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors duration-200'
                    >
                        Create Another Course
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
            </div>
            <div className='mt-2 space-y-3'>
                {editableChapters.map((chapter, idx) => {
                    const name = chapter?.name ?? chapter?.title ?? `Chapter ${idx + 1}`;
                    const about = chapter?.about ?? chapter?.description ?? '';
                    const content = chapter?.content ?? '';

                    return (
                        <div key={idx} className='border rounded-lg p-4' id={`chapter-${idx}`}>
                            <div className='flex items-start justify-between'>
                                <div className='flex-1'>
                                    <h3 className='font-medium text-lg'>{name}</h3>
                                    {chapter.isEditing && !isCourseSaved ? (
                                        <div className='mt-2'>
                                            <Textarea
                                                value={chapter.about || ''}
                                                onChange={(e) => updateChapterDescription(idx, e.target.value)}
                                                className="min-h-[100px]"
                                                placeholder="Edit chapter description..."
                                            />
                                            <div className='mt-2 flex gap-2'>
                                                <Button
                                                    onClick={() => saveChapterEdit(idx)}
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    onClick={() => toggleEditChapter(idx)}
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className='text-sm text-gray-600 mt-2 whitespace-pre-line truncate' title={about || 'No description provided for this chapter.'}>
                                                {about ? `Topics: ${about.substring(0, 100)}${about.length > 100 ? '...' : ''}` : 'No description provided for this chapter.'}
                                            </p>
                                            {/* Display chapter content if available */}
                                            {content && (
                                                <div className='mt-3 p-3 bg-gray-50 rounded'>
                                                    <h4 className='font-medium text-md mb-2'>Chapter Notes:</h4>
                                                    <div className='text-sm text-gray-700 whitespace-pre-line'>
                                                        {content.substring(0, 200)}...
                                                        {content.length > 200 && (
                                                            <span className='text-gray-500'> (Content truncated. Generate full content to see more.)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {!isCourseSaved && (
                                    <div className='flex flex-col gap-2 ml-4'>
                                        <Button
                                            onClick={() => toggleEditChapter(idx)}
                                            variant="outline"
                                            size="sm"
                                        >
                                            {chapter.isEditing ? 'Cancel Edit' : 'Edit Description'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            {!isCourseSaved && (
                <div className='mt-4 p-4 bg-blue-50 rounded-lg'>
                    <p className='text-sm text-blue-700'>
                        <strong>Tip:</strong> Click "Edit Description" to modify chapter descriptions before generating course content.
                        After editing, click "Save" to preserve your changes, then click "Generate Course Content" to create detailed course materials.
                        {includeVideos && (
                            <span> Videos will be included for each chapter based on your selection.</span>
                        )}
                    </p>
                </div>
            )}
        </div>
    )
}

export default ChapterLayout;