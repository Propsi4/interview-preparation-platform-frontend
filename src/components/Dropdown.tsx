import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string | number;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  id?: string;
  leftIcon?: React.ReactNode;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className,
  label,
  id,
  leftIcon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        // If less than 250px below, and more space above, open upward
        setOpenUpward(spaceBelow < 250 && rect.top > spaceBelow);
      }
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef} id={id}>
      {label && (
        <label className="mb-1.5 block text-xs font-semibold text-ink/50 uppercase tracking-wider">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-all duration-200',
          'bg-surface border-white/10 text-ink shadow-sm',
          'hover:border-accent/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20',
          disabled && 'cursor-not-allowed opacity-50 grayscale-[0.5]',
          isOpen && 'border-accent shadow-[0_0_15px_rgba(255,211,105,0.1)]'
        )}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {leftIcon && <div className="shrink-0">{leftIcon}</div>}
          <span className={cn('block truncate', !selectedOption && 'text-ink/30')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 text-ink/40 transition-transform duration-200',
            isOpen && 'rotate-180 text-accent'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: openUpward ? -4 : 4, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "absolute z-50 max-h-60 w-full overflow-auto rounded-2xl border border-white/10 bg-panel/90 backdrop-blur-xl p-1.5 shadow-2xl scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent",
              openUpward ? "bottom-full mb-1" : "top-full mt-1"
            )}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={cn(
                  'relative flex cursor-pointer select-none items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                  option.value === value
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-ink/80 hover:bg-white/5 hover:text-ink'
                )}
              >
                <span className="block truncate">{option.label}</span>
                {option.value === value && (
                  <Check className="h-4 w-4 text-accent" />
                )}
              </li>
            ))}
            {options.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-ink/40 italic">
                No options available
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};
