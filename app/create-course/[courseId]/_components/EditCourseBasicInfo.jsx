import React, { useState } from 'react'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

function EditCourseBasicInfo({ course, onCourseUpdate }) {
    // Extract course data
    const courseObj = course?.courseOutput?.course || course?.course || {};
    const title = courseObj?.name || courseObj?.title || 'Untitled Course';
    const description = courseObj?.description || courseObj?.desc || 'No description provided';

    const [editedTitle, setEditedTitle] = useState(title);
    const [editedDescription, setEditedDescription] = useState(description);

    const handleUpdate = () => {
        // In a real implementation, this would call an API to update the course
        if (onCourseUpdate) {
            onCourseUpdate({
                ...course,
                courseOutput: {
                    ...course.courseOutput,
                    course: {
                        ...courseObj,
                        name: editedTitle,
                        description: editedDescription
                    }
                }
            });
        }
        // For now, we'll just show an alert
        alert('Course updated successfully!');
    };

    return (
        <Dialog>
            <DialogTrigger><PencilSquareIcon /></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Course Title & Description</DialogTitle>
                    <DialogDescription>
                        Make changes to your course title and description here.
                    </DialogDescription>
                </DialogHeader>

                <div className='grid gap-4 py-4'>
                    <div className='mt-3'>
                        <label className='block mb-2 font-medium'>Course Title</label>
                        <Input
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                        />
                    </div>
                    <div className='mt-3'>
                        <label className='block mb-2 font-medium'>
                            Description
                        </label>
                        <Textarea
                            value={editedDescription}
                            onChange={(e) => setEditedDescription(e.target.value)}
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button onClick={handleUpdate}>
                            Update
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    )
}

export default EditCourseBasicInfo