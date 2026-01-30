import { InputHTMLAttributes } from 'react';

export const Input = ({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      {...props}
      className={`w-full rounded-lg bg-background border border-white/10 px-4 py-3 ${className}`}
    />
  );
};
