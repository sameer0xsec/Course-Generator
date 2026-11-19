'use client'
import React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Image from 'next/image'

function LoadingDialog({loading}) {
    return (
        <AlertDialog open={loading}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="sr-only">Loading Course Generation</AlertDialogTitle>
                    <div>
                        <div className='flex flex-col items-center py-10'>
                            <Image src={'/Loader.gif'} width={100} height={100} alt="Loading" />
                            <h2 className="text-lg font-medium">Please wait… AI is working on your course</h2>
                        </div>
                    </div>
                </AlertDialogHeader>

            </AlertDialogContent>
        </AlertDialog>
    )
}

export default LoadingDialog