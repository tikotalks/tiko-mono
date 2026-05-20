import { D1ContentClient } from './d1-content-client';
import { ContentQuery, QueryResult } from './types';
import { ContentServiceWrapper } from './content-service-wrapper';

export class ContentService {
  private wrapper: ContentServiceWrapper;

  constructor(dbClient: D1ContentClient) {
    this.wrapper = new ContentServiceWrapper(dbClient);
  }

  async executeQuery(query: ContentQuery): Promise<QueryResult> {
    return this.wrapper.executeQuery(query);
  }
}