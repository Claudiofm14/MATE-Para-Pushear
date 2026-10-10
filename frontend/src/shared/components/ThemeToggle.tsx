import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const buttonTitle = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative flex h-9 w-[68px] min-w-[68px] items-center rounded-full border border-white/20 shadow-sm transition-all duration-300 focus:outline-none ${
        isDark
          ? 'bg-gradient-to-r from-blue-600 via-violet-500 to-indigo-500'
          : 'bg-gradient-to-r from-blue-400 via-slate-500 to-gray-600'
      } ${className}`}
      title={buttonTitle}
      aria-label={buttonTitle}
    >
      {/* Thumb */}
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${
          isDark ? 'translate-x-8' : ''
        }`}
      >
        {isDark ? (
          // Luna
          <svg
            className="w-4 h-4 text-violet-600"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
        ) : (
          // Sol
          <svg
            className="w-4 h-4 text-amber-600"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
        )}
      </span>
    </button>
  );
}
