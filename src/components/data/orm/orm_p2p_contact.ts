// Code generated for p2p_contact entity
// Production-ready ORM for P2P Contact Management

import { DataType } from "./common";
import type { Value, Page, Index, Filter, Sort, Data } from "./common";
import { DataStoreClient, CreateData, CreateValue, ParseValue } from "./client";

/**
 * Interface for P2PContactModel
 * `id`, `data_creator`, `data_updater`, `create_time`, `update_time` should not be set when INSERTING data since backend will fill it automatically.
 * `id` should keep the original value when setting (updating) data.
 * `data_creator` and `data_updater` are read-only strings (user id) representing the creator and updater of the data record.
 * `create_time` and `update_time` are read-only strings in the format of timestamp (10-digit).
 */
export interface P2PContactModel {
  id: string;
  data_creator: string;
  data_updater: string;
  create_time: string;
  update_time: string;
  user_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_favorite: boolean;
  last_transfer_at?: string | null; // ISO timestamp
}

/**
 * ORM class for P2PContact entity.
 * It uses Singleton pattern to prevent re-initialization.
 */
export class P2PContactORM {
  private static instance: P2PContactORM | null = null;
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
    this.entityId = '102019b1bc588777c1abd932f3644c1100e'; // Unique ID for p2p_contact
    this.entityName = 'p2p_contact';
    this.entityVersion = '102019b3612e2f0746cb43826627dd52e1d';
    this.taskId = '6945235f40179249e0d105dc';
    this.taskRootId = '693be70dec184ca07e4e3fe1';
  }

  /**
   * Get singleton instance of P2PContactORM
   */
  public static getInstance(): P2PContactORM {
    if (!P2PContactORM.instance) {
      P2PContactORM.instance = new P2PContactORM();
    }

    return P2PContactORM.instance;
  }

  /**
   * Get p2p_contact by IDs
   * Use this as a batch operation to get multiple records at once.
   */
  async getP2PContactByIDs(ids: string[]): Promise<P2PContactModel[]> {
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
   * Delete p2p_contact by IDs
   * Use this as a batch operation to delete multiple records at once.
   */
  async deleteP2PContactByIDs(ids: string[]): Promise<void> {
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
   * Get all P2PContact records
   * This returns all data without pagination.
   * To query data with page and filter conditions, use `list*()` instead.
   */
  async getAllP2PContact(): Promise<P2PContactModel[]> {
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
   * Insert (create) new P2PContact record(s)
   * DO NOT SET `id`, `data_creator`, `data_updater`, `create_time` and `update_time` since backend will fill it automatically.
   * It will respond the inserted record(s), with `id`, `data_creator`, `data_updater`, `create_time` and `update_time` filled by backend.
   */
  async insertP2PContact(data: P2PContactModel[]): Promise<P2PContactModel[]> {
    const structured = data.map((item) => CreateData(P2PContactModelToValues(item)));
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
   * List P2PContact records with filters
   * This function provides search capabilities like filtering, sorting, pagination.
   */
  async listP2PContact(filter?: Filter, sort?: Sort, paginate?: Page): Promise<[P2PContactModel[], Page]> {
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
   * Get p2p_contact by UserId index
   * This function gets data by index.
   */
  async getP2PContactByUserId(user_id: string): Promise<P2PContactModel[]> {
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
   * Set (update) p2p_contact by Id index
   * This function replaces data, so the data must be complete.
   * Must keep `id`, `data_creator`, `create_time` unchanged as original data (as fetched).
   * DO NOT SET `data_updater` and `update_time` since backend will fill it automatically.
   * It will respond the set record, with `data_updater` and `update_time` filled by backend.
   */
  async setP2PContactById(id: string, data: P2PContactModel): Promise<P2PContactModel[]> {
    const index = createIndexId(id);

    const values = P2PContactModelToValues(data);
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
   * Delete p2p_contact by Id index
   */
  async deleteP2PContactById(id: string): Promise<void> {
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
   * Convert result data to P2PContactModel data array
   */
  private resultToData(values: Data[]): P2PContactModel[] {
    return values.map((item: Data) => {
      if (item.structured && item.structured.length > 0) {
        return P2PContactModelFromValues(item.structured);
      }

      if (item.serialized) {
        try {
          const parsedData = JSON.parse(item.serialized) as P2PContactModel;
          return parsedData;
        } catch (error) {
          console.error('Error parsing serialized P2PContactModel data: ', error, item.serialized);
          return null;
        }
      }

      return null;
    }).filter((item): item is P2PContactModel => item !== null);
  }
}

/**
 * Convert P2PContactModel data to Value array
 */
function P2PContactModelToValues(data: P2PContactModel): Value[] {
  const fieldMappings = [
    { key: 'id', type: DataType.string, defaultValue: '' },
    { key: 'data_creator', type: DataType.string, defaultValue: '' },
    { key: 'data_updater', type: DataType.string, defaultValue: '' },
    { key: 'create_time', type: DataType.string, defaultValue: '' },
    { key: 'update_time', type: DataType.string, defaultValue: '' },
    { key: 'user_id', type: DataType.string, defaultValue: '' },
    { key: 'name', type: DataType.string, defaultValue: '' },
    { key: 'email', type: DataType.string, defaultValue: null },
    { key: 'phone', type: DataType.string, defaultValue: null },
    { key: 'avatar_url', type: DataType.string, defaultValue: null },
    { key: 'is_favorite', type: DataType.boolean, defaultValue: false },
    { key: 'last_transfer_at', type: DataType.string, defaultValue: null },
  ];

  return fieldMappings.map(({ key, type, defaultValue }) => {
    const value = data[key as keyof P2PContactModel] ?? defaultValue;
    return CreateValue(type, value, key);
  });
}

/**
 * Convert Value array to P2PContactModel data
 */
function P2PContactModelFromValues(values: Value[]): P2PContactModel {
  const data: Partial<P2PContactModel> = {};

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
      case 'email':
        data.email = ParseValue(value, DataType.string) as string | null;
        break;
      case 'phone':
        data.phone = ParseValue(value, DataType.string) as string | null;
        break;
      case 'avatar_url':
        data.avatar_url = ParseValue(value, DataType.string) as string | null;
        break;
      case 'is_favorite':
        data.is_favorite = ParseValue(value, DataType.boolean) as boolean;
        break;
      case 'last_transfer_at':
        data.last_transfer_at = ParseValue(value, DataType.string) as string | null;
        break;
    }
  }

  return data as P2PContactModel;
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

export default P2PContactORM;
