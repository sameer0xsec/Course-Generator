'use client'

import Image from 'next/image'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import EditCourseBasicInfo from './EditCourseBasicInfo';
import { useRouter } from 'next/navigation';
import { cropAndResizeImage } from '@/lib/imageUtils';

function CourseContentInfo({ course, onCourseUpdate }) {
  const router = useRouter();

  // simple row and content resolution (no deep parsing)
  const row = course ?? {}
  const courseOutput = typeof row.courseOutput === 'object' ? row.courseOutput : row.courseOutput
  const rowCourse = typeof row.course === 'object' ? row.course : row.course

  // prefer courseOutput.course, then row.course, then row
  const courseObj = (courseOutput && courseOutput.course) ? courseOutput.course :
    (rowCourse && typeof rowCourse === 'object') ? rowCourse :
      (typeof row === 'object' ? row : {})

  const [title, setTitle] = useState(courseObj?.name ?? courseObj?.title ?? 'Untitled Course');
  const [description, setDescription] = useState(courseObj?.description ?? courseObj?.desc ?? 'No description provided');

  // derive category from top-level row or courseOutput or courseObj
  const category = row?.category ?? courseOutput?.category ?? courseObj?.category ?? 'Uncategorized'

  // State for image generation
  const [imageUrl, setImageUrl] = useState(row?.courseBannerImage || null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState(row?.courseBannerImage || null);
  const fileInputRef = useRef(null);
  const [savingToDashboard, setSavingToDashboard] = useState(false);
  const [savedToDashboard, setSavedToDashboard] = useState(row?.isPublic ?? false);
  const [isPublic, setIsPublic] = useState(row?.isPublic ?? false);

  // Check if the course is already saved to dashboard (public)
  const isCourseSaved = row?.isPublic ?? false;

  // Create a stable string representation of course for dependency array
  const courseString = useMemo(() => JSON.stringify({ title, category }), [title, category]);

  // Check if content has been fully generated (chapters have detailed content)
  const isContentGenerated = useMemo(() => {
    if (!courseOutput?.course?.chapters) return false;
    const chapters = courseOutput.course.chapters;
    return Array.isArray(chapters) && chapters.length > 0 && chapters.some(chapter =>
      chapter?.content && chapter.content.length > 100
    );
  }, [courseOutput]);

  // Generate course thumbnail when component mounts
  useEffect(() => {
    // If we already have a course banner image, use it
    if (row?.courseBannerImage) {
      setImageUrl(row.courseBannerImage);
      setAiGeneratedImageUrl(row.courseBannerImage);
      return;
    }

    // Otherwise generate a new one
    const generateThumbnail = async () => {
      const currentCourse = JSON.parse(courseString);
      console.log('Course data for thumbnail generation:', currentCourse);

      // Reset image state when course changes
      setImageUrl(null);
      setAiGeneratedImageUrl(null);
      setImageError(null);

      if (!currentCourse.title || !currentCourse.category) {
        console.log('Missing title or category, skipping thumbnail generation');
        setImageUrl('/guide-book.png');
        return;
      }

      setLoadingImage(true);

      try {
        console.log('Generating thumbnail for:', currentCourse);

        const response = await fetch('/api/image-generation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseTitle: currentCourse.title,
            category: currentCourse.category
          })
        });

        console.log('API response status:', response.status);
        const data = await response.json();
        console.log('API response data:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate image');
        }

        // Check if this is a fallback image
        if (data.fallback) {
          console.log('Using fallback placeholder image');
          setImageUrl('/guide-book.png');
          setAiGeneratedImageUrl('/guide-book.png');
          return;
        }

        console.log('Generated image URL:', data.imageUrl);
        setAiGeneratedImageUrl(data.imageUrl);
        setImageUrl(data.imageUrl);

        // Test if the image URL actually works
        // We trust the server-side validation.
        // Force the image to load in the browser by setting it.
        setImageUrl(data.imageUrl);
        setAiGeneratedImageUrl(data.imageUrl);
      } catch (error) {
        console.error('Error generating course thumbnail:', error);
        setImageError(error.message);
        // Fallback to placeholder image
        setImageUrl('/guide-book.png');
        setAiGeneratedImageUrl('/guide-book.png');
      } finally {
        setLoadingImage(false);
      }
    };

    generateThumbnail();
  }, [courseString, row?.courseBannerImage]); // Use the stable string representation

  const handleEditImageClick = () => {
    setIsEditingImage(true);
  };

  const handleDeleteImage = () => {
    // Revert to AI generated image if available, otherwise use placeholder
    if (aiGeneratedImageUrl) {
      setImageUrl(aiGeneratedImageUrl);
    } else {
      setImageUrl('/guide-book.png');
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setImageError('Please select an image file (JPEG, PNG, GIF, etc.)');
        return;
      }

      try {
        // Crop and resize the image to exactly 16:9 aspect ratio (1600x900)
        const croppedImage = await cropAndResizeImage(file, 1600, 900);
        setImageUrl(croppedImage);
        setIsEditingImage(false);
        setImageError(null);
      } catch (error) {
        console.error('Error cropping and resizing image:', error);
        setImageError('Failed to process image: ' + error.message);
        // Fallback to showing the original image
        const reader = new FileReader();
        reader.onload = (e) => {
          setImageUrl(e.target.result);
          setIsEditingImage(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditingImage(false);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  // Function to handle course updates
  const handleLocalCourseUpdate = (updatedCourse) => {
    // Update the local state
    setTitle(updatedCourse.courseOutput.course.name);
    setDescription(updatedCourse.courseOutput.course.description);

    // Call the parent's update handler if provided
    if (onCourseUpdate) {
      // Make sure to include the courseBannerImage in the updated course data
      const courseWithBanner = {
        ...updatedCourse,
        courseBannerImage: imageUrl || updatedCourse.courseBannerImage || '/guide-book.png'
      };
      onCourseUpdate(courseWithBanner);
    }

    console.log('Course updated:', updatedCourse);
  };

  const handleSaveToDashboard = async () => {
    // Only allow saving if content has been fully generated
    if (!isContentGenerated) {
      alert('Please generate course content before saving to dashboard.');
      return;
    }

    setSavingToDashboard(true);
    try {
      const courseId = row?.courseId || row?.id;
      if (!courseId) throw new Error('Course ID not found');

      // ✅ Clean the data safely
      const cleanedCourseOutput = JSON.parse(
        JSON.stringify(courseOutput, (_, value) => {
          // Remove functions and undefined
          if (typeof value === 'function' || value === undefined) return undefined;
          // Convert Date objects to ISO
          if (value instanceof Date) return value.toISOString();
          return value;
        })
      );

      // ✅ Remove timestamps (Drizzle handles them)
      if (cleanedCourseOutput.createdAt) delete cleanedCourseOutput.createdAt;
      if (cleanedCourseOutput.updatedAt) delete cleanedCourseOutput.updatedAt;
      if (cleanedCourseOutput.course?.createdAt) delete cleanedCourseOutput.course.createdAt;
      if (cleanedCourseOutput.course?.updatedAt) delete cleanedCourseOutput.course.updatedAt;

      const payload = {
        courseId,
        courseData: {
          title,
          category,
          courseOutput: cleanedCourseOutput,
          description,
          courseBannerImage: imageUrl || row?.courseBannerImage || '/guide-book.png',
        },
      };

      const response = await fetch('/api/save-to-dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save course to dashboard');

      setSavedToDashboard(true);
      setIsPublic(true);
      alert('✅ Course saved to your dashboard and made public in Explore!');
    } catch (error) {
      console.error('Error saving course to dashboard:', error);
      alert('Failed to save course to dashboard. Please try again.\n\n' + error.message);
    } finally {
      setSavingToDashboard(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!course?.courseId) return;

    // Confirm deletion
    const confirmed = confirm(`Are you sure you want to delete the course "${title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/courses?courseId=${encodeURIComponent(course.courseId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.status} ${response.statusText}`);
      }

      // Redirect to dashboard after successful deletion
      router.push('/dashboard');
      alert('Course deleted successfully!');
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(`Error deleting course: ${error.message}`);
    }
  };

  if (!course) {
    return (
      <div className='p-10 border rounded-xl shadow-sm mt-5'>
        <p className='text-center text-sm text-gray-500'>Loading course data...</p>
      </div>
    )
  }

  return (
    <div className='p-10 border rounded-xl shadow-sm mt-5 bg-white'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div>
          <h2 className='font-bold text-3xl'>
            {title}
            {!isCourseSaved && (
              <EditCourseBasicInfo course={course} onCourseUpdate={handleLocalCourseUpdate} />
            )}
          </h2>
          <p className='text-sm text-gray-700 mt-3'>{description}</p>

          <div className="inline-flex items-center gap-3 mt-5 text-xl">
            <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-primary">
              <PencilSquareIcon />
            </div>
            <div className="text-m font-medium text-primary">{category}</div>
          </div>

          {/* Only show Save to Dashboard button for fully generated courses */}
          {isContentGenerated && !isCourseSaved && (
            <div className="flex flex-col gap-3 mt-5">
              <Button
                className='w-full'
                onClick={handleSaveToDashboard}
                disabled={savingToDashboard || savedToDashboard}
                variant={savedToDashboard ? "outline" : "default"}
              >
                {savingToDashboard ? 'Saving...' : savedToDashboard ? 'Saved to Dashboard' : 'Save to Dashboard'}
              </Button>
            </div>
          )}

          {isCourseSaved && (
            <p className='text-xs text-gray-500 mt-5 text-center'>
              This course is already saved to your dashboard
            </p>
          )}

          {!isContentGenerated && !isCourseSaved && (
            <p className='text-xs text-gray-500 mt-5 text-center'>
              Please generate course content before saving to dashboard
            </p>
          )}
        </div>
        <div className='w-full rounded-xl h-[300px] overflow-hidden'>
          {loadingImage ? (
            <div className='w-full h-full flex items-center justify-center bg-gray-100'>
              <p>Generating thumbnail...</p>
            </div>
          ) : isEditingImage ? (
            <div className='w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4'>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <p className='mb-4 text-gray-600'>Select an image from your device</p>
              <Button onClick={triggerFileSelect} variant="outline" className="mb-4">
                Choose File
              </Button>
              <div className="flex gap-2">
                <Button onClick={handleCancelEdit} variant="outline">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="relative w-full pt-[56.25%] group"> {/* 16:9 aspect ratio (9/16 = 0.5625) */}
              <Image
                src={imageUrl || '/guide-book.png'}
                alt="Course Banner"
                fill
                className="object-cover rounded-xl"
                unoptimized={true}
              />
              {!isCourseSaved && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleEditImageClick}
                      className="bg-white text-black hover:bg-gray-200"
                    >
                      Edit Thumbnail
                    </Button>
                    {/* Show delete button only if user has uploaded a custom image */}
                    {imageUrl && aiGeneratedImageUrl && imageUrl !== aiGeneratedImageUrl && imageUrl !== '/guide-book.png' && (
                      <Button
                        onClick={handleDeleteImage}
                        variant="outline"
                        className="bg-white text-black hover:bg-gray-200 border-white"
                      >
                        Delete & Revert to AI Image
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseContentInfo;