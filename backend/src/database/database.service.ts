import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

/**
 * Mock Supabase API for local development
 * Stores data in memory with Supabase-like interface
 */
class MockDatabase {
  private tables = new Map<string, any[]>();

  from(table: string) {
    const self = this;
    const allRows = self.tables.get(table) || [];

    // Helper to create a queryable builder
    const createQueryBuilder = (rows: any[]) => ({
      select: (fields = '*') => ({
        eq: (col: string, value: any) => {
          const filtered = rows.filter((row: any) => row[col] === value);
          return {
            single: async () => ({
              data: filtered[0],
              error: null,
            }),
            async: async () => ({
              data: filtered,
              error: null,
            }),
            order: (sortCol: string, opts: any = {}) => ({
              async: async () => ({
                data: filtered.sort((a: any, b: any) => {
                  if (opts.ascending === false) return b[sortCol] - a[sortCol];
                  return a[sortCol] - b[sortCol];
                }),
                error: null,
              }),
            }),
          };
        },
        order: (col: string, opts: any = {}) => ({
          async: async () => ({
            data: rows.sort((a: any, b: any) => {
              if (opts.ascending === false) return b[col] - a[col];
              return a[col] - b[col];
            }),
            error: null,
          }),
        }),
        async: async () => ({
          data: rows,
          error: null,
        }),
      }),
      eq: (col: string, value: any) => {
        const filtered = rows.filter((row: any) => row[col] === value);
        return {
          single: async () => ({
            data: filtered[0],
            error: null,
          }),
          async: async () => ({
            data: filtered,
            error: null,
          }),
          order: (sortCol: string, opts: any = {}) => ({
            async: async () => ({
              data: filtered.sort((a: any, b: any) => {
                if (opts.ascending === false) return b[sortCol] - a[sortCol];
                return a[sortCol] - b[sortCol];
              }),
              error: null,
            }),
          }),
        };
      },
    });

    return {
      select: (fields = '*') => createQueryBuilder(allRows).select(fields),
      insert: (insertData: any) => {
        const dataObj = Array.isArray(insertData) ? insertData[0] : insertData;
        const id = Math.random().toString(36).substr(2, 9);
        const row = { 
          id, 
          ...dataObj,
          created_at: dataObj.created_at || new Date().toISOString()
        };
        if (!self.tables.has(table)) self.tables.set(table, []);
        self.tables.get(table)!.push(row);
        return {
          single: async () => ({ data: row, error: null }),
          select: (fields = '*') => ({
            single: async () => ({ data: row, error: null }),
          }),
        };
      },
      update: (updateData: any) => ({
        eq: (col: string, value: any) => ({
          async: async () => {
            const updated = allRows.map((row: any) =>
              row[col] === value
                ? { ...row, ...updateData, updated_at: new Date().toISOString() }
                : row
            );
            self.tables.set(table, updated);
            return { data: updated, error: null };
          },
        }),
      }),
      delete: () => ({
        eq: (col: string, value: any) => ({
          async: async () => {
            self.tables.set(table, allRows.filter((row: any) => row[col] !== value));
            return { data: null, error: null };
          },
        }),
      }),
      eq: (col: string, value: any) => createQueryBuilder(allRows).eq(col, value),
    };
  }

  getTable(table: string) {
    return this.tables.get(table) || [];
  }

  clearAll() {
    this.tables.clear();
  }
}

@Injectable()
export class DatabaseService {
  private supabase: any;
  private mockDb = new MockDatabase();
  private usesMock = false;

  constructor(private configService: ConfigService) {
    const dbMode = this.configService.get('DB_MODE') || 'mock';
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseKey = this.configService.get('SUPABASE_SERVICE_KEY');

    if (dbMode === 'supabase' && supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.usesMock = false;
    } else {
      this.supabase = this.mockDb;
      this.usesMock = true;
      console.log('📦 Using Mock Database (in-memory)');
    }
  }

  /**
   * Get the Supabase client or mock database
   * Use this to make queries like: this.db.from('users').select()
   */
  get db() {
    return this.supabase;
  }

  /**
   * Check if using mock database
   */
  isUsingMock() {
    return this.usesMock;
  }

  /**
   * Get mock database instance (for testing/seeding)
   */
  getMockDb() {
    return this.mockDb;
  }

  /**
   * Clear all mock data (useful for testing)
   */
  clearMockData() {
    if (this.usesMock) {
      this.mockDb.clearAll();
    }
  }
}
