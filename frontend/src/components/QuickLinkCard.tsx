import React from 'react';
import { QuickLink } from '../modules/homepage/types/home.types';

interface QuickLinkCardProps {
  link: QuickLink;
}

export const QuickLinkCard: React.FC<QuickLinkCardProps> = ({ link }) => {
  return (
    <a
      href={link.url}
      className="group block relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
    >
      {/* Gradiente de fondo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-colors duration-300"></div>

      <div className="relative">
        <div className="flex items-center mb-4">
          {link.icon && (
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl mr-4 group-hover:scale-110 transition-transform duration-300">
              {link.icon}
            </div>
          )}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
            {link.text}
          </h3>
        </div>

        {link.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
            {link.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">
            Acceder
          </span>
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      </div>
    </a>
  );
};
