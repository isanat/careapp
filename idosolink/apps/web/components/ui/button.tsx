import { ButtonHTMLAttributes } from 'react';

export const Button = ({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      {...props}
      className={`rounded-full bg-accent px-6 py-2 text-slate-900 font-semibold transition hover:opacity-90 ${className}`}
    />
  );
};
