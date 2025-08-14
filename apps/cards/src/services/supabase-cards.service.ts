import { useAuthStore } from '@tiko/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface CardItem {
  id: string;
  user_id: string;
  app_name: string;
  type: string;
  name: string;
  content?: string;
  metadata?: any;
  parent_id?: string;
  order_index: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

class CardsSupabaseService {
  private getAuthToken(): string | null {
    const sessionData = localStorage.getItem('tiko_auth_session');
    if (!sessionData) return null;
    
    try {
      const session = JSON.parse(sessionData);
      return session.access_token;
    } catch {
      return null;
    }
  }

  private async apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': token ? `Bearer ${token}` : '',
        'Prefer': 'return=representation',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`API request failed: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async getCards(userId: string, parentId?: string): Promise<CardItem[]> {
    const params = new URLSearchParams();
    params.append('user_id', `eq.${userId}`);
    params.append('app_name', 'eq.cards');
    
    if (parentId === undefined || parentId === null) {
      params.append('parent_id', 'is.null');
    } else {
      params.append('parent_id', `eq.${parentId}`);
    }
    
    // Use correct PostgREST syntax for ordering
    params.append('order', 'order_index.asc');
    
    return this.apiRequest<CardItem[]>(`items?${params.toString()}`);
  }

  async createCard(data: Partial<CardItem>): Promise<CardItem> {
    const response = await this.apiRequest<CardItem[]>('items', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response[0];
  }

  async updateCard(id: string, data: Partial<CardItem>): Promise<CardItem> {
    const response = await this.apiRequest<CardItem[]>(`items?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return response[0];
  }

  async deleteCard(id: string): Promise<void> {
    await this.apiRequest(`items?id=eq.${id}`, {
      method: 'DELETE'
    });
  }
}

export const cardsSupabaseService = new CardsSupabaseService();