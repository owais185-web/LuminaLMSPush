import React from 'react';
import { LucideIcon } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: LucideIcon;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  icon: Icon,
  isLoading,
  size = 'md',
  ...props 
}) => {
  // Material 3: Fully rounded buttons (Pills)
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const sizeStyles = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3 text-base"
  };

  const variants = {
    // Google Blue: bg-blue-600 is close to #1a73e8
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
    // Tonal button
    secondary: "bg-blue-50 text-blue-900 hover:bg-blue-100 border border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-md",
    ghost: "text-slate-600 hover:bg-slate-100",
  };

  return (
    <button className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={18} />
      ) : null}
      {children}
    </button>
  );
};

// --- Card ---
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, action, noPadding = false }) => (
  // Material 3: Large rounded corners (rounded-3xl), flat or low elevation
  <div className={`bg-white rounded-[24px] border-none shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden ${className}`}>
    {(title || action) && (
      <div className="px-6 py-5 flex justify-between items-center">
        {title && <h3 className="text-xl font-normal text-[#1f1f1f]">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    <div className={noPadding ? '' : 'p-6 pt-2'}>{children}</div>
  </div>
);

// --- Skeleton ---
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 rounded-xl ${className}`} />
);

// --- Badge ---
export const Badge: React.FC<{ children: React.ReactNode; color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' }> = ({ children, color = 'blue' }) => {
  // Material 3: Badges are usually tonal
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

// --- Input Field with Helper ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export const InputField: React.FC<InputProps> = ({ label, helperText, error, className = '', ...props }) => (
  <div className="mb-5 group">
    <div className="relative">
      <input 
        className={`peer w-full px-4 py-3 border border-slate-300 rounded-lg text-base placeholder-transparent focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all bg-white ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''} ${className}`}
        placeholder={label}
        {...props} 
      />
      <label 
        className={`absolute left-3 -top-2.5 bg-white px-1 text-xs text-slate-500 transition-all 
        peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 
        peer-focus:-top-2.5 peer-focus:left-3 peer-focus:text-xs peer-focus:text-blue-600
        ${error ? 'peer-focus:text-red-500 text-red-500' : ''}`}
      >
        {label}
      </label>
    </div>
    {helperText && !error && <p className="mt-1.5 text-xs text-slate-500 ml-4">{helperText}</p>}
    {error && <p className="mt-1.5 text-xs text-red-600 ml-4">{error}</p>}
  </div>
);