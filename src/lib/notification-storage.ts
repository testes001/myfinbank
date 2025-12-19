/**
 * Notification Storage and WebSocket Simulation for Banking App
 * Provides real-time notification support with localStorage persistence
 */

export type NotificationType =
  | "transaction"
  | "security"
  | "balance_alert"
  | "bill_reminder"
  | "deposit"
  | "recurring_transfer"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, unknown>;
}

export interface BalanceAlert {
  id: string;
  userId: string;
  accountId: string;
  type: "low_balance" | "high_balance" | "large_transaction";
  threshold: number;
  enabled: boolean;
  createdAt: string;
}

const NOTIFICATIONS_KEY = "banking_notifications";
const BALANCE_ALERTS_KEY = "banking_balance_alerts";
const NOTIFICATION_SETTINGS_KEY = "banking_notification_settings";

// WebSocket simulation using events
type NotificationCallback = (notification: Notification) => void;
const listeners: Set<NotificationCallback> = new Set();

export function subscribeToNotifications(callback: NotificationCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(notification: Notification): void {
  listeners.forEach(callback => callback(notification));
}

// Generate unique ID
function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get all notifications for a user
export function getNotifications(userId: string): Notification[] {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return [];

  try {
    const allNotifications = JSON.parse(data) as Notification[];
    return allNotifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
}

// Get unread count
export function getUnreadCount(userId: string): number {
  return getNotifications(userId).filter(n => !n.read).length;
}

// Add a notification
export function addNotification(
  notification: Omit<Notification, "id" | "timestamp" | "read">
): Notification {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  const allNotifications: Notification[] = data ? JSON.parse(data) : [];

  const newNotification: Notification = {
    ...notification,
    id: generateId(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  allNotifications.unshift(newNotification);

  // Keep only last 100 notifications per user
  const userNotifications = allNotifications.filter(n => n.userId === notification.userId);
  const otherNotifications = allNotifications.filter(n => n.userId !== notification.userId);
  const trimmedUserNotifications = userNotifications.slice(0, 100);

  localStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify([...trimmedUserNotifications, ...otherNotifications])
  );

  // Notify all listeners (simulates WebSocket push)
  notifyListeners(newNotification);

  return newNotification;
}

// Mark notification as read
export function markAsRead(notificationId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return;

  const notifications: Notification[] = JSON.parse(data);
  const updated = notifications.map(n =>
    n.id === notificationId ? { ...n, read: true } : n
  );

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// Mark all notifications as read for a user
export function markAllAsRead(userId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return;

  const notifications: Notification[] = JSON.parse(data);
  const updated = notifications.map(n =>
    n.userId === userId ? { ...n, read: true } : n
  );

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
}

// Delete a notification
export function deleteNotification(notificationId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return;

  const notifications: Notification[] = JSON.parse(data);
  const filtered = notifications.filter(n => n.id !== notificationId);

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}

// Clear all notifications for a user
export function clearAllNotifications(userId: string): void {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return;

  const notifications: Notification[] = JSON.parse(data);
  const filtered = notifications.filter(n => n.userId !== userId);

  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
}

// Balance Alert Management
export function getBalanceAlerts(userId: string): BalanceAlert[] {
  const data = localStorage.getItem(BALANCE_ALERTS_KEY);
  if (!data) return [];

  try {
    const allAlerts = JSON.parse(data) as BalanceAlert[];
    return allAlerts.filter(a => a.userId === userId);
  } catch {
    return [];
  }
}

export function addBalanceAlert(
  alert: Omit<BalanceAlert, "id" | "createdAt">
): BalanceAlert {
  const data = localStorage.getItem(BALANCE_ALERTS_KEY);
  const allAlerts: BalanceAlert[] = data ? JSON.parse(data) : [];

  const newAlert: BalanceAlert = {
    ...alert,
    id: `alert_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  allAlerts.push(newAlert);
  localStorage.setItem(BALANCE_ALERTS_KEY, JSON.stringify(allAlerts));

  return newAlert;
}

export function updateBalanceAlert(alertId: string, updates: Partial<BalanceAlert>): void {
  const data = localStorage.getItem(BALANCE_ALERTS_KEY);
  if (!data) return;

  const alerts: BalanceAlert[] = JSON.parse(data);
  const updated = alerts.map(a =>
    a.id === alertId ? { ...a, ...updates } : a
  );

  localStorage.setItem(BALANCE_ALERTS_KEY, JSON.stringify(updated));
}

export function deleteBalanceAlert(alertId: string): void {
  const data = localStorage.getItem(BALANCE_ALERTS_KEY);
  if (!data) return;

  const alerts: BalanceAlert[] = JSON.parse(data);
  const filtered = alerts.filter(a => a.id !== alertId);

  localStorage.setItem(BALANCE_ALERTS_KEY, JSON.stringify(filtered));
}

// Check balance against alerts and trigger notifications
export function checkBalanceAlerts(
  userId: string,
  accountId: string,
  balance: number,
  transactionAmount?: number
): void {
  const alerts = getBalanceAlerts(userId);

  for (const alert of alerts) {
    if (!alert.enabled || alert.accountId !== accountId) continue;

    if (alert.type === "low_balance" && balance < alert.threshold) {
      addNotification({
        userId,
        type: "balance_alert",
        priority: "high",
        title: "Low Balance Alert",
        message: `Your account balance ($${balance.toFixed(2)}) has fallen below your threshold of $${alert.threshold.toFixed(2)}`,
        data: { accountId, balance, threshold: alert.threshold },
      });
    }

    if (alert.type === "high_balance" && balance > alert.threshold) {
      addNotification({
        userId,
        type: "balance_alert",
        priority: "medium",
        title: "High Balance Alert",
        message: `Your account balance ($${balance.toFixed(2)}) has exceeded your threshold of $${alert.threshold.toFixed(2)}`,
        data: { accountId, balance, threshold: alert.threshold },
      });
    }

    if (alert.type === "large_transaction" && transactionAmount && transactionAmount >= alert.threshold) {
      addNotification({
        userId,
        type: "balance_alert",
        priority: "high",
        title: "Large Transaction Alert",
        message: `A transaction of $${transactionAmount.toFixed(2)} was detected, exceeding your threshold of $${alert.threshold.toFixed(2)}`,
        data: { accountId, amount: transactionAmount, threshold: alert.threshold },
      });
    }
  }
}

// Notification Settings
export interface NotificationSettings {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  transactions: boolean;
  security: boolean;
  balanceAlerts: boolean;
  billReminders: boolean;
  marketing: boolean;
}

export function getNotificationSettings(userId: string): NotificationSettings {
  const data = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (!data) {
    return {
      userId,
      email: true,
      push: true,
      sms: false,
      transactions: true,
      security: true,
      balanceAlerts: true,
      billReminders: true,
      marketing: false,
    };
  }

  try {
    const allSettings = JSON.parse(data) as NotificationSettings[];
    const userSettings = allSettings.find(s => s.userId === userId);
    return userSettings || {
      userId,
      email: true,
      push: true,
      sms: false,
      transactions: true,
      security: true,
      balanceAlerts: true,
      billReminders: true,
      marketing: false,
    };
  } catch {
    return {
      userId,
      email: true,
      push: true,
      sms: false,
      transactions: true,
      security: true,
      balanceAlerts: true,
      billReminders: true,
      marketing: false,
    };
  }
}

export function updateNotificationSettings(settings: NotificationSettings): void {
  const data = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  const allSettings: NotificationSettings[] = data ? JSON.parse(data) : [];

  const existingIndex = allSettings.findIndex(s => s.userId === settings.userId);
  if (existingIndex >= 0) {
    allSettings[existingIndex] = settings;
  } else {
    allSettings.push(settings);
  }

  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(allSettings));
}

// Helper to create common notification types
export function createTransactionNotification(
  userId: string,
  type: "sent" | "received",
  amount: number,
  recipientOrSender?: string
): Notification {
  return addNotification({
    userId,
    type: "transaction",
    priority: "medium",
    title: type === "sent" ? "Money Sent" : "Money Received",
    message: type === "sent"
      ? `You sent $${amount.toFixed(2)}${recipientOrSender ? ` to ${recipientOrSender}` : ""}`
      : `You received $${amount.toFixed(2)}${recipientOrSender ? ` from ${recipientOrSender}` : ""}`,
    data: { amount, type, counterparty: recipientOrSender },
  });
}

export function createSecurityNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Notification {
  return addNotification({
    userId,
    type: "security",
    priority: "critical",
    title,
    message,
    data,
  });
}
