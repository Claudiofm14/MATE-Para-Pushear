import React from 'react';
import { CommunicationChannel } from '../modules/homepage/types/home.types';

interface CommunicationChannelCardProps {
  channel: CommunicationChannel;
}

export const CommunicationChannelCard: React.FC<
  CommunicationChannelCardProps
> = ({ channel }) => {
  return (
    <div className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 dark:bg-gray-800 dark:border-gray-700 border-2 border-transparent hover:border-blue-500">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
          <span className="text-2xl">{channel.icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
          {channel.name}
        </h3>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
        {channel.description}
      </p>

      {channel.steps && channel.steps.length > 0 && (
        <div className="space-y-3 mt-4">
          {channel.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
            >
              <span className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-blue-600 to-emerald-600 text-white text-sm font-bold rounded-full flex items-center justify-center mr-3 shadow-md">
                {step.stepNumber}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {step.description}
                  {step.link && (
                    <>
                      {' '}
                      <a
                        href={step.link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center"
                      >
                        {step.link.text}
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {channel.directLink && (
        <div className="mt-4">
          <a
            href={channel.directLink.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 shadow-md hover:shadow-sm"
          >
            {channel.directLink.text}
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};
