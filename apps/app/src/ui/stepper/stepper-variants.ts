import { tv } from 'tailwind-variants';

export type StepStatus = 'complete' | 'active' | 'upcoming';

export const stepper = tv({
  slots: {
    root:
      'flex ' +
      'data-[orientation=horizontal]:w-full ' +
      'data-[orientation=horizontal]:flex-row ' +
      'data-[orientation=vertical]:flex-col ' +
      'data-[orientation=horizontal]:items-center',
    step: 'flex shrink-0 items-center',
    label:
      'h-auto rounded-lg p-0 ' +
      'data-[focus-visible=true]:ring-0 ' +
      'data-[focus-visible=true]:ring-offset-0 ' +
      'data-[focus-visible=true]:bg-default ' +
      'flex items-center gap-3 px-2 py-1.5 ' +
      'max-sm:px-0.5 max-sm:py-1',
    indicator:
      'relative flex items-center justify-center ' +
      'size-8  rounded-full ' +
      'text-sm leading-none font-semibold ' +
      'shrink-0 overflow-hidden ' +
      'transition-colors duration-300 ' +
      'data-[status=complete]:bg-accent ' +
      'data-[status=complete]:text-accent-foreground ' +
      'data-[status=active]:bg-surface ' +
      'data-[status=active]:text-accent ' +
      'data-[status=active]:border-2 ' +
      'data-[status=active]:border-accent ' +
      'data-[status=upcoming]:bg-default ' +
      'data-[status=upcoming]:text-muted',
    indicatorContent: 'absolute inset-0 flex items-center justify-center',
    title:
      'text-sm font-semibold ' +
      'transition-colors duration-200 ' +
      'max-sm:hidden ' +
      'data-[status=active]:text-foreground ' +
      'data-[status=complete]:text-foreground ' +
      'data-[status=upcoming]:text-muted',
    description: 'mt-0.5 text-xs text-muted max-sm:hidden',
    connector:
      'mx-2 h-0.5 flex-1 rounded-full ' +
      'transition-all duration-300 ' +
      'sm:mx-3 ' +
      'data-[orientation=vertical]:min-w-0 ' +
      'data-[orientation=vertical]:min-h-8 ' +
      'data-[orientation=vertical]:w-0.5 ' +
      'data-[orientation=vertical]:h-auto ' +
      'data-[orientation=vertical]:mx-0 ' +
      'data-[orientation=vertical]:ml-6 ' +
      'data-[orientation=vertical]:my-1 ' +
      'data-[status=complete]:bg-accent ' +
      'data-[status=upcoming]:bg-separator',
  },
  variants: {
    disabled: {
      true: {
        label: 'pointer-events-none',
      },
    },
  },
});
