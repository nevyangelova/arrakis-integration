'use client';

import React from 'react';

interface InputProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onMax: () => void;
    balanceDisplay: string;
    minDisplay: string;
    placeholder?: string;
}

export default function Input({
    label,
    value,
    onChange,
    onMax,
    balanceDisplay,
    minDisplay,
    placeholder = '0.0',
}: InputProps) {
    return (
        <div>
            <label className='block text-sm font-medium text-gray-700'>
                {label}
            </label>
            <div className='mt-1 flex rounded-md shadow-sm'>
                <input
                    type='number'
                    value={value}
                    onChange={onChange}
                    className='flex-1 border rounded-l-md p-2'
                    placeholder={placeholder}
                    min='0'
                    step='any'
                />
                <button
                    type='button'
                    onClick={onMax}
                    className='bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600'
                >
                    Max
                </button>
            </div>
            <div className='mt-1 flex justify-between text-sm text-gray-500'>
                <span>Balance: {balanceDisplay}</span>
                <span>Min: {minDisplay}</span>
            </div>
        </div>
    );
}
