import React from 'react';
import { ImportantNoticeSection } from '../modules/homepage/types/home.types';

interface ImportantNoticeSectionComponentProps {
  importantNotice: ImportantNoticeSection;
}

export const ImportantNoticeSectionComponent: React.FC<
  ImportantNoticeSectionComponentProps
> = ({ importantNotice }) => {
  // No mostrar la sección si no hay requisitos
  if (
    !importantNotice.requirements ||
    importantNotice.requirements.length === 0
  ) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-8 border-yellow-500 p-8 h-full">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 bg-yellow-500 rounded-xl flex items-center justify-center shadow-sm shadow-yellow-500/30">
            <span className="text-3xl">⚠️</span>
          </div>
        </div>
        <div className="ml-6 flex-1">
          <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {importantNotice.title}
          </h3>
          {importantNotice.description && (
            <p className="text-lg mb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
              {importantNotice.description}
            </p>
          )}

          <div className="space-y-4">
            {importantNotice.requirements.map((requirement, index) => (
              <div
                key={index}
                className="flex items-start bg-yellow-50 dark:bg-gray-700/50 rounded-xl p-4 hover:bg-yellow-100 dark:hover:bg-gray-700 transition-colors border border-yellow-100 dark:border-gray-600"
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <span className="font-bold text-gray-900 dark:text-white text-lg">
                    {requirement.name}
                  </span>
                  {requirement.description && (
                    <p className="mt-1 text-gray-600 dark:text-gray-300">
                      {requirement.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {importantNotice.videosLink && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                📹 En la sección{' '}
                <a
                  href={importantNotice.videosLink.url}
                  className="font-medium text-blue-600 dark:text-blue-400 underline hover:no-underline"
                >
                  {importantNotice.videosLink.text}
                </a>{' '}
                encontrarás los tutoriales para hacerlo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
