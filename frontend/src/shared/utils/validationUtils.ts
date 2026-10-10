/**
 * Valida que un string no esté vacío
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

/**
 * Valida la longitud mínima de un string
 */
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

/**
 * Valida la longitud máxima de un string
 */
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

/**
 * Valida que un email tenga formato correcto
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida que un número esté en un rango específico
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Sanitiza un string removiendo caracteres peligrosos
 */
export const sanitizeString = (value: string): string => {
  return value
    .replace(/[<>]/g, '') // Remover < y >
    .trim();
};

/**
 * Valida múltiples reglas a la vez
 */
export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export const validateField = (
  value: any,
  rules: ValidationRule[]
): string | null => {
  for (const rule of rules) {
    if (!rule.test(value)) {
      return rule.message;
    }
  }
  return null;
};

/**
 * Reglas de validación predefinidas
 */
export const validationRules = {
  required: (message = 'Este campo es obligatorio'): ValidationRule => ({
    test: (value: string) => isNotEmpty(value),
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    test: (value: string) => minLength(value, min),
    message: message || `Debe tener al menos ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    test: (value: string) => maxLength(value, max),
    message: message || `No puede tener más de ${max} caracteres`,
  }),

  email: (message = 'Debe ser un email válido'): ValidationRule => ({
    test: (value: string) => isValidEmail(value),
    message,
  }),
};
