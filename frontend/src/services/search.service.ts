import { apiService } from '../shared/services/api.service';

export type SearchResult = {
  id: string;
  title: string;
  detail?: string;
  type: 'materia' | 'material' | 'semana' | 'video' | 'ejercicio';
  href: string;
};

class SearchService {
  async search(query: string): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    return apiService.get<SearchResult[]>(`/api/search?${params.toString()}`);
  }
}

export const searchService = new SearchService();
