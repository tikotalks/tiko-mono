/**
 * Apps Service
 * 
 * Manages application metadata for the Tiko dashboard.
 * Currently uses static data but can be extended to use the content management system.
 */

import type { TCardTile } from '@tiko/ui';

export interface TikoApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  url: string;
  isActive: boolean;
  order: number;
  image?: string;
}

export class AppsService {
  private static apps: TikoApp[] = [
    {
      id: 'cards',
      name: 'Cards',
      description: 'Communication cards for speech therapy and learning',
      icon: 'square',
      color: 'primary',
      url: 'https://cards.tikoapps.org',
      isActive: true,
      order: 1
    },
    {
      id: 'timer',
      name: 'Timer',
      description: 'Visual countdown timer for activities and transitions',
      icon: 'clock',
      color: 'success',
      url: 'https://timer.tikoapps.org',
      isActive: true,
      order: 2
    },
    {
      id: 'yesno',
      name: 'Yes/No',
      description: 'Simple yes/no decision making tool',
      icon: 'check-x',
      color: 'warning',
      url: 'https://yesno.tikoapps.org',
      isActive: true,
      order: 3
    },
    {
      id: 'radio',
      name: 'Radio',
      description: 'Music and audio streaming platform',
      icon: 'radio',
      color: 'error',
      url: 'https://radio.tikoapps.org',
      isActive: true,
      order: 4
    },
    {
      id: 'todo',
      name: 'Todo',
      description: 'Task management and productivity tool',
      icon: 'checkbox',
      color: 'info',
      url: 'https://todo.tikoapps.org',
      isActive: true,
      order: 5
    },
    {
      id: 'type',
      name: 'Type',
      description: 'Typing practice and keyboard training',
      icon: 'keyboard',
      color: 'secondary',
      url: 'https://type.tikoapps.org',
      isActive: true,
      order: 6
    },
    {
      id: 'sequence',
      name: 'Sequence',
      description: 'Sequential activities and step-by-step guides',
      icon: 'layers',
      color: 'primary',
      url: 'https://sequence.tikoapps.org',
      isActive: true,
      order: 7
    }
  ];

  /**
   * Get all available apps
   */
  static async getAllApps(): Promise<TikoApp[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return this.apps
      .filter(app => app.isActive)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Get apps formatted as TCardTile for use in TCardGrid
   */
  static async getAppsAsCards(): Promise<TCardTile[]> {
    const apps = await this.getAllApps();
    
    return apps.map((app, index) => ({
      id: app.id,
      title: app.name,
      description: app.description,
      icon: app.icon as any,
      color: app.color as any,
      image: app.image || null,
      speech: '',
      type: 'app' as any,
      index,
      url: app.url
    }));
  }

  /**
   * Get a specific app by ID
   */
  static async getApp(id: string): Promise<TikoApp | null> {
    const apps = await this.getAllApps();
    return apps.find(app => app.id === id) || null;
  }

  /**
   * Generate SSO URL for an app
   * Appends authentication token if user is authenticated
   */
  static generateSSOUrl(app: TikoApp, accessToken?: string): string {
    const url = new URL(app.url);
    
    if (accessToken) {
      url.searchParams.set('sso_token', accessToken);
      url.searchParams.set('return_url', window.location.origin);
    }
    
    return url.toString();
  }

  /**
   * Handle SSO redirect from other apps
   * This would be called when returning from another app
   */
  static async handleSSOReturn(token: string, returnApp?: string): Promise<boolean> {
    try {
      // Validate the token and log the user in
      // This would integrate with the auth service
      console.log('Handling SSO return with token:', token, 'from app:', returnApp);
      
      // For now, just return success
      return true;
    } catch (error) {
      console.error('SSO return handling failed:', error);
      return false;
    }
  }

  /**
   * Future: Load apps from content management system
   * This method would replace the static data approach
   */
  private static async loadAppsFromCMS(): Promise<TikoApp[]> {
    // TODO: Implement using content.service.ts
    // const contentService = new ContentService();
    // const appItems = await contentService.getItemsByType('app');
    // return appItems.map(item => this.mapCMSItemToApp(item));
    
    return [];
  }

  /**
   * Future: Map CMS item to TikoApp
   */
  private static mapCMSItemToApp(cmsItem: any): TikoApp {
    return {
      id: cmsItem.id,
      name: cmsItem.fields.name,
      description: cmsItem.fields.description,
      icon: cmsItem.fields.icon,
      color: cmsItem.fields.color,
      url: cmsItem.fields.url,
      isActive: cmsItem.fields.isActive !== false,
      order: cmsItem.fields.order || 0,
      image: cmsItem.fields.image
    };
  }
}

// Export singleton instance
export const appsService = AppsService;