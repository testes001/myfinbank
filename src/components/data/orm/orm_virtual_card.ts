// Code generated for virtual_card entity
// Production-ready ORM for Virtual Card Management

import { DataType } from "./common";
import type { Value, Page, Index, Filter, Sort, Data } from "./common";
import { DataStoreClient, CreateData, CreateValue, ParseValue } from "./client";

/**
 * Enumeration for VirtualCardStatus
 */
export enum VirtualCardStatus {
  Unspecified = 0,
  Active = 1,
  Frozen = 2,
  Expired = 3,
  Cancelled = 4,
}

/**
 * Enumeration for VirtualCardType
 */
export enum VirtualCardType {
  Unspecified = 0,
  SingleUse = 1,
  MerchantLocked = 2,
  Recurring = 3,
  Standard = 4,
}

/**
 * Enumeration for CardNetwork
 */
export enum CardNetwork {
  Unspecified = 0,
  Visa = 1,
  Mastercard = 2,
  Amex = 3,
  Discover = 4,
}

/**
 * Interface for VirtualCardModel
 * `id`, `data_creator`, `data_updater`, `create_time`, `update_time` should not be set when INSERTING data since backend will fill it automatically.
 * `id` should keep the original value when setting (updating) data.
 * `data_creator` and `data_updater` are read-only strings (user id) representing the creator and updater of the data record.
 * `create_time` and `update_time` are read-only strings in the format of timestamp (10-digit).
 */
export interface VirtualCardModel {
  id: string;
  data_creator: string;
  data_updater: string;
  create_time: string;
  update_time: string;
  user_id: string;
  account_id: string;
  card_number_last_4: string; // Last 4 digits visible, rest masked
  card_number_encrypted: string; // Encrypted full card number
  expiry_month: string;
  expiry_year: string;
  cvv_encrypted: string; // Encrypted CVV
  nickname: string;
  card_type: VirtualCardType;
  network: CardNetwork;
  merchant_lock?: string | null;
  spending_limit?: string | null; // Store as string for precision
  spent_amount: string; // Store as string for precision
  single_use_used: boolean;
  status: VirtualCardStatus;
  expires_at: string; // ISO timestamp
  last_used_at?: string | null; // ISO timestamp
}

/**
 * ORM class for VirtualCard entity.
 * It uses Singleton pattern to prevent re-initialization.
 */
export class VirtualCardORM {
  private static instance: VirtualCardORM | null = null;
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
    this.entityId = '102019b1bc588777c1abd932f3644c0999c'; // Unique ID for virtual_card
    this.entityName = 'virtual_card';
    this.entityVersion = '102019b3612e2f0746cb43826627dd52e1d';
    this.taskId = '6945235f40179249e0d105dc';
    this.taskRootId = '693be70dec184ca07e4e3fe1';
  }

  /**
   * Get singleton instance of VirtualCardORM
   */
  public static getInstance(): VirtualCardORM {
    if (!VirtualCardORM.instance) {
      VirtualCardORM.instance = new VirtualCardORM();
    }

    return VirtualCardORM.instance;
  }

  /**
   * Get virtual_card by IDs
   * Use this as a batch operation to get multiple records at once.
   */
  async getVirtualCardByIDs(ids: string[]): Promise<VirtualCardModel[]> {
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
   * Delete virtual_card by IDs
   * Use this as a batch operation to delete multiple records at once.
   */
  async deleteVirtualCardByIDs(ids: string[]): Promise<void> {
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
   * Get all VirtualCard records
   * This returns all data without pagination.
   * To query data with page and filter conditions, use `list*()` instead.
   */
  async getAllVirtualCard(): Promise<VirtualCardModel[]> {
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
   * Insert (create) new VirtualCard record(s)
   * DO NOT SET `id`, `data_creator`, `data_updater`, `create_time` and `update_time` since backend will fill it automatically.
   * It will respond the inserted record(s), with `id`, `data_creator`, `data_updater`, `create_time` and `update_time` filled by backend.
   */
  async insertVirtualCard(data: VirtualCardModel[]): Promise<VirtualCardModel[]> {
    const structured = data.map((item) => CreateData(VirtualCardModelToValues(item)));
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
   * List VirtualCard records with filters
   * This function provides search capabilities like filtering, sorting, pagination.
   */
  async listVirtualCard(filter?: Filter, sort?: Sort, paginate?: Page): Promise<[VirtualCardModel[], Page]> {
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
   * Get virtual_card by UserId index
   * This function gets data by index.
   */
  async getVirtualCardByUserId(user_id: string): Promise<VirtualCardModel[]> {
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
   * Set (update) virtual_card by Id index
   * This function replaces data, so the data must be complete.
   * Must keep `id`, `data_creator`, `create_time` unchanged as original data (as fetched).
   * DO NOT SET `data_updater` and `update_time` since backend will fill it automatically.
   * It will respond the set record, with `data_updater` and `update_time` filled by backend.
   */
  async setVirtualCardById(id: string, data: VirtualCardModel): Promise<VirtualCardModel[]> {
    const index = createIndexId(id);

    const values = VirtualCardModelToValues(data);
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
   * Delete virtual_card by Id index
   */
  async deleteVirtualCardById(id: string): Promise<void> {
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
   * Convert result data to VirtualCardModel data array
   */
  private resultToData(values: Data[]): VirtualCardModel[] {
    return values.map((item: Data) => {
      if (item.structured && item.structured.length > 0) {
        return VirtualCardModelFromValues(item.structured);
      }

      if (item.serialized) {
        try {
          const parsedData = JSON.parse(item.serialized) as VirtualCardModel;
          return parsedData;
        } catch (error) {
          console.error('Error parsing serialized VirtualCardModel data: ', error, item.serialized);
          return null;
        }
      }

      return null;
    }).filter((item): item is VirtualCardModel => item !== null);
  }
}

/**
 * Convert VirtualCardModel data to Value array
 */
function VirtualCardModelToValues(data: VirtualCardModel): Value[] {
  const fieldMappings = [
    { key: 'id', type: DataType.string, defaultValue: '' },
    { key: 'data_creator', type: DataType.string, defaultValue: '' },
    { key: 'data_updater', type: DataType.string, defaultValue: '' },
    { key: 'create_time', type: DataType.string, defaultValue: '' },
    { key: 'update_time', type: DataType.string, defaultValue: '' },
    { key: 'user_id', type: DataType.string, defaultValue: '' },
    { key: 'account_id', type: DataType.string, defaultValue: '' },
    { key: 'card_number_last_4', type: DataType.string, defaultValue: '' },
    { key: 'card_number_encrypted', type: DataType.string, defaultValue: '' },
    { key: 'expiry_month', type: DataType.string, defaultValue: '' },
    { key: 'expiry_year', type: DataType.string, defaultValue: '' },
    { key: 'cvv_encrypted', type: DataType.string, defaultValue: '' },
    { key: 'nickname', type: DataType.string, defaultValue: '' },
    { key: 'card_type', type: DataType.enumeration, defaultValue: 0 },
    { key: 'network', type: DataType.enumeration, defaultValue: 0 },
    { key: 'merchant_lock', type: DataType.string, defaultValue: null },
    { key: 'spending_limit', type: DataType.string, defaultValue: null },
    { key: 'spent_amount', type: DataType.string, defaultValue: '0' },
    { key: 'single_use_used', type: DataType.boolean, defaultValue: false },
    { key: 'status', type: DataType.enumeration, defaultValue: 0 },
    { key: 'expires_at', type: DataType.string, defaultValue: '' },
    { key: 'last_used_at', type: DataType.string, defaultValue: null },
  ];

  return fieldMappings.map(({ key, type, defaultValue }) => {
    const value = data[key as keyof VirtualCardModel] ?? defaultValue;
    return CreateValue(type, value, key);
  });
}

/**
 * Convert Value array to VirtualCardModel data
 */
function VirtualCardModelFromValues(values: Value[]): VirtualCardModel {
  const data: Partial<VirtualCardModel> = {};

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
      case 'account_id':
        data.account_id = ParseValue(value, DataType.string) as string;
        break;
      case 'card_number_last_4':
        data.card_number_last_4 = ParseValue(value, DataType.string) as string;
        break;
      case 'card_number_encrypted':
        data.card_number_encrypted = ParseValue(value, DataType.string) as string;
        break;
      case 'expiry_month':
        data.expiry_month = ParseValue(value, DataType.string) as string;
        break;
      case 'expiry_year':
        data.expiry_year = ParseValue(value, DataType.string) as string;
        break;
      case 'cvv_encrypted':
        data.cvv_encrypted = ParseValue(value, DataType.string) as string;
        break;
      case 'nickname':
        data.nickname = ParseValue(value, DataType.string) as string;
        break;
      case 'card_type':
        data.card_type = ParseValue(value, DataType.enumeration) as VirtualCardType;
        break;
      case 'network':
        data.network = ParseValue(value, DataType.enumeration) as CardNetwork;
        break;
      case 'merchant_lock':
        data.merchant_lock = ParseValue(value, DataType.string) as string | null;
        break;
      case 'spending_limit':
        data.spending_limit = ParseValue(value, DataType.string) as string | null;
        break;
      case 'spent_amount':
        data.spent_amount = ParseValue(value, DataType.string) as string;
        break;
      case 'single_use_used':
        data.single_use_used = ParseValue(value, DataType.boolean) as boolean;
        break;
      case 'status':
        data.status = ParseValue(value, DataType.enumeration) as VirtualCardStatus;
        break;
      case 'expires_at':
        data.expires_at = ParseValue(value, DataType.string) as string;
        break;
      case 'last_used_at':
        data.last_used_at = ParseValue(value, DataType.string) as string | null;
        break;
    }
  }

  return data as VirtualCardModel;
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

export default VirtualCardORM;
