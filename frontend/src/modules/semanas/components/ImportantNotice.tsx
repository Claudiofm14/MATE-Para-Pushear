import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { sanitizeRichHtml } from '../../../shared/utils/htmlSanitizer';

export interface ImportantNoticeProps {
  title: string;
  content: string;
  type: 'warning' | 'info' | 'success' | 'error';
}

export const ImportantNotice: React.FC<ImportantNoticeProps> = ({
  title,
  content,
  type,
}) => {
  const getIconAndColors = () => {
    switch (type) {
      case 'warning':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          titleColor: 'text-yellow-800 dark:text-yellow-200',
          textColor: 'text-yellow-700 dark:text-yellow-300',
        };
      case 'error':
        return {
          icon: XCircle,
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          iconColor: 'text-red-600 dark:text-red-400',
          titleColor: 'text-red-800 dark:text-red-200',
          textColor: 'text-red-700 dark:text-red-300',
        };
      case 'success':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          iconColor: 'text-green-600 dark:text-green-400',
          titleColor: 'text-green-800 dark:text-green-200',
          textColor: 'text-green-700 dark:text-green-300',
        };
      case 'info':
      default:
        return {
          icon: Info,
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          iconColor: 'text-blue-600 dark:text-blue-400',
          titleColor: 'text-blue-800 dark:text-blue-200',
          textColor: 'text-blue-700 dark:text-blue-300',
        };
    }
  };

  const {
    icon: Icon,
    bgColor,
    borderColor,
    iconColor,
    titleColor,
    textColor,
  } = getIconAndColors();

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-6 mb-6`}>
      <div className="flex items-start gap-3">
        <Icon className={`${iconColor} w-6 h-6 flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h3 className={`${titleColor} font-semibold text-lg mb-2`}>
            {title}
          </h3>
          <div
            className={`${textColor} prose prose-sm max-w-none`}
            dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(content) }}
          />
        </div>
      </div>
    </div>
  );
};
