import { apiService } from '../shared/services/api.service';

export type DashboardCard = {
  label: string;
  value: number;
  detail?: string;
};

export type DashboardAction = {
  label: string;
  href: string;
  priority: 'high' | 'medium' | 'low';
};

export type DashboardNotification = {
  id: string;
  title: string;
  detail: string;
  href?: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
};

export type DashboardData = {
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: string;
  };
  cards: DashboardCard[];
  actions: DashboardAction[];
  notifications: DashboardNotification[];
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: 'clase' | 'entrega';
  materiaId?: number;
  semanaId?: number;
  href?: string;
};

class DashboardService {
  async getDashboard(): Promise<DashboardData> {
    return apiService.get<DashboardData>('/api/me/dashboard');
  }

  async getNotifications(): Promise<DashboardNotification[]> {
    return apiService.get<DashboardNotification[]>('/api/me/notificaciones');
  }

  async getCalendar(): Promise<CalendarEvent[]> {
    return apiService.get<CalendarEvent[]>('/api/me/calendario');
  }
}

export const dashboardService = new DashboardService();
