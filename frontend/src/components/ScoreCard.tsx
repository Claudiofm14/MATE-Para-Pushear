/**
 * ScoreCard
 *
 * Muestra una tarjeta pequeña con un puntaje y una etiqueta, usando colores según el "variant".
 *
 * Props principales:
 * - score: Valor a mostrar (string).
 * - label: Descripción o etiqueta.
 * - variant: Color de la tarjeta ('red', 'orange', 'blue', 'green').
 * - className: Clases CSS adicionales.
 *
 * Uso:
 * <ScoreCard score="10" label="Puntos" variant="green" />
 */

interface ScoreCardProps {
  score: string;
  label: string;
  variant?: 'red' | 'orange' | 'blue' | 'green';
  className?: string;
}

const variantStyles = {
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  orange:
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export function ScoreCard({
  score,
  label,
  variant = 'blue',
  className = '',
}: ScoreCardProps) {
  return (
    <div className="text-center">
      <div className={`rounded-lg p-3 ${variantStyles[variant]} ${className}`}>
        <div className="text-lg font-bold">{score}</div>
        <div className="text-sm">{label}</div>
      </div>
    </div>
  );
}
