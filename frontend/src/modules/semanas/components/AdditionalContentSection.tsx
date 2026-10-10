import React from 'react';
import {
  FileText,
  ExternalLink,
  BookOpen,
  Link as LinkIcon,
} from 'lucide-react';
import { SectionContainer } from '../../../components/SectionContainer';

export interface AdditionalContentItem {
  id: number;
  title: string;
  description?: string;
  url: string;
  category?: string;
  type?: string;
}

export interface AdditionalContentSectionProps {
  title: string;
  content: AdditionalContentItem[];
}

export const AdditionalContentSection: React.FC<
  AdditionalContentSectionProps
> = ({ title, content }) => {
  const getIcon = (category?: string) => {
    switch (category) {
      case 'oficial':
        return <BookOpen className="w-5 h-5" />;
      case 'desarrollo':
        return <LinkIcon className="w-5 h-5" />;
      case 'teoria':
        return <FileText className="w-5 h-5" />;
      default:
        return <ExternalLink className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'oficial':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case 'desarrollo':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'teoria':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (!content || content.length === 0) {
    return null;
  }

  return (
    <SectionContainer
      title={title}
      subtitle={`${content.length} recurso${content.length !== 1 ? 's' : ''} disponible${content.length !== 1 ? 's' : ''}`}
      headerGradientFrom="from-purple-600"
      headerGradientTo="to-pink-600"
      headerIcon={<FileText className="w-8 h-8 text-white" />}
    >
      <div className="grid gap-4">
        {content.map(item => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 transition-all duration-200 hover:shadow-md dark:hover:shadow-xl p-6 group"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                {getIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {item.category && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}
                      >
                        {item.category === 'oficial'
                          ? 'Oficial'
                          : item.category === 'desarrollo'
                            ? 'Herramienta'
                            : item.category === 'teoria'
                              ? 'Teoría'
                              : item.category}
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </SectionContainer>
  );
};
