import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { EntryNature } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportPeriodQuery } from './dto/report-period.query';
import { FormatQuery } from './dto/format.query';
import { AccountsPayableQuery } from './dto/accounts-payable.query';
import { CompanyIds } from '../common/decorators/company-context.decorator';
import { CompanyScopeGuard } from '../auth/guards/company-scope.guard';
import { sendCsv } from './csv.util';
import { sendXlsx, type ExportColumn } from './xlsx-export.util';
import { sendPdfTable } from './pdf-export.util';

type ExportFormat = 'csv' | 'xlsx' | 'pdf' | undefined;

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
    const columns = [
      { key: 'label', label: 'Categoria' },
      ...Array.from({ length: 12 }, (_, i) => ({ key: `m${i + 1}`, label: `${i + 1}/${query.year}` })),
      { key: 'total', label: 'Total' },
    ];
    const rawRows = result.rows.map((row) => ({
      label: row.label,
      total: row.total,
      ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value])),
    }));
    const csvRows = result.rows.map((row) => ({
      label: row.label,
      total: row.total.toFixed(2),
      ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value.toFixed(2)])),
    }));
    if (await this.exportTable(res, query.format, `dre-${query.year}`, `DRE — ${query.year}`, columns, csvRows, rawRows)) return;
    return result;
  }

  @Get('cash-flow')
  async cashFlow(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getCashFlow(companyIds, query.year);
    const columns = [
      { key: 'month', label: 'Mês' },
      { key: 'entries', label: 'Entradas' },
      { key: 'exits', label: 'Saídas' },
      { key: 'balance', label: 'Saldo' },
    ];
    const rawRows = result.months;
    const csvRows = result.months.map((m) => ({ ...m, entries: m.entries.toFixed(2), exits: m.exits.toFixed(2), balance: m.balance.toFixed(2) }));
    if (
      await this.exportTable(res, query.format, `fluxo-caixa-${query.year}`, `Fluxo de Caixa — ${query.year}`, columns, csvRows, rawRows)
    )
      return;
    return result;
  }

  @Get('bank-balances')
  async bankBalances(@CompanyIds() companyIds: string[], @Query() query: FormatQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getBankBalances(companyIds);
    const columns = [
      { key: 'companyName', label: 'Empresa' },
      { key: 'name', label: 'Conta' },
      { key: 'type', label: 'Tipo' },
      { key: 'initialBalance', label: 'Saldo Inicial' },
      { key: 'totalIn', label: 'Entradas' },
      { key: 'totalOut', label: 'Saídas' },
      { key: 'currentBalance', label: 'Saldo Atual' },
    ];
    if (await this.exportTable(res, query.format, 'saldo-bancario', 'Saldo Bancário', columns, result.accounts, result.accounts)) return;
    return result;
  }

  @Get('job-profitability')
  async jobProfitability(
    @CompanyIds() companyIds: string[],
    @Query() query: ReportPeriodQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getJobProfitability(companyIds, query.year, query.month);
    const columns = [
      { key: 'jobName', label: 'Job' },
      { key: 'clientName', label: 'Cliente' },
      { key: 'revenue', label: 'Receita' },
      { key: 'directCosts', label: 'Custos Diretos' },
      { key: 'commission', label: 'Comissão' },
      { key: 'margin', label: 'Margem' },
      { key: 'marginPercent', label: 'Margem %' },
    ];
    if (await this.exportTable(res, query.format, 'rentabilidade-jobs', 'Rentabilidade por Job', columns, result, result)) return;
    return result;
  }

  @Get('clients')
  async clients(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getClientsReport(companyIds, query.year);
    const columns = this.partyColumns(query.year);
    const rawRows = this.partyRawRows(result);
    const csvRows = this.partyCsvRows(result);
    if (await this.exportTable(res, query.format, `clientes-${query.year}`, `Clientes — ${query.year}`, columns, csvRows, rawRows)) return;
    return result;
  }

  @Get('suppliers')
  async suppliers(@CompanyIds() companyIds: string[], @Query() query: ReportPeriodQuery, @Res({ passthrough: true }) res: Response) {
    const result = await this.service.getSuppliersReport(companyIds, query.year);
    const columns = this.partyColumns(query.year);
    const rawRows = this.partyRawRows(result);
    const csvRows = this.partyCsvRows(result);
    if (
      await this.exportTable(res, query.format, `fornecedores-${query.year}`, `Fornecedores — ${query.year}`, columns, csvRows, rawRows)
    )
      return;
    return result;
  }

  @Get('accounts-payable')
  async accountsPayable(
    @CompanyIds() companyIds: string[],
    @Query() query: AccountsPayableQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resolvedNature = query.nature === EntryNature.REVENUE ? EntryNature.REVENUE : EntryNature.EXPENSE;
    const result = await this.service.getAccountsPayableSummary(companyIds, resolvedNature);
    const columns = [
      { key: 'name', label: 'Centro de custo' },
      { key: 'total', label: 'Total em aberto' },
    ];
    if (
      await this.exportTable(res, query.format, 'contas-a-pagar', 'Contas a Pagar', columns, result.byCostCenter, result.byCostCenter)
    )
      return;
    return result;
  }

  @Get('commission-ranking')
  async commissionRanking(
    @CompanyIds() companyIds: string[],
    @Query() query: ReportPeriodQuery,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.service.getCommissionRanking(companyIds, query.year, query.month);
    const columns = [
      { key: 'employeeName', label: 'Colaborador' },
      { key: 'jobsCount', label: 'Jobs' },
      { key: 'successCount', label: 'Success' },
      { key: 'totalCommission', label: 'Comissão Total' },
    ];
    if (await this.exportTable(res, query.format, 'ranking-comissoes', 'Ranking de Comissões', columns, result, result)) return;
    return result;
  }

  /**
   * Despacha para CSV/XLSX/PDF conforme `format`; retorna true se a resposta
   * já foi enviada (nenhum outro dado deve ser retornado pelo controller).
   * O PDF escreve de forma assíncrona (stream), por isso `await` — sem
   * esperar o fim de verdade, o handler retornaria cedo demais e o Nest
   * derrubaria o processo com ERR_STREAM_WRITE_AFTER_END.
   */
  private async exportTable(
    res: Response,
    format: ExportFormat,
    baseFilename: string,
    title: string,
    columns: ExportColumn[],
    csvRows: Record<string, unknown>[],
    rawRows: Record<string, unknown>[],
  ): Promise<boolean> {
    if (format === 'csv') {
      sendCsv(res, `${baseFilename}.csv`, columns, csvRows);
      return true;
    }
    if (format === 'xlsx') {
      sendXlsx(res, `${baseFilename}.xlsx`, columns, rawRows);
      return true;
    }
    if (format === 'pdf') {
      await sendPdfTable(res, `${baseFilename}.pdf`, title, columns, rawRows);
      return true;
    }
    return false;
  }

  private partyColumns(year: number) {
    return [
      { key: 'name', label: 'Nome' },
      ...Array.from({ length: 12 }, (_, i) => ({ key: `m${i + 1}`, label: `${i + 1}/${year}` })),
      { key: 'total', label: 'Total' },
    ];
  }

  private partyRawRows(rows: { name: string; months: number[]; total: number }[]) {
    return rows.map((row) => ({
      name: row.name,
      total: row.total,
      ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value])),
    }));
  }

  private partyCsvRows(rows: { name: string; months: number[]; total: number }[]) {
    return rows.map((row) => ({
      name: row.name,
      total: row.total.toFixed(2),
      ...Object.fromEntries(row.months.map((value, i) => [`m${i + 1}`, value.toFixed(2)])),
    }));
  }
}
