'use client';
import { useRef, useState } from 'react';
import { Calendar, Moon, Sun, DollarSign } from 'lucide-react';
import { useThemeStore } from '../../../shared/store/theme.store';
import { Button } from '@/features/executive/components/ui/button';

export default function Header() {
  const [currentDate] = useState<string>(
    new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  );
  const { theme, setTheme } = useThemeStore();
  const [animating, setAnimating] = useState(false);
  const animLockRef = useRef(false);

  const handleThemeToggle = () => {
    if (animLockRef.current) return;
    animLockRef.current = true;
    setAnimating(true);

    // Toggle theme immediately (symmetric — everything changes at once)
    setTheme(theme === 'dark' ? 'light' : 'dark');

    // Brief flash overlay for a smooth symmetric crossfade
    setTimeout(() => {
      setAnimating(false);
      animLockRef.current = false;
    }, 400);
  };

  return (
    <header className="bg-background/80 fixed top-0 left-0 z-50 w-full border-b backdrop-blur-md">
      <div className="flex w-full items-center justify-between px-3 py-3 md:px-6">
        {/* Desktop date */}
        <div className="hidden md:flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
          {currentDate && (
            <>
              <Calendar className="size-4" />
              <span className="capitalize">{currentDate}</span>
            </>
          )}
        </div>

        {/* Mobile center: logo + app name */}
        <div className="flex items-center gap-2 md:hidden">
          <DollarSign className="text-primary size-5" />
          <h1 className="text-lg font-semibold">Portal Gestión</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme toggle with symmetric crossfade animation */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-sm h-8 w-8 md:h-9 md:w-9 overflow-hidden"
            onClick={handleThemeToggle}
            aria-label="Cambiar tema"
          >
            <span className="relative z-10">
              {theme === 'dark' ? (
                <Sun className="size-4 md:size-5 transition-transform duration-500 hover:rotate-45" />
              ) : (
                <Moon className="size-4 md:size-5 transition-transform duration-500 hover:-rotate-12" />
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Symmetric flash overlay — brief opacity pulse for smooth crossfade */}
      {animating && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{
            background: theme === 'dark'
              ? 'hsl(0 0% 100%)'
              : 'hsl(222.2 84% 4.9%)',
            opacity: 0.3,
            animation: 'theme-flash 0.35s ease-out forwards',
          }}
        />
      )}

      {/* Theme flash keyframes */}
      <style>{`
        @keyframes theme-flash {
          0% { opacity: 0; }
          20% { opacity: 0.25; }
          100% { opacity: 0; }
        }
      `}</style>
    </header>
  );
}
