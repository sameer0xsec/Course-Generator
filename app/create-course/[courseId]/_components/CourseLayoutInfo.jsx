'use client'

import Image from 'next/image'
import React, { useState, useEffect, useRef, useMemo } from 'react'
import { PencilSquareIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import EditCourseBasicInfo from './EditCourseBasicInfo';
import { resizeImage, cropAndResizeImage } from '@/lib/imageUtils';

function CourseLayoutInfo({ course, onCourseUpdate }) {
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

  // Check if the course is already saved to dashboard (public)
  const isCourseSaved = row?.isPublic ?? false;

  // Create a stable string representation of course for dependency array
  const courseString = useMemo(() => JSON.stringify({ title, category }), [title, category]);

  // Generate course thumbnail when component mounts
  useEffect(() => {
    // If we already have a banner image from the DB, use it
    if (course?.courseBannerImage) {
      console.log("Using existing banner image:", course.courseBannerImage);
      setImageUrl(course.courseBannerImage);
      setAiGeneratedImageUrl(course.courseBannerImage);
      return;
    }

    // If we already generated one locally in this session, don't regenerate
    if (imageUrl) {
      return;
    }

    // Otherwise generate a new one
    const generateThumbnail = async () => {
      const currentCourse = JSON.parse(courseString);

      // Validate before calling API
      if (!currentCourse.title || !currentCourse.category || currentCourse.title === 'Untitled Course') {
        console.log('Skipping generation: Missing valid title/category');
        return;
      }

      console.log('Generating thumbnail for:', currentCourse);
      setLoadingImage(true);
      setImageError(null);

      try {
        // Call generation API
        const response = await fetch('/api/image-generation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseTitle: currentCourse.title,
            category: currentCourse.category,
          }),
        });

        const data = await response.json();

        if (data.imageUrl) {
          console.log("Generated Image URL:", data.imageUrl);
          setImageUrl(data.imageUrl);
          setAiGeneratedImageUrl(data.imageUrl);

          // IMPORTANT: We should ideally save this to the DB immediately so it persists
          // Calling onCourseUpdate if available to bubble up the change
          if (onCourseUpdate) {
            onCourseUpdate({ ...course, courseBannerImage: data.imageUrl });
          }
        } else {
          console.warn("No image URL in response");
          setImageUrl('/placeholder.jpg');
        }

      } catch (error) {
        console.error('Error generating course thumbnail:', error);
        setImageError(error.message);
        setImageUrl('/placeholder.jpg');
      } finally {
        setLoadingImage(false);
      }
    };

    generateThumbnail();

  }, [courseString, course?.courseBannerImage]); // Only re-run if course basic info or DB image changes



  const handleEditImageClick = () => {
    setIsEditingImage(true);
  };

  const handleDeleteImage = () => {
    // Revert to AI generated image if available, otherwise use placeholder
    if (aiGeneratedImageUrl) {
      setImageUrl(aiGeneratedImageUrl);
    } else {
      setImageUrl('/placeholder.jpg');
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

        // Propagate the change to parent and DB
        if (onCourseUpdate && course) {
          const updatedCourse = {
            ...course,
            courseBannerImage: croppedImage
          };
          onCourseUpdate(updatedCourse);
        }
      } catch (error) {
        console.error('Error cropping and resizing image:', error);
        setImageError('Failed to process image: ' + error.message);
        // Fallback to showing the original image
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target.result;
          setImageUrl(result);
          setIsEditingImage(false);

          // Propagate the change to parent and DB
          if (onCourseUpdate && course) {
            const updatedCourse = {
              ...course,
              courseBannerImage: result
            };
            onCourseUpdate(updatedCourse);
          }
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
        courseBannerImage: imageUrl || updatedCourse.courseBannerImage || '/placeholder.jpg'
      };
      onCourseUpdate(courseWithBanner);
    }

    console.log('Course updated:', updatedCourse);
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
              <BookOpenIcon />
            </div>
            <div className="text-m font-medium text-primary">{category}</div>
          </div>

          {!isCourseSaved && (
            <p className='text-xs text-gray-500 mt-5 text-center'>
              Click "Generate Course Content" to create your course
            </p>
          )}
        </div>
        <div className='w-full max-w-sm rounded-xl overflow-hidden'>
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
              <div className="flex flex-col items-center">
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
            </div>
          ) : (
            <div className="relative w-full pt-[56.25%] group"> {/* 16:9 aspect ratio (9/16 = 0.5625) */}
              <Image
                src={imageUrl || '/placeholder.jpg'}
                alt="Course Banner"
                fill
                className="object-contain rounded-xl bg-gray-100"
                unoptimized={true}
                onError={() => {
                  console.warn("Image load failed, falling back to placeholder");
                  setImageUrl('/placeholder.jpg');
                }}
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
                    {imageUrl && aiGeneratedImageUrl && imageUrl !== aiGeneratedImageUrl && imageUrl !== '/placeholder.jpg' && (
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

export default CourseLayoutInfo;