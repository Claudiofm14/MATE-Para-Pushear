import React from 'react';
import { WelcomeSection } from '../modules/homepage/types/home.types';

interface WelcomeSectionComponentProps {
  welcome: WelcomeSection;
}

export const WelcomeSectionComponent: React.FC<
  WelcomeSectionComponentProps
> = ({ welcome }) => {
  // if (!welcome.content?.length) {
  //   return null;
  // }

  return (
    <section className="relative py-4">
      <div className="relative mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h2 className="mb-3 text-3xl font-bold text-gray-950 dark:text-white md:text-4xl">
            {welcome.title}
          </h2>
          {welcome.message && (
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {welcome.message}
            </p>
          )}
        </div>

        {welcome.content && welcome.content.length > 0 && (
          <div className="mx-auto grid max-w-4xl gap-4">
            {welcome.content.map((paragraph, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                  {paragraph}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {welcome.scheduleLink && (
            <a
              href={welcome.scheduleLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow-md"
            >
              {welcome.scheduleLink.text}
              <svg
                className="ml-3 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}

          {welcome.materialLink && (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Si ya viniste varias veces, probablemente quieras ver el{' '}
                <a
                  href={welcome.materialLink.url}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline decoration-blue-600/30 hover:decoration-blue-600"
                >
                  {welcome.materialLink.text}
                </a>{' '}
                que tenemos disponible.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
