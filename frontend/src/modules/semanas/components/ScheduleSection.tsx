import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Schedule } from '../types/semanas.types';

export interface ScheduleSectionProps {
  schedules: Schedule[];
  title?: string;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedules,
  title = 'Horarios',
}) => {
  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return '📝';
      case 'virtual':
        return '💻';
      case 'noclass':
        return '🚫';
      case 'special':
        return '⭐';
      case 'class':
      default:
        return '🏫';
    }
  };

  const getScheduleTypeStyles = (type: string) => {
    switch (type) {
      case 'exam':
        return {
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-100 dark:border-red-800',
          text: 'text-red-800 dark:text-red-200',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
        };
      case 'virtual':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/10',
          border: 'border-blue-100 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-200',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        };
      case 'noclass':
        return {
          bg: 'bg-gray-50 dark:bg-gray-800/50',
          border: 'border-gray-100 dark:border-gray-700',
          text: 'text-gray-800 dark:text-gray-200',
          iconBg: 'bg-gray-100 dark:bg-gray-700',
        };
      case 'special':
        return {
          bg: 'bg-purple-50 dark:bg-purple-900/10',
          border: 'border-purple-100 dark:border-purple-800',
          text: 'text-purple-800 dark:text-purple-200',
          iconBg: 'bg-purple-100 dark:bg-purple-900/30',
        };
      case 'class':
      default:
        return {
          bg: 'bg-green-50 dark:bg-green-900/10',
          border: 'border-green-100 dark:border-green-800',
          text: 'text-green-800 dark:text-green-200',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (time: string) => {
    return time.replace(':', 'h');
  };

  if (schedules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No hay horarios programados para esta semana.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold border border-green-200 dark:border-green-800">
          {schedules.length}
        </span>
      </div>

      <div className="space-y-4">
        {schedules.map(schedule => {
          const styles = getScheduleTypeStyles(schedule.type);

          return (
            <div
              key={schedule.id}
              className={`group relative bg-white dark:bg-gray-800 rounded-2xl border p-1 overflow-hidden hover:shadow-lg transition-all duration-300 ${styles.border}`}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${styles.bg.replace('/10', '/50').replace('/50', '')}`}
              ></div>

              <div className={`rounded-xl p-5 ${styles.bg} h-full`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm flex-shrink-0 ${styles.iconBg}`}
                    >
                      {getScheduleTypeIcon(schedule.type)}
                    </div>

                    <div>
                      <h4 className={`text-lg font-bold mb-1 ${styles.text}`}>
                        {schedule.title}
                      </h4>

                      {schedule.description && (
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                          {schedule.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/10 px-2 py-1 rounded-md">
                          <Calendar className="w-4 h-4" />
                          <span className="capitalize">
                            {formatDate(schedule.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/10 px-2 py-1 rounded-md">
                          <Clock className="w-4 h-4" />
                          <span>
                            {formatTime(schedule.startTime)}
                            {schedule.endTime &&
                              ` - ${formatTime(schedule.endTime)}`}
                          </span>
                        </div>

                        {schedule.location && (
                          <div className="flex items-center gap-1.5 bg-white/50 dark:bg-black/10 px-2 py-1 rounded-md">
                            <MapPin className="w-4 h-4" />
                            <span>{schedule.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {schedule.meetLink && (
                    <div className="flex-shrink-0 md:self-center mt-2 md:mt-0">
                      <a
                        href={schedule.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:shadow-md hover:scale-105 transition-all border border-gray-200 dark:border-gray-700"
                      >
                        <span>Unirse a la clase</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
