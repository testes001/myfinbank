import { prisma } from '@/config/database';

class AuditLogService {
  async listLatest(limit: number = 100) {
    return prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const auditLogService = new AuditLogService();
