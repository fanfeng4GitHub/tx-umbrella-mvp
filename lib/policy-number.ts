import dayjs from 'dayjs';
import { Prisma } from '@prisma/client';

export function buildPolicyNumber(effectiveDate: Date, seq: number) {
  const yy = dayjs(effectiveDate).format('YY');
  const sequence = String(seq).padStart(6, '0');
  return `REU-${yy}TX-${sequence}`;
}

export async function nextTxPolicyNumber(
  tx: Prisma.TransactionClient,
  effectiveDate: Date
) {
  const year = dayjs(effectiveDate).year();

  const sequenceRow = await tx.policySequence.upsert({
    where: { state_year: { state: 'TX', year } },
    update: { lastNumber: { increment: 1 } },
    create: { state: 'TX', year, lastNumber: 1 }
  });

  return buildPolicyNumber(effectiveDate, sequenceRow.lastNumber);
}
