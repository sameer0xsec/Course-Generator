import React, { useContext } from 'react'
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { UserInputContext } from '@/app/_context/UserInputContext';

function TopicDescription() {

  const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);

  const handleInputChange=(fieldName, value)=>{
    setUserCourseInput(prev=>({
      ...prev,
      [fieldName]:value
    }))
  }

  return (
    <div className="mx-auto mt-8 flex flex-col items-center">
      {/* Input Topic */}
      <div className="w-full max-w-[650px] mt-5">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Write the topic for which you want to generate a course
          <span className="text-gray-500"> (e.g., Python Course, Yoga, etc.)</span>:
        </label>
        <Input
          placeholder="Enter Course Title"
          className="w-full border rounded-md p-2 text-gray-700 focus:outline-none"
          defaultValue={userCourseInput?.topic}
          onChange={(e)=>handleInputChange('topic', e.target.value)}
        />
      </div>

      {/* Course Description */}
      <div className="w-full max-w-[650px] mt-8">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Tell us more about your course (optional)
        </label>
        <Textarea
          placeholder="About your Course"
          className="w-full border rounded-md p-2 text-gray-700 focus:outline-none min-h-[120px]"
          defaultValue={userCourseInput?.description}
          onChange={(e)=>handleInputChange('description', e.target.value)}
        />
      </div>
    </div>
  )
}

export default TopicDescription
