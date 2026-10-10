import React from 'react';
import { BookOpen, ExternalLink, Clock, Calendar } from 'lucide-react';
import { Exercise } from '../types/semanas.types';

export interface ExercisesSectionProps {
  exercises: Exercise[];
  title?: string;
}

export const ExercisesSection: React.FC<ExercisesSectionProps> = ({
  exercises,
  title = 'Ejercicios',
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800';
      case 'hard':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'medium':
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'Fácil';
      case 'hard':
        return 'Difícil';
      case 'medium':
      default:
        return 'Medio';
    }
  };

  const parseDateOnly = (dateString: string) => {
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDueDate = (dateString: string) => {
    const date = parseDateOnly(dateString);
    date.setHours(23, 59, 59, 999);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Vencido';
    } else if (diffDays === 0) {
      return 'Vence hoy';
    } else if (diffDays === 1) {
      return 'Vence mañana';
    } else {
      return `Vence en ${diffDays} días`;
    }
  };

  const isOverdue = (dateString: string) => {
    const date = parseDateOnly(dateString);
    date.setHours(23, 59, 59, 999);
    const now = new Date();
    return date.getTime() < now.getTime();
  };

  if (exercises.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 mb-8 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          No hay ejercicios disponibles para esta semana.
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
        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
          {exercises.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exercises.map(exercise => (
          <div
            key={exercise.id}
            className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Decorative gradient line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6" />
              </div>

              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getDifficultyColor(exercise.difficulty)}`}
              >
                {getDifficultyText(exercise.difficulty)}
              </span>
            </div>

            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {exercise.title}
            </h4>

            {exercise.description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
                {exercise.description}
              </p>
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              {exercise.estimatedTime && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 px-2.5 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{exercise.estimatedTime} min</span>
                </div>
              )}

              {exercise.dueDate && (
                <div
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${
                    isOverdue(exercise.dueDate)
                      ? 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400'
                      : 'bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDueDate(exercise.dueDate)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {exercise.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {exercise.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Action Button */}
            {exercise.url && (
              <a
                href={exercise.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full gap-2 bg-gray-50 dark:bg-gray-700/50 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium transition-all group/btn"
              >
                <span>Ver ejercicio</span>
                <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
