const API_BASE_URL = 'http://localhost:3002/api';

class API {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  getHeaders(includeAuth = false) {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  }

  // Auth APIs
  async register(email, username, password) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, username, password })
    });
    return this.handleResponse(response);
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await this.handleResponse(response);
    if (data.success && data.data.token) {
      this.setToken(data.data.token);
    }
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  }

  logout() {
    this.removeToken();
    window.location.href = 'login.html';
  }

  // Video APIs
  async getAllVideos(page = 1, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/videos?page=${page}&limit=${limit}`);
    return this.handleResponse(response);
  }

  async getVideoById(id) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`);
    return this.handleResponse(response);
  }

  async uploadVideo(formData) {
    const response = await fetch(`${API_BASE_URL}/videos/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  async updateVideo(id, title, description) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(true),
      body: JSON.stringify({ title, description })
    });
    return this.handleResponse(response);
  }

  async deleteVideo(id) {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  }

  async toggleLike(videoId) {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/like`, {
      method: 'POST',
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  }

  async addComment(videoId, content) {
    const response = await fetch(`${API_BASE_URL}/videos/${videoId}/comment`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ content })
    });
    return this.handleResponse(response);
  }

  async getUserVideos(userId, page = 1, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/videos/user/${userId}?page=${page}&limit=${limit}`);
    return this.handleResponse(response);
  }

  // User APIs
  async getUserProfile(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return this.handleResponse(response);
  }

  async updateProfile(formData) {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  async changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify({ currentPassword, newPassword })
    });
    return this.handleResponse(response);
  }

  async getLikedVideos(page = 1, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/users/liked-videos?page=${page}&limit=${limit}`, {
      headers: this.getHeaders(true)
    });
    return this.handleResponse(response);
  }

  // Increment video views
  async incrementViews(videoId) {
    try {
        const response = await fetch(`${this.baseURL}/videos/${videoId}/view`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return await response.json();
    } catch (error) {
        console.error('Increment views error:', error);
        return { success: false, message: error.message };
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

const api = new API();