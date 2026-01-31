import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

export const Button = ({
  className = '',
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) => {
  const styles = {
    primary: 'bg-primary text-white hover:bg-[#255a58]',
    secondary: 'bg-secondary text-white hover:bg-[#5b9994]',
    ghost: 'bg-transparent text-primary border border-primary hover:bg-accent/40'
  };

  return (
    <button
      {...props}
      className={`button-base ${styles[variant]} ${className}`}
    />
  );
};
