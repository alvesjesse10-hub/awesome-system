import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { EntryNature } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportPeriodQuery } from './dto/report-period.query';
import { CompanyIds } from '../common/decorators/company-context.decorator';
import { CompanyScopeGuard } from '../auth/guards/company-scope.guard';
import { sendCsv } from './csv.util';

// Sem CompanyAccessGuard: usa CompanyScopeGuard, que trata a AUSÊNCIA do
// header X-Company-Id como pedido de visão CONSOLIDADA (todas as empresas
// do usuário), em vez de erro. Ver auth/guards/company-scope.guard.ts.
@UseGuards(CompanyScopeGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('dre')
  async dre(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getDre(companyIds, query.year);
    if (query.format === 'csv') {
      const columns = [
        { key: 'label', label: 'Categoria' },
        ...Array.from({ length: 12 }, (_, i) => ({ key: `m${i + 1}`, label: `${i + 1}/${query.year}` })),
        { key: 'total', label: 'Total' },
      ];
      const rows = result.rows.map((row) => ({
        label: row.label,
        total: row.total.toFixed(2),
        ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value.toFixed(2)])),
      }));
      sendCsv(res, `dre-${query.year}.csv`, columns, rows);
      return;
    }
    return result;
  }

  @Get('cash-flow')
  async cashFlow(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getCashFlow(companyIds, query.year);
    if (query.format === 'csv') {
      const columns = [
        { key: 'month', label: 'Mês' },
        { key: 'entries', label: 'Entradas' },
        { key: 'exits', label: 'Saídas' },
        { key: 'balance', label: 'Saldo' },
      ];
      const rows = result.months.map((m) => ({ ...m, entries: m.entries.toFixed(2), exits: m.exits.toFixed(2), balance: m.balance.toFixed(2) }));
      sendCsv(res, `fluxo-caixa-${query.year}.csv`, columns, rows);
      return;
    }
    return result;
  }

  @Get('bank-balances')
  async bankBalances(@CompanyIds() companyIds: string[], @Query('format') format: string | undefined, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getBankBalances(companyIds);
    if (format === 'csv') {
      const columns = [
        { key: 'companyName', label: 'Empresa' },
        { key: 'name', label: 'Conta' },
        { key: 'type', label: 'Tipo' },
        { key: 'initialBalance', label: 'Saldo Inicial' },
        { key: 'totalIn', label: 'Entradas' },
        { key: 'totalOut', label: 'Saídas' },
        { key: 'currentBalance', label: 'Saldo Atual' },
      ];
      sendCsv(res, 'saldo-bancario.csv', columns, result.accounts);
      return;
    }
    return result;
  }

  @Get('job-profitability')
  async jobProfitability(
    @CompanyIds() companyIds: string[],
    @Query() query: ReportPeriodQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getJobProfitability(companyIds, query.year, query.month);
    if (query.format === 'csv') {
      const columns = [
        { key: 'jobName', label: 'Job' },
        { key: 'clientName', label: 'Cliente' },
        { key: 'revenue', label: 'Receita' },
        { key: 'directCosts', label: 'Custos Diretos' },
        { key: 'commission', label: 'Comissão' },
        { key: 'margin', label: 'Margem' },
        { key: 'marginPercent', label: 'Margem %' },
      ];
      sendCsv(res, 'rentabilidade-jobs.csv', columns, result);
      return;
    }
    return result;
  }

  @Get('clients')
  async clients(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getClientsReport(companyIds, query.year);
    if (query.format === 'csv') {
      sendCsv(res, `clientes-${query.year}.csv`, this.partyCsvColumns(query.year), this.partyCsvRows(result));
      return;
    }
    return result;
  }

  @Get('suppliers')
  async suppliers(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getSuppliersReport(companyIds, query.year);
    if (query.format === 'csv') {
      sendCsv(res, `fornecedores-${query.year}.csv`, this.partyCsvColumns(query.year), this.partyCsvRows(result));
      return;
    }
    return result;
  }

  @Get('accounts-payable')
  async accountsPayable(
    @CompanyIds() companyIds: string[],
    @Query('nature') nature: EntryNature | undefined,
    @Query('format') format: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resolvedNature = nature === EntryNature.REVENUE ? EntryNature.REVENUE : EntryNature.EXPENSE;
    const result = await this.service.getAccountsPayableSummary(companyIds, resolvedNature);
    if (format === 'csv') {
      const columns = [
        { key: 'name', label: 'Centro de custo' },
        { key: 'total', label: 'Total em aberto' },
      ];
      sendCsv(res, 'contas-a-pagar.csv', columns, result.byCostCenter);
      return;
    }
    return result;
  }

  @Get('commission-ranking')
  async commissionRanking(
    @CompanyIds() companyIds: string[],
    @Query() query: ReportPeriodQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getCommissionRanking(companyIds, query.year, query.month);
    if (query.format === 'csv') {
      const columns = [
        { key: 'employeeName', label: 'Colaborador' },
        { key: 'jobsCount', label: 'Jobs' },
        { key: 'successCount', label: 'Success' },
        { key: 'totalCommission', label: 'Comissão Total' },
      ];
      sendCsv(res, 'ranking-comissoes.csv', columns, result);
      return;
    }
    return result;
  }

  private partyCsvColumns(year: number) {
    return [
      { key: 'name', label: 'Nome' },
      ...Array.from({ length: 12 }, (_, i) => ({ key: `m${i + 1}`, label: `${i + 1}/${year}` })),
      { key: 'total', label: 'Total' },
    ];
  }

  private partyCsvRows(rows: { name: string; months: number[]; total: number }[]) {
    return rows.map((row) => ({
      name: row.name,
      total: row.total.toFixed(2),
      ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value.toFixed(2)])),
    }));
  }
}
