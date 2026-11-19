'use client'
import React, { useState, useEffect } from 'react'
import { ClockIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import ChapterContent from './ChapterContent';

function DashboardCourseView({ course }) {
    const [chapters, setChapters] = useState([]);
    const [selectedChapter, setSelectedChapter] = useState(null);
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [hasStarted, setHasStarted] = useState(false); // Track if user has started the course

    // Check if videos should be included
    const includeVideos = course?.includeVideo === 'Yes';

    // Extract course data
    const courseData = course?.courseOutput?.course || course?.courseOutput || course;

    useEffect(() => {
        const fetchChapters = async () => {
            try {
                // For saved courses, we need to fetch chapters from the chapters table
                const response = await fetch(`/api/chapters?courseId=${course.courseId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.rows && Array.isArray(data.rows) && data.rows.length > 0) {
                        // Helper to extract string content
                        const extractString = (val) => {
                            if (!val) return '';
                            if (typeof val === 'string') {
                                try {
                                    if (val.trim().startsWith('{')) {
                                        const parsed = JSON.parse(val);
                                        return extractString(parsed);
                                    }
                                } catch (e) { }
                                return val;
                            }
                            if (typeof val === 'object') {
                                return extractString(val.content);
                            }
                            return String(val);
                        };

                        // Map the database chapters to the expected format
                        const mappedChapters = data.rows.map(row => ({
                            name: row.chapterName,
                            content: extractString(row.content),
                            videoId: row.videoId || '',
                            duration: row.duration || '10 min',
                            isPracticeChapter: row.chapterName === 'Practice Questions and Exercises'
                        }));
                        setChapters(mappedChapters);

                        // Set the first chapter as selected by default
                        if (mappedChapters.length > 0 && !selectedChapter) {
                            setSelectedChapter(mappedChapters[0]);
                        }
                    } else {
                        // Fallback to courseOutput chapters if API doesn't return data
                        let chaptersRaw = courseData?.chapters ?? [];

                        // Handle different data structures
                        if (chaptersRaw && !Array.isArray(chaptersRaw)) {
                            if (chaptersRaw.chapters && Array.isArray(chaptersRaw.chapters)) {
                                chaptersRaw = chaptersRaw.chapters;
                            } else {
                                chaptersRaw = [];
                            }
                        }

                        setChapters(chaptersRaw);

                        // Set the first chapter as selected by default
                        if (chaptersRaw.length > 0 && !selectedChapter) {
                            setSelectedChapter(chaptersRaw[0]);
                        }
                    }
                } else {
                    // Fallback to courseOutput chapters if API fails
                    let chaptersRaw = courseData?.chapters ?? [];

                    // Handle different data structures
                    if (chaptersRaw && !Array.isArray(chaptersRaw)) {
                        if (chaptersRaw.chapters && Array.isArray(chaptersRaw.chapters)) {
                            chaptersRaw = chaptersRaw.chapters;
                        } else {
                            chaptersRaw = [];
                        }
                    }

                    setChapters(chaptersRaw);

                    // Set the first chapter as selected by default
                    if (chaptersRaw.length > 0 && !selectedChapter) {
                        setSelectedChapter(chaptersRaw[0]);
                    }
                }
            } catch (error) {
                console.error('Error fetching chapters:', error);
                // Fallback to courseOutput chapters if API fails
                let chaptersRaw = courseData?.chapters ?? [];

                // Handle different data structures
                if (chaptersRaw && !Array.isArray(chaptersRaw)) {
                    if (chaptersRaw.chapters && Array.isArray(chaptersRaw.chapters)) {
                        chaptersRaw = chaptersRaw.chapters;
                    } else {
                        chaptersRaw = [];
                    }
                }

                setChapters(chaptersRaw);

                // Set the first chapter as selected by default
                if (chaptersRaw.length > 0 && !selectedChapter) {
                    setSelectedChapter(chaptersRaw[0]);
                }
            }
        };

        if (course?.courseId) {
            fetchChapters();
        }
    }, [course, courseData, selectedChapter]);

    const toggleChapter = (index) => {
        setExpandedChapter(expandedChapter === index ? null : index);
    };

    // Simple function to estimate duration based on content length
    const calculateDuration = (content) => {
        if (!content || typeof content !== 'string') return 'Duration not set';

        // Rough estimate: 1 minute per 500 characters
        const words = content.split(' ').length;
        const minutes = Math.max(1, Math.round(words / 100)); // Minimum 1 minute

        if (minutes < 60) {
            return `${minutes} min`;
        } else {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `${hours} hour${hours > 1 ? 's' : ''}`;
            } else {
                return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes} min`;
            }
        }
    };

    // Calculate total course duration
    const getTotalDuration = () => {
        let totalMinutes = 0;
        chapters.forEach(chapter => {
            if (chapter.duration) {
                const match = chapter.duration.match(/(\d+)\s*min/);
                if (match) {
                    totalMinutes += parseInt(match[1]);
                }
            }
        });

        if (totalMinutes < 60) {
            return `${totalMinutes} minutes`;
        } else {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
    };

    // Show course overview page before starting
    if (!hasStarted) {
        const courseName = courseData?.name || course?.name || 'Untitled Course';
        const courseDescription = courseData?.description || course?.description || 'No description available';
        const courseCategory = course?.category || 'General';
        const courseLevel = course?.level || 'Beginner';
        const courseBannerImage = course?.courseBannerImage || courseData?.bannerImage || '/guide-book.png';

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    {/* Course Header */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
                        <div className="relative h-80">
                            <img
                                src={courseBannerImage}
                                alt={courseName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = '/guide-book.png';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="px-3 py-1 bg-purple-600 rounded-full text-sm font-medium">
                                        {courseCategory}
                                    </span>
                                    <span className="px-3 py-1 bg-blue-600 rounded-full text-sm font-medium">
                                        {courseLevel}
                                    </span>
                                </div>
                                <h1 className="text-4xl font-bold mb-2">{courseName}</h1>
                            </div>
                        </div>

                        <div className="p-8">
                            <p className="text-gray-700 text-lg leading-relaxed mb-6">
                                {courseDescription}
                            </p>

                            {/* Course Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Chapters</p>
                                        <p className="text-2xl font-bold text-purple-900">{chapters.length}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                                        <ClockIcon className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Duration</p>
                                        <p className="text-2xl font-bold text-blue-900">{getTotalDuration()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Videos</p>
                                        <p className="text-2xl font-bold text-green-900">
                                            {includeVideos ? chapters.filter(c => c.videoId).length : 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={() => setHasStarted(true)}
                                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                Start Learning →
                            </button>
                        </div>
                    </div>

                    {/* Chapter List Preview */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
                        <div className="space-y-3">
                            {chapters.map((chapter, index) => (
                                <div key={index} className={`flex items-center gap-4 p-4 rounded-lg hover:bg-gray-100 transition-colors ${chapter.isPracticeChapter ? 'bg-amber-50' : 'bg-gray-50'}`}>
                                    {chapter.isPracticeChapter ? (
                                        <div className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl">
                                            📝
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">{chapter.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            {chapter.duration && (
                                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                                    <ClockIcon className="w-3 h-3" />
                                                    {chapter.duration}
                                                </span>
                                            )}
                                            {includeVideos && chapter.videoId && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                                    Video
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show the chapter view after user clicks Start
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Fixed Sidebar with chapters list */}
                <div className="w-80 bg-white border-r border-gray-200 fixed left-0 top-0 h-screen overflow-hidden flex flex-col">
                    {/* Course Title Header */}
                    <div className="bg-primary p-5 flex-shrink-0">
                        <h2 className="text-lg font-bold text-white leading-tight">
                            {courseData?.name || 'Course Content'}
                        </h2>
                    </div>

                    {/* Scrollable Chapters List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {chapters.map((chapter, index) => (
                            <div
                                key={index}
                                className={`border rounded-lg cursor-pointer transition-all duration-200 ${selectedChapter?.name === chapter.name
                                    ? 'bg-purple-50 border-purple-300 shadow-sm'
                                    : 'hover:bg-gray-50 border-gray-200'
                                    }`}
                                onClick={() => setSelectedChapter(chapter)}
                            >
                                <div className="flex items-start p-3 gap-3">
                                    {/* Chapter Number or Practice Icon */}
                                    {chapter.isPracticeChapter ? (
                                        <div className={`flex-none h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${selectedChapter?.name === chapter.name
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-amber-200 text-amber-700'
                                            }`}>
                                            📝
                                        </div>
                                    ) : (
                                        <div className={`flex-none h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${selectedChapter?.name === chapter.name
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-200 text-gray-700'
                                            }`}>
                                            {index + 1}
                                        </div>
                                    )}

                                    {/* Chapter Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-medium text-sm mb-1 break-words ${selectedChapter?.name === chapter.name
                                            ? 'text-purple-900'
                                            : 'text-gray-900'
                                            }`}>
                                            {chapter?.name ?? chapter?.title ?? `Chapter ${index + 1}`}
                                        </h3>

                                        {/* Duration and Video indicators */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {chapter?.duration && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <ClockIcon className="w-3 h-3" />
                                                    <span>{chapter.duration}</span>
                                                </div>
                                            )}
                                            {includeVideos && chapter?.videoId && (
                                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                    Video
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {chapters.length === 0 && (
                            <p className="text-gray-500 text-center py-4">No chapters available</p>
                        )}
                    </div>
                </div>

                {/* Main content area - offset by sidebar width */}
                <div className="flex-1 ml-80 min-h-screen">
                    {selectedChapter ? (
                        <div className="bg-white h-full">
                            <ChapterContent chapter={selectedChapter} content={selectedChapter} />
                        </div>
                    ) : (
                        <div className="bg-white h-full flex items-center justify-center">
                            <p className="text-gray-500 text-center">Select a chapter from the sidebar to view its content</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default DashboardCourseView