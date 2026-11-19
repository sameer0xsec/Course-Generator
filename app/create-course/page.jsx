'use client';

import React, { useEffect, useState, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Cog6ToothIcon, LightBulbIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import SelectCategory from './_components/SelectCategory';
import TopicDescription from './_components/TopicDescription';
import SelectOption from './_components/SelectOption';
import { UserInputContext } from '../_context/UserInputContext';
import LoadingDialog from './_components/LoadingDialog';
import { CourseList } from '@/configs/schema';
import { GenerateCourseLayout_AI } from '@/configs/AiModel';
import { v4 as uuidv4 } from 'uuid'; // Correct import for uuid
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { validateCourseDuration, adjustChapterDurations } from '@/lib/duration-utils'; // Import duration utilities

function CreateCourse() {
  const Stepper = [
    { id: 1, name: 'Category', icon: <Cog6ToothIcon /> },
    { id: 2, name: 'Topic and Desc', icon: <LightBulbIcon /> },
    { id: 3, name: 'Options', icon: <DocumentCheckIcon /> }
  ];

  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useUser();
  const router = useRouter();
  const [courseCount, setCourseCount] = useState(0);
  const [loadingCourseCount, setLoadingCourseCount] = useState(true);

  // Fetch user's course count on component mount
  useEffect(() => {
    const fetchCourseCount = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoadingCourseCount(false);
        return;
      }

      try {
        const userId = user.id ? `userId=${encodeURIComponent(user.id)}&` : '';
        const email = user.primaryEmailAddress?.emailAddress ? `email=${encodeURIComponent(user.primaryEmailAddress.emailAddress)}` : '';
        const response = await fetch(`/api/user-courses?${userId}${email}`);
        if (response.ok) {
          const data = await response.json();
          setCourseCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching course count:', error);
      } finally {
        setLoadingCourseCount(false);
      }
    };

    fetchCourseCount();
  }, [user]);

  useEffect(() => {
    console.log(userCourseInput);
  }, [userCourseInput])

  const checkStatus = () => {
    if (userCourseInput?.length == 0) {
      return true;
    }
    if (activeIndex == 0 && (userCourseInput?.category?.length == 0 || userCourseInput?.category == undefined)) {
      return true;
    }
    if (activeIndex == 1 && (userCourseInput?.topic?.length == 0 || userCourseInput?.topic == undefined)) {
      return true;
    }
    else if (activeIndex == 2 && (userCourseInput?.level == undefined || userCourseInput?.duration == undefined || userCourseInput?.displayVideo == undefined || userCourseInput?.noOfChapters == undefined)) {
      return true;
    }
    return false;
  }

  const GenerateCourseLayout = async () => {
    // Removed course limit check - allow unlimited courses for all users
    setLoading(true);

    try {
      console.log("Generating course layout with Gemini...");
      const result = await GenerateCourseLayout_AI.sendMessage(FINAL_PROMPT);
      const response = await result.response;
      const textResponse = await response.text();
      console.log("Raw AI Response:", textResponse);

      if (!textResponse) {
        throw new Error("Empty response from AI");
      }

      // Clean up the response in case it has markdown code block formatting
      let cleanedResponse = textResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.substring(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.substring(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.substring(0, cleanedResponse.length - 3);
      }
      cleanedResponse = cleanedResponse.trim();

      console.log("Cleaned AI Response:", cleanedResponse);

      // Parse JSON safely
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new Error(`Failed to parse AI response as JSON: ${parseError.message}. Response: ${cleanedResponse}`);
      }

      console.log("Parsed Response:", parsedResponse);

        // Check if the response has the expected structure
        // Handle case where AI returns an array of courses instead of an object
        if (Array.isArray(parsedResponse) && parsedResponse.length > 0) {
          console.log("AI returned an array response, using first element");
          // Use the first course in the array
          if (parsedResponse[0].course) {
            parsedResponse = parsedResponse[0];
          } else {
            // If first element doesn't have course property, try to use it directly
            parsedResponse = { course: parsedResponse[0] };
          }
        }

        if (!parsedResponse.course) {
          console.error("AI response does not have expected structure:", parsedResponse);

          // Try to extract course information from other possible locations
          let courseData = null;
          if (parsedResponse.name && parsedResponse.description) {
            courseData = {
              name: parsedResponse.name,
              description: parsedResponse.description,
              chapters: parsedResponse.chapters || []
            };
          } else if (parsedResponse.title && parsedResponse.desc) {
            courseData = {
              name: parsedResponse.title,
              description: parsedResponse.desc,
              chapters: parsedResponse.chapters || []
            };
          }

          if (courseData) {
            console.log("Extracted course data from alternative structure:", courseData);
            parsedResponse.course = courseData;
          } else {
            throw new Error("AI response does not have expected structure. Missing 'course' property. Response: " + JSON.stringify(parsedResponse, null, 2));
          }
        }

        // Validate that the course object has the required properties
        if (!parsedResponse.course.name || !parsedResponse.course.description) {
          console.warn("Course object missing required properties:", parsedResponse.course);
          // Try to fix missing properties
          if (!parsedResponse.course.name && parsedResponse.course.title) {
            parsedResponse.course.name = parsedResponse.course.title;
          } else if (!parsedResponse.course.name) {
            parsedResponse.course.name = userCourseInput?.topic || 'Untitled Course';
          }

          if (!parsedResponse.course.description && parsedResponse.course.desc) {
            parsedResponse.course.description = parsedResponse.course.desc;
          } else if (!parsedResponse.course.description) {
            parsedResponse.course.description = `A comprehensive course about ${userCourseInput?.topic || 'the subject'}.`;
          }
        }

        // Ensure chapters is always an array, even if empty
        if (!Array.isArray(parsedResponse.course.chapters)) {
          console.warn("AI response chapters is not an array:", parsedResponse.course.chapters);
          // If chapters is not an array, try to extract it from other possible locations
          let chapters = [];
          if (parsedResponse.chapters && Array.isArray(parsedResponse.chapters)) {
            chapters = parsedResponse.chapters;
          } else if (parsedResponse.course && parsedResponse.course.chapters) {
            // If it's a single chapter object, wrap it in an array
            if (typeof parsedResponse.course.chapters === 'object' && parsedResponse.course.chapters !== null) {
              chapters = [parsedResponse.course.chapters];
            } else {
              chapters = [parsedResponse.course.chapters];
            }
          }
          parsedResponse.course.chapters = chapters;
        }

        // Validate each chapter has required properties
        if (Array.isArray(parsedResponse.course.chapters)) {
          parsedResponse.course.chapters = parsedResponse.course.chapters.map((chapter, index) => {
            // Ensure each chapter has required properties
            if (!chapter.name) {
              chapter.name = `Chapter ${index + 1}`;
            }
            if (!chapter.about) {
              chapter.about = `Content for ${chapter.name}`;
            }
            if (!chapter.duration) {
              chapter.duration = "10 minutes";
            }
            return chapter;
          });
        }

        // If no chapters were generated but we need some for the course, generate default chapters
        if (!parsedResponse.course.chapters || parsedResponse.course.chapters.length === 0) {
          console.log("No chapters generated, creating default chapters");
          // Create default chapters based on the course topic
          const topic = userCourseInput?.topic || 'Course';
          parsedResponse.course.chapters = [
            {
              name: `Introduction to ${topic}`,
              about: `Learn the fundamentals of ${topic}`,
              duration: "10 minutes",
              content: `This chapter provides an overview of ${topic} and introduces key concepts that will be covered throughout the course.`
            },
            {
              name: `Core Concepts of ${topic}`,
              about: `Deep dive into the essential principles of ${topic}`,
              duration: "20 minutes",
              content: `In this chapter, we'll explore the core concepts of ${topic} in detail, providing practical examples and exercises to reinforce learning.`
            },
            {
              name: `Advanced Topics in ${topic}`,
              about: `Explore advanced techniques and applications`,
              duration: "25 minutes",
              content: `This chapter covers advanced topics in ${topic}, including best practices, common pitfalls, and real-world applications.`
            },
            {
              name: `Conclusion and Next Steps`,
              about: `Review key takeaways and plan your continued learning`,
              duration: "5 minutes",
              content: `In this final chapter, we'll review the key concepts covered in the course and provide guidance on next steps for continued learning in ${topic}.`
            }
          ];
        }

        console.log("Final parsed response with chapters:", parsedResponse);

        // Validate and adjust course duration based on user preference
        if (userCourseInput?.duration && parsedResponse.course?.chapters) {
          console.log("Validating course duration against user preference:", userCourseInput.duration);

          const validation = validateCourseDuration(parsedResponse.course.chapters, userCourseInput.duration);
          console.log("Duration validation result:", validation);

          if (!validation.isValid) {
            console.warn("Course duration does not match user preference:", validation.message);
            // Optionally adjust durations to better match user preference
            parsedResponse.course.chapters = adjustChapterDurations(parsedResponse.course.chapters, userCourseInput.duration);
            console.log("Adjusted chapter durations to better match user preference");
          }
        }

        // Save course layout in DB
        await SaveCourseLayoutInDb(parsedResponse);
    } catch (error) {
      console.error('Error generating course layout:', error);

      // Check if this is a rate limit error with more comprehensive detection
      const isQuotaError = error.message.includes('quota') ||
        error.message.includes('429') ||
        error.message.includes('exceeded') ||
        error.message.includes('limit') ||
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('rate');

      if (isQuotaError) {
        console.error('Quota error detected in course creation:', {
          message: error.message,
          name: error.name,
          code: error.code,
          status: error.status
        });
        alert('You have exceeded your AI API quota. Please check that you are using a valid API key and wait a few minutes before trying again, or consider upgrading your API plan.');
      } else {
        // Display error to user
        alert(`Error generating course: ${error.message}`);
      }

      setLoading(false);
    }
  };

  const SaveCourseLayoutInDb = async (courseLayout) => {
    try {
      var id = uuidv4(); // Use the correct uuid function
      console.log("Saving course layout:", courseLayout);
      // Send the course payload to a server API route that performs the DB write.
      const payload = {
        courseId: id,
        name: userCourseInput?.topic,
        level: userCourseInput?.level,
        category: userCourseInput?.category,
        duration: userCourseInput?.duration,
        includeVideo: userCourseInput?.displayVideo || 'No',
        courseOutput: courseLayout,
        createdBy: user?.id, // Use Clerk user ID instead of email for admin checks
        createdByEmail: user?.primaryEmailAddress?.emailAddress, // Keep email for reference
        ...(user?.fullName && { userName: user?.fullName }),
        ...(user?.imageUrl && { userProfileImage: user?.imageUrl })
      };

      console.log("Payload being sent to API:", payload);

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("API Error Response:", {
          status: res.status,
          statusText: res.statusText,
          responseBody: text
        });

        // Parse the error response
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Server save failed: ${res.status} ${text}`);
        }

        // Removed course limit error check
        throw new Error(`Server save failed: ${errorData.error || text}`);
      }

      const result = await res.json();
      console.log('Course saved to database:', result);

      // Update course count after successful save
      setCourseCount(prevCount => prevCount + 1);
    } catch (error) {
      console.error("Error saving course to database:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      alert(`Error saving course to database: ${error.message}`);
    } finally {
      setLoading(false);
      router.replace('/create-course/' + id);
    }
  }

  const handleNext = () => {
    if (activeIndex < Stepper.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  // Show loading state while checking course count
  if (loadingCourseCount) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Removed course limit restriction - allow all users to create unlimited courses
  return (
    <div className="flex flex-col justify-center items-center p-6">
      {/* Stepper Section */
      }
      <h2 className="text-4xl text-primary font-semibold mb-10">Create Course</h2>

      {/* Course count indicator - removed limit reference */}
      <div className="mb-4 text-sm text-gray-600">
        Courses created: {courseCount}
      </div>

      <div className="flex items-center">
        {Stepper.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center w-[60px] md:w-[100px]">
              <div
                className={`p-3 rounded-full text-xl transition-all duration-300 ${activeIndex >= index
                  ? 'bg-primary text-white shadow-md scale-110'
                  : 'bg-gray-200 text-gray-500'}`}
              >
                {item.icon}
              </div>
              <h2
                className={`hidden md:block mt-2 text-sm ${activeIndex >= index ? 'text-primary font-medium' : 'text-gray-400'}`}
              >
                {item.name}
              </h2>
            </div>

            {/* Connector Line */}
            {index !== Stepper.length - 1 && (
              <div
                className={`h-1 w-[50px] md:w-[100px] lg:w-[170px] rounded-full transition-all duration-300 ${activeIndex > index ? 'bg-primary' : 'bg-gray-300'}`}
              ></div>
            )}
          </div>
        ))}
      </div>


      <div className='px-10 md:px-20 lg:px-44 mt-10 '>
        {activeIndex === 0 ? <SelectCategory /> :
          activeIndex == 1 ? <TopicDescription /> :
            <SelectOption />}

        {/* Navigation Buttons */}
        <div className="mt-10 flex justify-between w-full max-w-[600px] mx-auto">
          {/* Previous Button - Left */}
          <Button
            variant="outline"
            disabled={activeIndex === 0}
            onClick={handlePrev}
            className="min-w-[120px]"
          >
            Previous
          </Button>

          {/* Next / Generate Course Button - Right */}
          {activeIndex < 2 && (
            <Button onClick={handleNext} className="min-w-[150px]" disabled={checkStatus()}>
              Next
            </Button>
          )}

          {activeIndex === 2 && (
            <Button className="min-w-[150px]" disabled={checkStatus()} onClick={() => GenerateCourseLayout()}>
              Generate Course Layout
            </Button>
          )}
        </div>
        <LoadingDialog loading={loading} />

      </div>

    </div>
  );
}

export default CreateCourse;