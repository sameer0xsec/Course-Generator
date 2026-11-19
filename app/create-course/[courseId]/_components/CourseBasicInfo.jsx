import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { HiMiniPuzzlePiece } from "react-icons/hi2";
import EditCourseBasicInfo from './EditCourseBasicInfo';
import Image from 'next/image';
import { cropAndResizeImage } from '@/lib/imageUtils';
import { useUser } from '@clerk/nextjs';

function CourseBasicInfo({ course, onCourseUpdate }) {
  const { user } = useUser();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('/guide-book.png');
  const [loadingImage, setLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [aiGeneratedImageUrl, setAiGeneratedImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const courseString = useMemo(() => JSON.stringify({ title, category }), [title, category]);

  // Initialize state from course data
  useEffect(() => {
    if (course) {
      setTitle(course.courseOutput?.course?.name || course.name || '');
      setDescription(course.courseOutput?.course?.description || course.description || '');
      setCategory(course.category || '');
      
      // Set image URL from course data
      const courseBannerImage = course.courseOutput?.course?.courseBannerImage || course.courseBannerImage;
      if (courseBannerImage) {
        setImageUrl(courseBannerImage);
        setAiGeneratedImageUrl(courseBannerImage);
      }
    }
  }, [course]);

  // Generate AI thumbnail when title or category changes
  useEffect(() => {
    const generateThumbnail = async () => {
      const currentCourse = JSON.parse(courseString);
      // Don't set placeholder immediately, keep existing image
      setAiGeneratedImageUrl(null);
      setImageError(null);

      if (!currentCourse.title || !currentCourse.category) {
        return;
      }

      setLoadingImage(true);
      try {
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

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate image');

        setImageUrl(data.imageUrl);
        setAiGeneratedImageUrl(data.imageUrl);
      } catch (error) {
        console.error('Error generating AI thumbnail:', error);
        // Only set placeholder if we don't have any image
        if (!imageUrl || imageUrl === '/guide-book.png') {
          setImageUrl('/guide-book.png');
          setAiGeneratedImageUrl('/guide-book.png');
        }
      } finally {
        setLoadingImage(false);
      }
    };

    // Generate if we don't already have a proper image
    if (!imageUrl || imageUrl === '/guide-book.png') {
      generateThumbnail();
    }
  }, [courseString, imageUrl]);

  const handleEditImageClick = () => {
    setIsEditingImage(true);
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
        // Resize the image to fit within 16:9 aspect ratio (1600x900)
        const resizedImage = await cropAndResizeImage(file, 1600, 900);
        setImageUrl(resizedImage);
        setIsEditingImage(false);
        setImageError(null);
      } catch (error) {
        console.error('Error resizing image:', error);
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
  const handleCourseUpdate = (updatedCourse) => {
    // Update the local state
    setTitle(updatedCourse.courseOutput.course.name);
    setDescription(updatedCourse.courseOutput.course.description);
    
    // In a real implementation, this would also update the database
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

                    <h2 className='font-bold text-3xl'>{title} <EditCourseBasicInfo course={course} onCourseUpdate={handleCourseUpdate}/></h2>
                    <p className='text-sm text-gray-700 mt-3'>{description}</p>

                    <div className="inline-flex items-center gap-3 mt-5 text-xl">
                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-primary">
                            <HiMiniPuzzlePiece />
                        </div>
                        <div className="text-m font-medium text-primary">{category}</div>
                    </div>                    
                    <div className="flex flex-col gap-3 mt-5">
                      <Button className='w-full' onClick={() => {
                        // Scroll to the chapters section
                        const chaptersSection = document.getElementById('chapters-section');
                        if (chaptersSection) {
                          chaptersSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}>
                          Start Learning
                      </Button>
                      {/* Save to Dashboard button removed as per requirements - only fully generated courses should be saved */}
                    </div>
                    <p className='text-xs text-gray-500 mt-2 text-center'>
                      Click above to begin reading Chapter 1 and start your learning journey
                    </p>
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
                        fill
                        alt="Course thumbnail" 
                        className='object-cover' 
                        unoptimized={true}
                      />
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
                              onClick={() => {
                                // Revert to AI generated image
                                setImageUrl(aiGeneratedImageUrl);
                              }}
                              variant="outline"
                              className="bg-white text-black hover:bg-gray-200 border-white"
                            >
                              Delete & Revert to AI Image
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {imageError && (
                    <p className='text-xs text-red-500 mt-1'>Error: {imageError}</p>
                  )}
                </div>
            </div>
        </div>
  );
}

export default CourseBasicInfo;