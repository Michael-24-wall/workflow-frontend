// src/services/organizationService.js
import axios from 'axios';

const API_BASE = 'http://localhost:9000/api';

class OrganizationService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 10000,
    });
    
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getMembers() {
    const response = await this.client.get('/organization/members/');
    return response.data;
  }

  async inviteMember(email, role = 'member') {
    const response = await this.client.post('/organization/invite/', {
      email,
      role
    });
    return response.data;
  }
}

export const organizationService = new OrganizationService();