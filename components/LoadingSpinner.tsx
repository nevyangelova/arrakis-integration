import React from 'react';

export default function LoadingSpinner() {
    return (
        <div className='flex justify-center items-center py-12 w-full'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
            <span className='ml-3 text-gray-700'>Loading...</span>
        </div>
    );
}
