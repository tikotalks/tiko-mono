import { SupabaseClient } from '@supabase/supabase-js';
import { ContentQuery, QueryResult } from './types';
import { ContentServiceWrapper } from './content-service-wrapper';

export class ContentService {
  private wrapper: ContentServiceWrapper;

  constructor(supabase: SupabaseClient) {
    this.wrapper = new ContentServiceWrapper(supabase);
  }

  async executeQuery(query: ContentQuery): Promise<QueryResult> {
    return this.wrapper.executeQuery(query);
  }
}