import React from 'react';
import { QuickLinksSection } from '../modules/homepage/types/home.types';
import { QuickLinkCard } from './QuickLinkCard';

interface QuickLinksSectionComponentProps {
  quickLinks: QuickLinksSection;
}

export const QuickLinksSectionComponent: React.FC<
  QuickLinksSectionComponentProps
> = ({ quickLinks }) => {
  if (!quickLinks.links?.length) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <span className="mr-2">🔗</span> {quickLinks.title}
      </h2>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
        {quickLinks.links.map((link, index) => (
          <QuickLinkCard key={index} link={link} />
        ))}
      </div>
    </div>
  );
};
