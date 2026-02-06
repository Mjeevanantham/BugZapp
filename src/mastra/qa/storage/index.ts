import type { QaStorage } from './storage';
import { LocalJsonQaStorage } from './local-json-storage';
import { SqliteQaStorage } from './sqlite-storage';

export type QaStorageType = 'json' | 'sqlite';

export type QaStorageConfig = {
  type?: QaStorageType;
  baseDir?: string;
  sqlitePath?: string;
};

let defaultStorage: QaStorage | null = null;

export const getDefaultQaStorage = (config?: QaStorageConfig): QaStorage => {
  if (!defaultStorage || config) {
    defaultStorage = createQaStorage(config ?? resolveStorageConfig());
  }
  return defaultStorage;
};

export const createQaStorage = (config: QaStorageConfig): QaStorage => {
  const resolvedType = config.type ?? 'json';
  if (resolvedType === 'sqlite') {
    return new SqliteQaStorage({ sqlitePath: config.sqlitePath });
  }
  return new LocalJsonQaStorage({ baseDir: config.baseDir });
};

const resolveStorageConfig = (): QaStorageConfig => {
  const rawType = process.env.QA_STORAGE_TYPE?.toLowerCase();
  const type = rawType === 'sqlite' ? 'sqlite' : 'json';
  return {
    type,
    baseDir: process.env.QA_STORAGE_DIR,
    sqlitePath: process.env.QA_STORAGE_SQLITE_PATH,
  };
};
