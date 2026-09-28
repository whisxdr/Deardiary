import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-body text-sm font-medium transition-all duration-fast ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary-700 text-accent-cream shadow-soft hover:bg-primary-600 active:translate-y-px',
        gold: 'bg-accent-gold text-primary-900 shadow-soft hover:brightness-110 active:translate-y-px',
        outline:
          'border border-primary-300/70 bg-transparent text-primary-700 hover:bg-primary-100/60 dark:text-primary-100',
        ghost: 'bg-transparent text-primary-600 hover:bg-primary-100/60 dark:text-primary-100',
        danger: 'bg-error text-white shadow-soft hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** Themed button covering the primary, gold, outline, ghost and danger intents. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);

Button.displayName = 'Button';
export { buttonVariants };
