const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function fetchWithAuth(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Qualcosa è andato storto');
  }

  return response.json();
}

export const authService = {
  async register(userData) {
    console.log('Invio richiesta di registrazione:', userData);
    try {
      const response = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      console.log('Risposta registrazione ricevuta:', response);
      if (response.token) {
        localStorage.setItem('token', response.token);
      } else {
        console.error('Token mancante nella risposta');
      }
      return response;
    } catch (error) {
      console.error('Errore durante la registrazione:', error);
      throw error;
    }
  },

  async login(credentials) {
    const response = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    localStorage.setItem('token', response.token);
    return response;
  },

  logout() {
    localStorage.removeItem('token');
  }
};

export const stationService = {
  async getAllStations() {
    return fetchWithAuth('/stations');
  },

  async createStation(stationData) {
    return fetchWithAuth('/stations', {
      method: 'POST',
      body: JSON.stringify(stationData),
    });
  },

  async updateStation(id, stationData) {
    return fetchWithAuth('/stations', {
      method: 'PUT',
      body: JSON.stringify({ id, ...stationData }),
    });
  },

  async deleteStation(id) {
    return fetchWithAuth(`/stations?id=${id}`, {
      method: 'DELETE',
    });
  }
};

export const userService = {
  async getProfile() {
    return fetchWithAuth('/users');
  },

  async updateProfile(userData) {
    return fetchWithAuth('/users', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async updateMinutes(minutes) {
    return fetchWithAuth('/users', {
      method: 'PATCH',
      body: JSON.stringify({ minutes }),
    });
  }
};