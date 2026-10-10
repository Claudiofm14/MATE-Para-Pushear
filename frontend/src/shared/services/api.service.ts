import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiService {
  private api: AxiosInstance;
  private readonly pendingGets = new Map<string, Promise<unknown>>();
  private readonly pendingGetResponses = new Map<
    string,
    Promise<AxiosResponse>
  >();
  private mutationGeneration = 0;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 10000,
    });

    this.setupGetCoalescing();
    this.setupInterceptors();
  }

  private setupGetCoalescing() {
    const baseAdapter = axios.getAdapter(this.api.defaults.adapter);
    this.api.defaults.adapter = config => {
      if (
        config.method?.toLowerCase() !== 'get' ||
        config.signal ||
        config.onDownloadProgress
      ) {
        return baseAdapter(config);
      }

      const requestUrl = this.api.getUri(config);
      const key = `${this.mutationGeneration}:${config.responseType || 'json'}:${requestUrl}`;
      const pending = this.pendingGetResponses.get(key);
      if (pending) return pending;

      const request = baseAdapter(config).finally(() => {
        if (this.pendingGetResponses.get(key) === request) {
          this.pendingGetResponses.delete(key);
        }
      });
      this.pendingGetResponses.set(key, request);
      return request;
    };
  }

  enableCredentials() {
    this.api.defaults.withCredentials = true;
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        config.withCredentials = true;

        if (
          typeof FormData !== 'undefined' &&
          config.data instanceof FormData
        ) {
          const headers = config.headers as any;
          if (typeof headers.delete === 'function') {
            headers.delete('Content-Type');
          } else {
            delete headers['Content-Type'];
            delete headers['content-type'];
          }
        }

        return config;
      },
      error => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      response => {
        if (response.config.method?.toLowerCase() !== 'get') {
          this.mutationGeneration += 1;
        }
        return response;
      },
      async error => Promise.reject(error)
    );
  }

  getAxiosInstance(): AxiosInstance {
    return this.api;
  }

  async get<T>(url: string, config?: any): Promise<T> {
    const canCoalesce =
      !config?.signal &&
      !config?.headers &&
      !config?.auth &&
      !config?.onDownloadProgress;
    if (!canCoalesce) {
      const response = await this.api.get<T>(url, config);
      return response.data;
    }

    const requestUrl = this.api.getUri({ url, params: config?.params });
    const key = `${this.mutationGeneration}:${requestUrl}`;
    const pending = this.pendingGets.get(key) as Promise<T> | undefined;
    if (pending) return pending;

    const request = this.api
      .get<T>(url, config)
      .then(response => response.data)
      .finally(() => {
        if (this.pendingGets.get(key) === request) this.pendingGets.delete(key);
      });
    this.pendingGets.set(key, request);
    return request;
  }

  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: any): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;
