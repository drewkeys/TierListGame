import { type ReactNode } from 'react';
import './Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'magenta' | 'ghost';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  title?: string;
}

export function Button({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  title,
}: ButtonProps) {
  const variantClass = variant !== 'default' ? `btn--${variant}` : '';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} ${className}`.trim()}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      title={title}
    >
      {children}
    </button>
  );
}
