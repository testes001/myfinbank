import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  subscribeToNotifications,
  type Notification,
  type NotificationType,
} from "@/lib/notification-storage";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  DollarSign,
  Shield,
  AlertTriangle,
  FileText,
  RefreshCw,
  Settings,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NotificationCenterProps {
  variant?: "icon" | "full";
}

export function NotificationCenter({ variant = "icon" }: NotificationCenterProps) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");

  const loadNotifications = useCallback(() => {
    if (!currentUser) return;
    const notifs = getNotifications(currentUser.user.id);
    setNotifications(notifs);
    setUnreadCount(getUnreadCount(currentUser.user.id));
  }, [currentUser]);

  useEffect(() => {
    loadNotifications();

    // Subscribe to real-time notifications
    const unsubscribe = subscribeToNotifications((notification) => {
      if (notification.userId === currentUser?.user.id) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [currentUser, loadNotifications]);

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    if (!currentUser) return;
    markAllAsRead(currentUser.user.id);
    loadNotifications();
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    if (!currentUser) return;
    clearAllNotifications(currentUser.user.id);
    loadNotifications();
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "transaction":
        return <DollarSign className="size-4" />;
      case "security":
        return <Shield className="size-4" />;
      case "balance_alert":
        return <AlertTriangle className="size-4" />;
      case "bill_reminder":
        return <FileText className="size-4" />;
      case "deposit":
        return <DollarSign className="size-4" />;
      case "recurring_transfer":
        return <RefreshCw className="size-4" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "transaction":
        return "bg-green-500/20 text-green-400";
      case "security":
        return "bg-red-500/20 text-red-400";
      case "balance_alert":
        return "bg-yellow-500/20 text-yellow-400";
      case "bill_reminder":
        return "bg-blue-500/20 text-blue-400";
      case "deposit":
        return "bg-green-500/20 text-green-400";
      case "recurring_transfer":
        return "bg-purple-500/20 text-purple-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const filteredNotifications = filter === "all"
    ? notifications
    : notifications.filter((n) => n.type === filter);

  if (!currentUser) return null;

  const TriggerButton = (
    <Button
      variant="ghost"
      size="sm"
      className="relative p-2 text-white/60 hover:bg-white/10 hover:text-white"
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
    >
      {unreadCount > 0 ? (
        <BellRing className="size-5" />
      ) : (
        <Bell className="size-5" />
      )}
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{TriggerButton}</SheetTrigger>
      <SheetContent className="w-full border-white/10 bg-slate-900/95 text-white backdrop-blur-xl sm:max-w-md">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-white">
              <Bell className="size-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-blue-400 hover:bg-blue-500/20"
                >
                  <CheckCheck className="mr-1 size-4" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList className="grid w-full grid-cols-4 bg-white/5">
              <TabsTrigger value="all" className="text-xs data-[state=active]:bg-white/20">
                All
              </TabsTrigger>
              <TabsTrigger value="transaction" className="text-xs data-[state=active]:bg-white/20">
                Transfers
              </TabsTrigger>
              <TabsTrigger value="security" className="text-xs data-[state=active]:bg-white/20">
                Security
              </TabsTrigger>
              <TabsTrigger value="balance_alert" className="text-xs data-[state=active]:bg-white/20">
                Alerts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-200px)]">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="mb-4 size-12 text-white/20" />
              <p className="text-white/60">No notifications</p>
              <p className="text-sm text-white/40">
                {filter !== "all"
                  ? "No notifications in this category"
                  : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2 pr-4">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ delay: index * 0.02 }}
                    className={`group relative rounded-lg border p-3 ${
                      notification.read
                        ? "border-white/5 bg-white/5"
                        : "border-blue-500/20 bg-blue-500/10"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`flex size-8 flex-shrink-0 items-center justify-center rounded-full ${getNotificationColor(
                          notification.type
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              notification.read ? "text-white/80" : "text-white"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification.id)}
                                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                                aria-label="Mark as read"
                              >
                                <Check className="size-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(notification.id)}
                              className="rounded p-1 text-white/60 hover:bg-red-500/20 hover:text-red-400"
                              aria-label="Delete notification"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        </div>
                        <p
                          className={`mt-0.5 text-sm ${
                            notification.read ? "text-white/50" : "text-white/70"
                          }`}
                        >
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute right-3 top-3 size-2 rounded-full bg-blue-400" />
                    )}
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <div className="mt-4 border-t border-white/10 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="w-full text-red-400 hover:bg-red-500/20"
            >
              <Trash2 className="mr-2 size-4" />
              Clear all notifications
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
