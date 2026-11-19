"use client"
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import CourseLayoutInfo from "./_components/CourseLayoutInfo";
import CourseContentInfo from "./_components/CourseContentInfo";
import CourseDetail from "./_components/CourseDetail";
import ChapterList from "./_components/ChapterList";
import DashboardCourseView from "./_components/DashboardCourseView";

function CourseLayout() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseId = params?.courseId;
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contentGenerated, setContentGenerated] = useState(false);

  // Check if we're coming from the dashboard (view mode) or from course creation (edit mode)
  const viewMode = searchParams.get('view') === 'dashboard';

  useEffect(() => {
    if (!courseId) return;
    const abort = new AbortController();

    // simple unwrapping helper (no deep parsing)
    const unwrap = (json) => {
      if (!json) return null;
      if (json.ok && Array.isArray(json.rows)) return json.rows[0] ?? null;
      if (json.result && Array.isArray(json.result.rows)) return json.result.rows[0] ?? null;
      if (json.result && Array.isArray(json.result)) return json.result[0] ?? null;
      if (Array.isArray(json.rows)) return json.rows[0] ?? null;
      if (Array.isArray(json)) return json[0] ?? null;
      // otherwise return object as-is
      return json;
    };

    const fetchRow = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `/api/courses?courseId=${encodeURIComponent(courseId)}`;
        const res = await fetch(url, { signal: abort.signal });
        const text = await res.text();
        let parsed = null;
        try { parsed = text ? JSON.parse(text) : null } catch { parsed = text }

        console.log("API Response text:", text);
        console.log("Parsed API Response:", parsed);

        if (!res.ok) {
          setError(`Fetch failed: ${res.status}`);
          setRow(null);
          return;
        }

        const item = unwrap(parsed);
        console.log("Unwrapped item:", item);
        console.log("Course Output:", item?.courseOutput);
        console.log("Is Public:", item?.isPublic); // Debug: Log isPublic value
        setRow(item);

        // Check if content has been generated (chapters have detailed content)
        if (item?.courseOutput?.course?.chapters) {
          const chapters = item.courseOutput.course.chapters;
          const hasDetailedContent = Array.isArray(chapters) && chapters.some(chapter =>
            chapter?.content && chapter.content.length > 100
          );
          setContentGenerated(hasDetailedContent);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(String(e));
        setRow(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRow();
    return () => abort.abort();
  }, [courseId]);

  // Function to handle updates from child components
  const handleCourseUpdate = async (updatedCourse) => {
    console.log('Course update received:', updatedCourse);
    setRow(updatedCourse);

    // Save changes to database
    try {
      await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCourse)
      });
    } catch (e) {
      console.error("Failed to save course update:", e);
    }

    // Re-check if content has been generated
    if (updatedCourse?.courseOutput?.course?.chapters) {
      const chapters = updatedCourse.courseOutput.course.chapters;
      const hasDetailedContent = Array.isArray(chapters) && chapters.some(chapter =>
        chapter?.content && chapter.content.length > 100
      );
      setContentGenerated(hasDetailedContent);
    }
  };

  // Check if the course is already saved to dashboard (public)
  const isCourseSaved = row?.isPublic ?? false;
  console.log("Is course saved (isPublic):", isCourseSaved); // Debug: Log isCourseSaved value
  console.log("View mode:", viewMode); // Debug: Log view mode

  return (
    <div className="mt-10 px-7 md:px-20 lg:px-44">
      {/* Only show "Course Layout" heading during planning phase (not in view mode) */}
      {!viewMode && !contentGenerated && (
        <h2 className="font-bold text-center text-3xl text-primary mb-6">Course Layout</h2>
      )}

      {/* Basic Info */}
      <div className={!viewMode && !contentGenerated ? "mt-6" : ""}>
        {!courseId ? (
          <p className="text-sm text-gray-500">No courseId param found in route.</p>
        ) : loading ? (
          <p className="text-sm text-gray-500">Loading course {courseId}…</p>
        ) : error ? (
          <p className="text-sm text-red-500">Error: {error}</p>
        ) : row ? (
          // If in view mode (from dashboard), always show DashboardCourseView
          viewMode ? (
            <DashboardCourseView course={row} />
          ) : (
            // Otherwise, show editing views based on course state
            // Only show dashboard view if BOTH content is generated AND course is saved
            (isCourseSaved && contentGenerated) ? (
              <DashboardCourseView course={row} />
            ) : contentGenerated ? (
              <CourseContentInfo course={row} onCourseUpdate={handleCourseUpdate} />
            ) : (
              <CourseLayoutInfo course={row} onCourseUpdate={handleCourseUpdate} />
            )
          )
        ) : (
          <div className="text-sm text-gray-500">
            <p>No course data</p>
          </div>
        )}
      </div>

      {/* Course Detail - only show during planning phase (not in view mode) */}
      {/* Course Detail - only show during planning phase (not in view mode) */}
      {!viewMode && !contentGenerated && row && (
        <CourseDetail course={row ? (Array.isArray(row) ? row : [row]) : []} />
      )}

      {/* Chapters - only show during planning phase (not in view mode) */}
      {!viewMode && !contentGenerated && row && (
        <ChapterList course={row} onCourseUpdate={handleCourseUpdate} />
      )}
    </div>
  );
}

export default function CourseLayoutPage() {
  return (
    <Suspense fallback={<div className="mt-10 px-7 text-center text-gray-500">Loading course...</div>}>
      <CourseLayout />
    </Suspense>
  );
}