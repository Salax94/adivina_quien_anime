import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && <label className="text-sm font-medium opacity-80">{label}</label>}
            <input
                className={cn(
                    'w-full bg-[var(--card-bg)] border border-white/10 rounded-[var(--border-radius)] px-4 py-3 outline-none focus:border-[var(--accent-color)] transition-all placeholder:opacity-40',
                    className
                )}
                {...props}
            />
        </div>
    );
};
