export const USER_ROLES = {
  DOCENTE: 'docente',
  ALUMNO: 'alumno',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
