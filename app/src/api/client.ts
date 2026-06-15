import { config } from './../config';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('jwt_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${config.databaseURL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore
    }

    const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register') || endpoint.includes('/oauth');

    if (response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      window.location.href = '/';
      return Promise.reject(new Error('Session expired.'));
    }
    const errorMessage = errorData.message
      || errorData.error
      || (response.status === 401 && isAuthEndpoint ? 'Nieprawidłowy login lub hasło.' : 'API request failed');

    throw new Error(errorMessage);
  }

  return response.json();
}