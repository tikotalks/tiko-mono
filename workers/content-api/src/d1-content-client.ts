/// <reference types="@cloudflare/workers-types" />

import type { QueryResult } from './types';

interface Filter {
  column: string;
  operator: '=' | 'IS' | 'IN';
  value: unknown;
}

interface OrderBy {
  column: string;
  ascending: boolean;
}

interface D1Response<T = any> {
  data: T | T[] | null;
  error: Error | null;
}

export class D1ContentClient {
  constructor(private readonly db: D1Database) {}

  from(tableName: string): D1QueryBuilder {
    return new D1QueryBuilder(this.db, tableName);
  }
}

export function getContentDbClient(env: { CONTENT_DB: D1Database }): D1ContentClient {
  return new D1ContentClient(env.CONTENT_DB);
}

export class D1QueryBuilder implements PromiseLike<D1Response> {
  private readonly filters: Filter[] = [];
  private readonly orderBy: OrderBy[] = [];
  private readonly orFilters: Filter[] = [];
  private singleResult = false;

  constructor(
    private readonly db: D1Database,
    private readonly tableName: string
  ) {}

  select(_columns = '*'): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ column, operator: '=', value });
    return this;
  }

  is(column: string, value: unknown): this {
    this.filters.push({ column, operator: 'IS', value });
    return this;
  }

  in(column: string, values: unknown[]): this {
    this.filters.push({ column, operator: 'IN', value: values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  or(expression: string): this {
    for (const part of expression.split(',')) {
      const [column, operator, ...rest] = part.split('.');
      if (column && operator === 'eq' && rest.length > 0) {
        this.orFilters.push({ column, operator: '=', value: rest.join('.') });
      }
    }

    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  then<TResult1 = D1Response, TResult2 = never>(
    onfulfilled?: ((value: D1Response) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<D1Response> {
    try {
      const { sql, values } = this.buildSql();
      const result = this.singleResult
        ? await this.db.prepare(sql).bind(...values).first<Record<string, unknown>>()
        : await this.db.prepare(sql).bind(...values).all<Record<string, unknown>>();

      const rows = this.singleResult ? [] : (result as D1Result<Record<string, unknown>>).results;

      return {
        data: this.singleResult ? (result ?? null) : (rows ?? []),
        error: null
      };
    } catch (error) {
      return {
        data: this.singleResult ? null : [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  private buildSql(): { sql: string; values: unknown[] } {
    assertIdentifier(this.tableName);

    const where: string[] = [];
    const values: unknown[] = [];

    for (const filter of this.filters) {
      assertIdentifier(filter.column);

      if (filter.operator === '=') {
        where.push(`${filter.column} = ?`);
        values.push(filter.value);
      } else if (filter.operator === 'IS') {
        if (filter.value === null) {
          where.push(`${filter.column} IS NULL`);
        } else {
          where.push(`${filter.column} IS ?`);
          values.push(filter.value);
        }
      } else if (filter.operator === 'IN') {
        const list = Array.isArray(filter.value) ? filter.value : [];
        if (list.length === 0) {
          where.push('1 = 0');
        } else {
          where.push(`${filter.column} IN (${list.map(() => '?').join(', ')})`);
          values.push(...list);
        }
      }
    }

    if (this.orFilters.length > 0) {
      const clauses: string[] = [];
      for (const filter of this.orFilters) {
        assertIdentifier(filter.column);
        clauses.push(`${filter.column} = ?`);
        values.push(filter.value);
      }
      where.push(`(${clauses.join(' OR ')})`);
    }

    const order = this.orderBy.map(({ column, ascending }) => {
      assertIdentifier(column);
      return `${column} ${ascending ? 'ASC' : 'DESC'}`;
    });

    let sql = `SELECT * FROM ${this.tableName}`;
    if (where.length > 0) {
      sql += ` WHERE ${where.join(' AND ')}`;
    }
    if (order.length > 0) {
      sql += ` ORDER BY ${order.join(', ')}`;
    }
    if (this.singleResult) {
      sql += ' LIMIT 1';
    }

    return { sql, values };
  }
}

function assertIdentifier(identifier: string): void {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
    throw new Error(`Unsafe SQL identifier: ${identifier}`);
  }
}

export function resultFromError(error: unknown): QueryResult {
  return {
    data: null,
    error: error instanceof Error ? error.message : String(error)
  };
}