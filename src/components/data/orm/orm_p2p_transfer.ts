// Code generated for p2p_transfer entity
// Production-ready ORM for P2P Transfer Management

import { DataType } from "./common";
import type { Value, Page, Index, Filter, Sort, Data } from "./common";
import { DataStoreClient, CreateData, CreateValue, ParseValue } from "./client";

/**
 * Enumeration for P2PTransferStatus
 */
export enum P2PTransferStatus {
  Unspecified = 0,
  Pending = 1,
  Completed = 2,
  Failed = 3,
}

/**
 * Interface for P2PTransferModel
 * `id`, `data_creator`, `data_updater`, `create_time`, `update_time` should not be set when INSERTING data since backend will fill it automatically.
 * `id` should keep the original value when setting (updating) data.
 * `data_creator` and `data_updater` are read-only strings (user id) representing the creator and updater of the data record.
 * `create_time` and `update_time` are read-only strings in the format of timestamp (10-digit).
 */
export interface P2PTransferModel {
  id: string;
  data_creator: string;
  data_updater: string;
  create_time: string;
  update_time: string;
  from_user_id: string;
  to_contact_id: string;
  to_name: string;
  amount: string; // Store as string for precision
  note?: string | null;
  status: P2PTransferStatus;
}

/**
 * ORM class for P2PTransfer entity.
 * It uses Singleton pattern to prevent re-initialization.
 */
export class P2PTransferORM {
  private static instance: P2PTransferORM | null = null;
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
    this.entityId = '102019b1bc588777c1abd932f3644c1200f'; // Unique ID for p2p_transfer
    this.entityName = 'p2p_transfer';
    this.entityVersion = '102019b3612e2f0746cb43826627dd52e1d';
    this.taskId = '6945235f40179249e0d105dc';
    this.taskRootId = '693be70dec184ca07e4e3fe1';
  }

  /**
   * Get singleton instance of P2PTransferORM
   */
  public static getInstance(): P2PTransferORM {
    if (!P2PTransferORM.instance) {
      P2PTransferORM.instance = new P2PTransferORM();
    }

    return P2PTransferORM.instance;
  }

  /**
   * Get p2p_transfer by IDs
   * Use this as a batch operation to get multiple records at once.
   */
  async getP2PTransferByIDs(ids: string[]): Promise<P2PTransferModel[]> {
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
   * Delete p2p_transfer by IDs
   * Use this as a batch operation to delete multiple records at once.
   */
  async deleteP2PTransferByIDs(ids: string[]): Promise<void> {
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
   * Get all P2PTransfer records
   * This returns all data without pagination.
   * To query data with page and filter conditions, use `list*()` instead.
   */
  async getAllP2PTransfer(): Promise<P2PTransferModel[]> {
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
   * Insert (create) new P2PTransfer record(s)
   * DO NOT SET `id`, `data_creator`, `data_updater`, `create_time` and `update_time` since backend will fill it automatically.
   * It will respond the inserted record(s), with `id`, `data_creator`, `data_updater`, `create_time` and `update_time` filled by backend.
   */
  async insertP2PTransfer(data: P2PTransferModel[]): Promise<P2PTransferModel[]> {
    const structured = data.map((item) => CreateData(P2PTransferModelToValues(item)));
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
   * List P2PTransfer records with filters
   * This function provides search capabilities like filtering, sorting, pagination.
   */
  async listP2PTransfer(filter?: Filter, sort?: Sort, paginate?: Page): Promise<[P2PTransferModel[], Page]> {
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
   * Get p2p_transfer by FromUserId index
   * This function gets data by index.
   */
  async getP2PTransferByFromUserId(from_user_id: string): Promise<P2PTransferModel[]> {
    const index = createIndexFromUserId(from_user_id);

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
   * Set (update) p2p_transfer by Id index
   * This function replaces data, so the data must be complete.
   * Must keep `id`, `data_creator`, `create_time` unchanged as original data (as fetched).
   * DO NOT SET `data_updater` and `update_time` since backend will fill it automatically.
   * It will respond the set record, with `data_updater` and `update_time` filled by backend.
   */
  async setP2PTransferById(id: string, data: P2PTransferModel): Promise<P2PTransferModel[]> {
    const index = createIndexId(id);

    const values = P2PTransferModelToValues(data);
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
   * Delete p2p_transfer by Id index
   */
  async deleteP2PTransferById(id: string): Promise<void> {
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
   * Convert result data to P2PTransferModel data array
   */
  private resultToData(values: Data[]): P2PTransferModel[] {
    return values.map((item: Data) => {
      if (item.structured && item.structured.length > 0) {
        return P2PTransferModelFromValues(item.structured);
      }

      if (item.serialized) {
        try {
          const parsedData = JSON.parse(item.serialized) as P2PTransferModel;
          return parsedData;
        } catch (error) {
          console.error('Error parsing serialized P2PTransferModel data: ', error, item.serialized);
          return null;
        }
      }

      return null;
    }).filter((item): item is P2PTransferModel => item !== null);
  }
}

/**
 * Convert P2PTransferModel data to Value array
 */
function P2PTransferModelToValues(data: P2PTransferModel): Value[] {
  const fieldMappings = [
    { key: 'id', type: DataType.string, defaultValue: '' },
    { key: 'data_creator', type: DataType.string, defaultValue: '' },
    { key: 'data_updater', type: DataType.string, defaultValue: '' },
    { key: 'create_time', type: DataType.string, defaultValue: '' },
    { key: 'update_time', type: DataType.string, defaultValue: '' },
    { key: 'from_user_id', type: DataType.string, defaultValue: '' },
    { key: 'to_contact_id', type: DataType.string, defaultValue: '' },
    { key: 'to_name', type: DataType.string, defaultValue: '' },
    { key: 'amount', type: DataType.string, defaultValue: '0' },
    { key: 'note', type: DataType.string, defaultValue: null },
    { key: 'status', type: DataType.enumeration, defaultValue: 0 },
  ];

  return fieldMappings.map(({ key, type, defaultValue }) => {
    const value = data[key as keyof P2PTransferModel] ?? defaultValue;
    return CreateValue(type, value, key);
  });
}

/**
 * Convert Value array to P2PTransferModel data
 */
function P2PTransferModelFromValues(values: Value[]): P2PTransferModel {
  const data: Partial<P2PTransferModel> = {};

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
      case 'from_user_id':
        data.from_user_id = ParseValue(value, DataType.string) as string;
        break;
      case 'to_contact_id':
        data.to_contact_id = ParseValue(value, DataType.string) as string;
        break;
      case 'to_name':
        data.to_name = ParseValue(value, DataType.string) as string;
        break;
      case 'amount':
        data.amount = ParseValue(value, DataType.string) as string;
        break;
      case 'note':
        data.note = ParseValue(value, DataType.string) as string | null;
        break;
      case 'status':
        data.status = ParseValue(value, DataType.enumeration) as P2PTransferStatus;
        break;
    }
  }

  return data as P2PTransferModel;
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
 * Create index for FromUserId fields
 */
function createIndexFromUserId(from_user_id: string): Index {
  const values: Value[] = [
    CreateValue(DataType.string, from_user_id, 'from_user_id'),
  ];

  return {
    fields: ['from_user_id'],
    values
  };
}

export default P2PTransferORM;
