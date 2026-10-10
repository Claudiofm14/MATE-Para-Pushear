import React from 'react';
import { CommunicationChannelsSection } from '../modules/homepage/types/home.types';
import { CommunicationChannelCard } from './CommunicationChannelCard';

interface CommunicationChannelsSectionComponentProps {
  communicationChannels: CommunicationChannelsSection;
}

export const CommunicationChannelsSectionComponent: React.FC<
  CommunicationChannelsSectionComponentProps
> = ({ communicationChannels }) => {
  // No mostrar la sección si no hay canales
  if (
    !communicationChannels.channels ||
    communicationChannels.channels.length === 0
  ) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
          <svg
            className="w-6 h-6 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {communicationChannels.title}
        </h2>
      </div>

      {communicationChannels.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {communicationChannels.description}
        </p>
      )}

      <div className="grid gap-4 grid-cols-1">
        {communicationChannels.channels.map((channel, index) => (
          <CommunicationChannelCard key={index} channel={channel} />
        ))}
      </div>
    </div>
  );
};
