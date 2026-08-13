import { CommissionType, SaleType } from '@prisma/client';

export interface JobValueFields {
  saleType: SaleType | null;
  closedValue: number | null;
  riskValue: number | null;
  successValue: number | null;
}

export interface EmployeeCommissionFields {
  commissionType: CommissionType;
  commissionValue: number | null;
}

/**
 * Valor total do contrato: em vendas "Risco + Success" é a soma do valor de
 * risco com o success fee (dois recebimentos distintos do mesmo job); nas
 * demais (Valor Único, Ajuste) é o valor fechado.
 */
export function getJobTotalValue(job: JobValueFields): number {
  if (job.saleType === SaleType.RISCO_SUCCESS) {
    return (job.riskValue ?? 0) + (job.successValue ?? 0);
  }
  return job.closedValue ?? 0;
}

/** Retorna null quando não há responsável ou o responsável não tem comissão configurada. */
export function calculateCommission(
  job: JobValueFields,
  employee: EmployeeCommissionFields | null,
): number | null {
  if (!employee || employee.commissionValue == null) {
    return null;
  }

  const totalValue = getJobTotalValue(job);

  if (employee.commissionType === CommissionType.PERCENTAGE) {
    return Math.round(totalValue * (employee.commissionValue / 100) * 100) / 100;
  }
  return employee.commissionValue;
}
