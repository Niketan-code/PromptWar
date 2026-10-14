
import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

// Database paths
const DB_PATH = path.resolve(process.cwd(), 'citypulse.sqlite');
const SCHEMA_PATH = path.resolve(__dirname, 'schema.sql');

// Path to the sql.js WebAssembly file
const WASM_PATH = require.resolve('sql.js/dist/sql-wasm.wasm');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs({
    locateFile: (file: string) => {
      if (file.endsWith('.wasm')) {
        return WASM_PATH;
      }
      return file;
    },
  });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Ensure schema exists
  if (fs.existsSync(SCHEMA_PATH)) {
    const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    dbInstance.run(schemaSql);
    saveDb();
  }

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;

  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

export async function queryAll<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);

  if (params.length > 0) {
    stmt.bind(params);
  }

  const results: T[] = [];

  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }

  stmt.free();
  return results;
}

export async function queryOne<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | null> {
  const results = await queryAll<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

export async function execute(
  sql: string,
  params: any[] = []
): Promise<void> {
  const db = await getDb();

  if (params.length > 0) {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
  } else {
    db.run(sql);
  }

  saveDb();
}

