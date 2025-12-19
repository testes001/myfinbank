// Code generated for savings_goal entity
// Production-ready ORM for Savings Goals Management

import { DataType } from "./common";
import type { Value, Page, Index, Filter, Sort, Data } from "./common";
import { DataStoreClient, CreateData, CreateValue, ParseValue } from "./client";

/**
 * Enumeration for AutoSaveFrequency
 */
export enum AutoSaveFrequency {
  Unspecified = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
}

/**
 * Interface for SavingsGoalModel
 * `id`, `data_creator`, `data_updater`, `create_time`, `update_time` should not be set when INSERTING data since backend will fill it automatically.
 * `id` should keep the original value when setting (updating) data.
 * `data_creator` and `data_updater` are read-only strings (user id) representing the creator and updater of the data record.
 * `create_time` and `update_time` are read-only strings in the format of timestamp (10-digit).
 */
export interface SavingsGoalModel {
  id: string;
  data_creator: string;
  data_updater: string;
  create_time: string;
  update_time: string;
  user_id: string;
  name: string;
  category: string;
  target_amount: string; // Store as string for precision
  current_amount: string; // Store as string for precision
  deadline?: string | null; // ISO timestamp
  auto_save_amount?: string | null; // Store as string for precision
  auto_save_frequency?: AutoSaveFrequency | null;
  completed_at?: string | null; // ISO timestamp
  streak_days: number;
  last_contribution?: string | null; // ISO timestamp
}

/**
 * ORM class for SavingsGoal entity.
 * It uses Singleton pattern to prevent re-initialization.
 */
export class SavingsGoalORM {
  private static instance: SavingsGoalORM | null = null;
  protected client: DataStoreClient;
  protected namespace: string;
  protected entityId: string;
  protected entityName: string;
  protected entityVersion: string;
  protected taskId: string;
  protected taskRootId: string;

  private constructor() {
    this.client = DataStoreClient.getInstance();
    this.namespace = '01987547fc6c72ecb453bd2736bd4ea0';
    this.entityId = '102019b1bc588777c1abd932f3644c1000d'; // Unique ID for savings_goal
    this.entityName = 'savings_goal';
    this.entityVersion = '102019b3612e2f0746cb43826627dd52e1d';
    this.taskId = '6945235f40179249e0d105dc';
    this.taskRootId = '693be70dec184ca07e4e3fe1';
  }

  /**
   * Get singleton instance of SavingsGoalORM
   */
  public static getInstance(): SavingsGoalORM {
    if (!SavingsGoalORM.instance) {
      SavingsGoalORM.instance = new SavingsGoalORM();
    }

    return SavingsGoalORM.instance;
  }

  /**
   * Get savings_goal by IDs
   * Use this as a batch operation to get multiple records at once.
   */
  async getSavingsGoalByIDs(ids: string[]): Promise<SavingsGoalModel[]> {
    const response = await this.client.get({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      ids: ids,
      format: {
        structured: true
      }
    });

    return this.resultToData(response.data?.values || []);
  }

  /**
   * Delete savings_goal by IDs
   * Use this as a batch operation to delete multiple records at once.
   */
  async deleteSavingsGoalByIDs(ids: string[]): Promise<void> {
    await this.client.delete({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      ids: ids,
      format: {
        structured: true
      }
    });
  }

  /**
   * Get all SavingsGoal records
   * This returns all data without pagination.
   * To query data with page and filter conditions, use `list*()` instead.
   */
  async getAllSavingsGoal(): Promise<SavingsGoalModel[]> {
    const response = await this.client.all({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      format: {
        structured: true
      }
    });
    return this.resultToData(response.data?.values || []);
  }

  /**
   * Insert (create) new SavingsGoal record(s)
   * DO NOT SET `id`, `data_creator`, `data_updater`, `create_time` and `update_time` since backend will fill it automatically.
   * It will respond the inserted record(s), with `id`, `data_creator`, `data_updater`, `create_time` and `update_time` filled by backend.
   */
  async insertSavingsGoal(data: SavingsGoalModel[]): Promise<SavingsGoalModel[]> {
    const structured = data.map((item) => CreateData(SavingsGoalModelToValues(item)));
    const response = await this.client.insert({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      batch: structured,
      format: {
        structured: true
      }
    });
    return this.resultToData(response.data?.values || []);
  }

  /**
   * List SavingsGoal records with filters
   * This function provides search capabilities like filtering, sorting, pagination.
   */
  async listSavingsGoal(filter?: Filter, sort?: Sort, paginate?: Page): Promise<[SavingsGoalModel[], Page]> {
    const response = await this.client.list({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      filter: filter,
      sort: sort,
      paginate: paginate,
      format: {
        structured: true
      }
    });
    return [this.resultToData(response.data?.values || []), response.data?.page || { number: 0, size: 0 }];
  }

  /**
   * Get savings_goal by UserId index
   * This function gets data by index.
   */
  async getSavingsGoalByUserId(user_id: string): Promise<SavingsGoalModel[]> {
    const index = createIndexUserId(user_id);

    const response = await this.client.get({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      index: index,
      format: {
        structured: true
      }
    });

    return this.resultToData(response.data?.values || []);
  }

  /**
   * Set (update) savings_goal by Id index
   * This function replaces data, so the data must be complete.
   * Must keep `id`, `data_creator`, `create_time` unchanged as original data (as fetched).
   * DO NOT SET `data_updater` and `update_time` since backend will fill it automatically.
   * It will respond the set record, with `data_updater` and `update_time` filled by backend.
   */
  async setSavingsGoalById(id: string, data: SavingsGoalModel): Promise<SavingsGoalModel[]> {
    const index = createIndexId(id);

    const values = SavingsGoalModelToValues(data);
    const structuredData = CreateData(values);

    const response = await this.client.set({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      index: index,
      data: structuredData,
      format: {
        structured: true
      }
    });

    return this.resultToData(response.data?.values || []);
  }

  /**
   * Delete savings_goal by Id index
   */
  async deleteSavingsGoalById(id: string): Promise<void> {
    const index = createIndexId(id);

    await this.client.delete({
      id: this.entityId,
      namespace: this.namespace,
      name: this.entityName,
      version: this.entityVersion,
      task: this.taskId,
      index: index,
      format: {
        structured: true
      }
    });
  }

  /**
   * Convert result data to SavingsGoalModel data array
   */
  private resultToData(values: Data[]): SavingsGoalModel[] {
    return values.map((item: Data) => {
      if (item.structured && item.structured.length > 0) {
        return SavingsGoalModelFromValues(item.structured);
      }

      if (item.serialized) {
        try {
          const parsedData = JSON.parse(item.serialized) as SavingsGoalModel;
          return parsedData;
        } catch (error) {
          console.error('Error parsing serialized SavingsGoalModel data: ', error, item.serialized);
          return null;
        }
      }

      return null;
    }).filter((item): item is SavingsGoalModel => item !== null);
  }
}

/**
 * Convert SavingsGoalModel data to Value array
 */
function SavingsGoalModelToValues(data: SavingsGoalModel): Value[] {
  const fieldMappings = [
    { key: 'id', type: DataType.string, defaultValue: '' },
    { key: 'data_creator', type: DataType.string, defaultValue: '' },
    { key: 'data_updater', type: DataType.string, defaultValue: '' },
    { key: 'create_time', type: DataType.string, defaultValue: '' },
    { key: 'update_time', type: DataType.string, defaultValue: '' },
    { key: 'user_id', type: DataType.string, defaultValue: '' },
    { key: 'name', type: DataType.string, defaultValue: '' },
    { key: 'category', type: DataType.string, defaultValue: '' },
    { key: 'target_amount', type: DataType.string, defaultValue: '0' },
    { key: 'current_amount', type: DataType.string, defaultValue: '0' },
    { key: 'deadline', type: DataType.string, defaultValue: null },
    { key: 'auto_save_amount', type: DataType.string, defaultValue: null },
    { key: 'auto_save_frequency', type: DataType.enumeration, defaultValue: null },
    { key: 'completed_at', type: DataType.string, defaultValue: null },
    { key: 'streak_days', type: DataType.number, defaultValue: 0 },
    { key: 'last_contribution', type: DataType.string, defaultValue: null },
  ];

  return fieldMappings.map(({ key, type, defaultValue }) => {
    const value = data[key as keyof SavingsGoalModel] ?? defaultValue;
    return CreateValue(type, value, key);
  });
}

/**
 * Convert Value array to SavingsGoalModel data
 */
function SavingsGoalModelFromValues(values: Value[]): SavingsGoalModel {
  const data: Partial<SavingsGoalModel> = {};

  for (const value of values) {
    if (!value.name) continue;

    switch (value.name) {
      case 'id':
        data.id = ParseValue(value, DataType.string) as string;
        break;
      case 'data_creator':
        data.data_creator = ParseValue(value, DataType.string) as string;
        break;
      case 'data_updater':
        data.data_updater = ParseValue(value, DataType.string) as string;
        break;
      case 'create_time':
        data.create_time = ParseValue(value, DataType.string) as string;
        break;
      case 'update_time':
        data.update_time = ParseValue(value, DataType.string) as string;
        break;
      case 'user_id':
        data.user_id = ParseValue(value, DataType.string) as string;
        break;
      case 'name':
        data.name = ParseValue(value, DataType.string) as string;
        break;
      case 'category':
        data.category = ParseValue(value, DataType.string) as string;
        break;
      case 'target_amount':
        data.target_amount = ParseValue(value, DataType.string) as string;
        break;
      case 'current_amount':
        data.current_amount = ParseValue(value, DataType.string) as string;
        break;
      case 'deadline':
        data.deadline = ParseValue(value, DataType.string) as string | null;
        break;
      case 'auto_save_amount':
        data.auto_save_amount = ParseValue(value, DataType.string) as string | null;
        break;
      case 'auto_save_frequency':
        data.auto_save_frequency = ParseValue(value, DataType.enumeration) as AutoSaveFrequency | null;
        break;
      case 'completed_at':
        data.completed_at = ParseValue(value, DataType.string) as string | null;
        break;
      case 'streak_days':
        data.streak_days = ParseValue(value, DataType.number) as number;
        break;
      case 'last_contribution':
        data.last_contribution = ParseValue(value, DataType.string) as string | null;
        break;
    }
  }

  return data as SavingsGoalModel;
}

/**
 * Create index for Id fields
 */
function createIndexId(id: string): Index {
  const values: Value[] = [
    CreateValue(DataType.string, id, 'id'),
  ];

  return {
    fields: ['id'],
    values
  };
}

/**
 * Create index for UserId fields
 */
function createIndexUserId(user_id: string): Index {
  const values: Value[] = [
    CreateValue(DataType.string, user_id, 'user_id'),
  ];

  return {
    fields: ['user_id'],
    values
  };
}

export default SavingsGoalORM;
