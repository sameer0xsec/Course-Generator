import React from 'react'
import { ChartBarIcon, ClockIcon, BookOpenIcon, PlayCircleIcon } from '@heroicons/react/24/outline';

function CourseDetail({ course }) {
  // pick first item if an array was passed — guard empty arrays
  const item = Array.isArray(course) ? (course[0] ?? {}) : (course ?? {});

  // safe JSON parse helper
  const tryParse = (v) => {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return v; }
  };

  // resolve possible nested courseOutput / course shapes
  const parsedCourseOutput = tryParse(item?.courseOutput);
  const parsedRowCourse = tryParse(item?.course);

  // chapters may live in courseOutput.chapters, course.chapters, or top-level chapters
  // The courseOutput might be directly the course object or nested inside a course property
  let courseData = parsedCourseOutput?.course ?? parsedCourseOutput ?? parsedRowCourse?.course ?? parsedRowCourse ?? item?.course ?? item;
  let chapters = courseData?.chapters ?? [];
  // normalize chapters: if stringified JSON or individual chapter strings, parse each
  chapters = Array.isArray(chapters) ? chapters.map(ch => tryParse(ch) ?? ch) : [];

  // derive skill level
  const level =
    item?.level ??
    'N/A';

  // includeVideo flag - look in the correct places
  const includeVideo = item?.includeVideo ?? 'No';

  // parse a duration string/number into minutes
  const parseDurationToMinutes = (d) => {
    if (d == null) return 0;
    if (typeof d === 'number') return Math.round(d);
    const s = String(d).toLowerCase();
    const m = s.match(/[\d.]+/);
    if (!m) return 0;
    const n = parseFloat(m[0]);
    if (s.includes('hour')) return Math.round(n * 60);
    if (s.includes('min')) return Math.round(n);
    // fallback assume minutes
    return Math.round(n);
  };

  const totalMinutes = chapters.reduce((sum, ch) => {
    if (!ch) return sum;
    // chapter may have duration in different keys
    const dur = ch?.duration ?? ch?.time ?? ch?.about?.duration ?? ch;
    return sum + parseDurationToMinutes(dur);
  }, 0);

  const formatMinutes = (mins) => {
    if (!mins) return '0 min';
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins} min`;
  };

  const chaptersCount = Array.isArray(chapters) ? chapters.length : 0;

  return (
    <div className='border p-6 rounded-xl shadow-sm mt-3 mb-20'>
      <div className='grid grid-cols-2 md:grid-cols-4 gap-5'>
        <div className='flex gap-3 items-center'>
          <ChartBarIcon className='text-primary w-6 h-6' />
          <div>
            <div className='text-xs text-gray-500'>Skill Level</div>
            <div className='font-medium text-lg'>{level}</div>
          </div>
        </div>

        <div className='flex gap-3 items-center'>
          <ClockIcon className='text-primary w-6 h-6' />
          <div>
            <div className='text-xs text-gray-500'>Total Duration</div>
            <div className='font-medium text-lg'>{formatMinutes(totalMinutes)}</div>
          </div>
        </div>

        <div className='flex gap-3 items-center'>
          <BookOpenIcon className='text-primary w-6 h-6' />
          <div>
            <div className='text-xs text-gray-500'>No of Chapters</div>
            <div className='font-medium text-lg'>{chaptersCount}</div>
          </div>
        </div>

        <div className='flex gap-3 items-center'>
          <PlayCircleIcon className='text-primary w-6 h-6' />
          <div>
            <div className='text-xs text-gray-500'>Video Included?</div>
            <div className='font-medium text-lg'>{String(includeVideo)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail