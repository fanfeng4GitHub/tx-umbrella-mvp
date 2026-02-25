import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';

export async function auditLog(input: {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditEvent.create({
    data: {
      userId: input.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      detailsJson: (input.details as Prisma.InputJsonValue) ?? undefined
    }
  });
}
