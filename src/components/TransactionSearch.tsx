import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTransactionsByAccountId,
  formatCurrency,
  formatDate,
  getTransactionType,
} from "@/lib/transactions";
import { exportToCSV, exportToJSON } from "@/lib/data-export";
import type { TransactionModel } from "@/lib/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Download,
  FileText,
  FileJson,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarIcon,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface TransactionSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchFilters {
  searchQuery: string;
  type: "all" | "sent" | "received";
  minAmount: string;
  maxAmount: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  status: "all" | "completed" | "pending" | "failed";
}

const defaultFilters: SearchFilters = {
  searchQuery: "",
  type: "all",
  minAmount: "",
  maxAmount: "",
  startDate: undefined,
  endDate: undefined,
  status: "all",
};

export function TransactionSearch({ open, onOpenChange }: TransactionSearchProps) {
  const { currentUser } = useAuth();
  const [allTransactions, setAllTransactions] = useState<TransactionModel[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  const loadTransactions = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const { transactions } = await getTransactionsByAccountId(
        currentUser.account.id,
        1,
        1000 // Load more for search
      );
      setAllTransactions(transactions);
      setFilteredTransactions(transactions);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open, loadTransactions]);

  // Apply filters
  useEffect(() => {
    if (!currentUser) return;

    let result = [...allTransactions];

    // Text search
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.id.toLowerCase().includes(query) ||
          (tx.description?.toLowerCase().includes(query) ?? false) ||
          tx.amount.includes(query) ||
          formatDate(tx.create_time).toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filters.type !== "all") {
      result = result.filter((tx) => {
        const type = getTransactionType(tx, currentUser.account.id);
        return type === filters.type;
      });
    }

    // Amount range
    if (filters.minAmount) {
      const min = parseFloat(filters.minAmount);
      result = result.filter((tx) => parseFloat(tx.amount) >= min);
    }
    if (filters.maxAmount) {
      const max = parseFloat(filters.maxAmount);
      result = result.filter((tx) => parseFloat(tx.amount) <= max);
    }

    // Date range
    if (filters.startDate) {
      const start = filters.startDate.getTime() / 1000;
      result = result.filter((tx) => parseInt(tx.create_time) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      const endTimestamp = end.getTime() / 1000;
      result = result.filter((tx) => parseInt(tx.create_time) <= endTimestamp);
    }

    // Status filter
    if (filters.status !== "all") {
      result = result.filter((tx) => {
        switch (filters.status) {
          case "completed":
            return tx.status === 0;
          case "pending":
            return tx.status === 0;
          case "failed":
            return tx.status === 0;
          default:
            return true;
        }
      });
    }

    setFilteredTransactions(result);
  }, [filters, allTransactions, currentUser]);

  const handleExportCSV = () => {
    const toExport =
      selectedTransactions.size > 0
        ? filteredTransactions.filter((tx) => selectedTransactions.has(tx.id))
        : filteredTransactions;

    if (toExport.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const exportData = toExport.map((tx) => ({
      id: tx.id,
      date: formatDate(tx.create_time),
      type: currentUser ? getTransactionType(tx, currentUser.account.id) : "unknown",
      amount: tx.amount,
      description: tx.description || "",
      status: tx.status === 0 ? "Completed" : "Pending",
    }));

    try {
      exportToCSV(exportData, `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
      toast.success(`Exported ${exportData.length} transactions to CSV`);
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const handleExportJSON = () => {
    const toExport =
      selectedTransactions.size > 0
        ? filteredTransactions.filter((tx) => selectedTransactions.has(tx.id))
        : filteredTransactions;

    if (toExport.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    try {
      exportToJSON(toExport, `transactions-${format(new Date(), "yyyy-MM-dd")}.json`);
      toast.success(`Exported ${toExport.length} transactions to JSON`);
    } catch (error) {
      toast.error("Failed to export transactions");
    }
  };

  const handleExportPDF = () => {
    // Generate a simple PDF using print
    const toExport =
      selectedTransactions.size > 0
        ? filteredTransactions.filter((tx) => selectedTransactions.has(tx.id))
        : filteredTransactions;

    if (toExport.length === 0) {
      toast.error("No transactions to export");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transaction Report - ${format(new Date(), "yyyy-MM-dd")}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; }
            .meta { color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #1e3a5f; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .sent { color: #dc2626; }
            .received { color: #16a34a; }
            .footer { margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>FinBank Transaction Report</h1>
          <div class="meta">
            <p>Account: ${currentUser?.user.full_name}</p>
            <p>Generated: ${format(new Date(), "PPpp")}</p>
            <p>Total Transactions: ${toExport.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Description</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${toExport
                .map((tx) => {
                  const type = currentUser
                    ? getTransactionType(tx, currentUser.account.id)
                    : "unknown";
                  return `
                  <tr>
                    <td>${formatDate(tx.create_time)}</td>
                    <td class="${type}">${type === "sent" ? "Sent" : "Received"}</td>
                    <td class="${type}">${type === "sent" ? "-" : "+"}${formatCurrency(tx.amount)}</td>
                    <td>${tx.description || "-"}</td>
                    <td>${tx.status === 0 ? "Completed" : "Pending"}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            <p>This is a computer-generated report from FinBank.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
    toast.success("PDF export ready for printing");
  };

  const toggleSelection = (txId: string) => {
    setSelectedTransactions((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) {
        next.delete(txId);
      } else {
        next.add(txId);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map((tx) => tx.id)));
    }
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.type !== "all" ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.startDate ||
    filters.endDate ||
    filters.status !== "all";

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Search className="size-5" />
            Transaction Search & Export
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search by ID, description, amount, or date..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-white/20 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/10 text-white"
              } hover:bg-white/20`}
            >
              <SlidersHorizontal className="mr-2 size-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-2 bg-blue-500 text-xs">Active</Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-white/10 bg-white/5 p-4">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <Label className="text-white/60">Type</Label>
                    <Select
                      value={filters.type}
                      onValueChange={(v) =>
                        setFilters({ ...filters, type: v as SearchFilters["type"] })
                      }
                    >
                      <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/20 bg-slate-900">
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/60">Status</Label>
                    <Select
                      value={filters.status}
                      onValueChange={(v) =>
                        setFilters({ ...filters, status: v as SearchFilters["status"] })
                      }
                    >
                      <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/20 bg-slate-900">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/60">Min Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      className="mt-1 border-white/20 bg-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white/60">Max Amount</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      className="mt-1 border-white/20 bg-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white/60">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="mt-1 w-full justify-start border-white/20 bg-white/10 text-left text-white hover:bg-white/20"
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {filters.startDate
                            ? format(filters.startDate, "MMM d, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto border-white/20 bg-slate-900 p-0">
                        <Calendar
                          mode="single"
                          selected={filters.startDate}
                          onSelect={(date) => setFilters({ ...filters, startDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-white/60">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="mt-1 w-full justify-start border-white/20 bg-white/10 text-left text-white hover:bg-white/20"
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {filters.endDate
                            ? format(filters.endDate, "MMM d, yyyy")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto border-white/20 bg-slate-900 p-0">
                        <Calendar
                          mode="single"
                          selected={filters.endDate}
                          onSelect={(date) => setFilters({ ...filters, endDate: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="col-span-2 flex items-end">
                    <Button
                      variant="ghost"
                      onClick={clearFilters}
                      className="text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <X className="mr-2 size-4" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Results Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">
                {filteredTransactions.length} transactions found
              </span>
              {selectedTransactions.size > 0 && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  {selectedTransactions.size} selected
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAll}
                className="text-white/60 hover:bg-white/10"
              >
                {selectedTransactions.size === filteredTransactions.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 border-white/20 bg-slate-900 p-2">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10"
                      onClick={handleExportCSV}
                    >
                      <FileText className="mr-2 size-4" />
                      Export as CSV
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10"
                      onClick={handleExportJSON}
                    >
                      <FileJson className="mr-2 size-4" />
                      Export as JSON
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-white hover:bg-white/10"
                      onClick={handleExportPDF}
                    >
                      <FileText className="mr-2 size-4" />
                      Export as PDF
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Transaction List */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-white/60">Loading transactions...</div>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="mb-4 size-12 text-white/20" />
                <p className="text-white/60">No transactions found</p>
                <p className="text-sm text-white/40">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx, index) => {
                  const type = getTransactionType(tx, currentUser.account.id);
                  const isSent = type === "sent";
                  const isSelected = selectedTransactions.has(tx.id);

                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => toggleSelection(tx.id)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-blue-500/40 bg-blue-500/20"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`rounded-full p-2 ${
                            isSent ? "bg-red-500/20" : "bg-green-500/20"
                          }`}
                        >
                          {isSent ? (
                            <ArrowUpRight className="size-4 text-red-400" />
                          ) : (
                            <ArrowDownLeft className="size-4 text-green-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-white">
                                {isSent ? "Sent" : "Received"}
                              </p>
                              <p className="text-xs text-white/60">
                                {formatDate(tx.create_time)}
                              </p>
                            </div>
                            <p
                              className={`text-lg font-semibold ${
                                isSent ? "text-red-400" : "text-green-400"
                              }`}
                            >
                              {isSent ? "-" : "+"}
                              {formatCurrency(tx.amount)}
                            </p>
                          </div>
                          {tx.description && (
                            <p className="mt-1 truncate text-sm text-white/50">
                              {tx.description}
                            </p>
                          )}
                          <div className="mt-1 flex gap-2 text-xs text-white/40">
                            <span>ID: {tx.id.slice(0, 8)}...</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                tx.status === 0
                                  ? "border-green-500/40 text-green-400"
                                  : "border-yellow-500/40 text-yellow-400"
                              }`}
                            >
                              {tx.status === 0
                                ? "Completed"
                                : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
