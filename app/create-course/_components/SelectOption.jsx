import React, { useContext } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from '@/components/ui/input'
import { UserInputContext } from '@/app/_context/UserInputContext';

function SelectOption() {

    const { userCourseInput, setUserCourseInput } = useContext(UserInputContext);
    
      const handleInputChange=(fieldName, value)=>{
        setUserCourseInput(prev=>({
          ...prev,
          [fieldName]:value
        }))
      }

    return (
        <div className='px-10 md:px-20 lg:px-44'>
            {/* make grid responsive: single column on small screens, two columns on md+ */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                <div>
                    <label className='text-sm'>Difficulty Level</label>
                    <Select onValueChange={(value)=>handleInputChange('level', value)}
                        defaultValue={userCourseInput?.level}>
                        {/* make select trigger responsive */}
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className='text-sm'>Course Duration</label>
                    <Select onValueChange={(value)=>handleInputChange('duration', value)}
                        defaultValue={userCourseInput?.duration}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1 Hour">1 Hour</SelectItem>
                            <SelectItem value="2 Hours">2 Hours</SelectItem>
                            <SelectItem value="More than 3 Hours">More than 3 Hours</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className='text-sm'>Include Videos</label>
                    <Select onValueChange={(value)=>handleInputChange('displayVideo', value)}
                        defaultValue={userCourseInput?.displayVideo}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className='text-sm' >Add Number of Chapters</label>
                    <Input
                      type="number"
                      className="text-lg w-full"
                      // controlled value so it can be updated properly
                      value={userCourseInput?.noOfChapters ?? ""}
                      onChange={(event)=>handleInputChange('noOfChapters', event.target.value)}
                      min={0}
                    />
                </div>

            </div>
        </div>
    )
}
 
export default SelectOption