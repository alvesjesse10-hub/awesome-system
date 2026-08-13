import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Empresa ativa da requisição, resolvida pelo CompanyAccessGuard a partir do header X-Company-Id. */
export const CompanyId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.companyId;
});

/** Papel do usuário atual DENTRO da empresa ativa. */
export const CompanyRole = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  return request.companyRole;
});

/** Empresas em escopo do relatório (ver CompanyScopeGuard): 1 empresa se X-Company-Id veio, todas as do usuário se não veio (consolidado). */
export const CompanyIds = createParamDecorator((_data: unknown, ctx: ExecutionContext): string[] => {
  const request = ctx.switchToHttp().getRequest();
  return request.companyIds;
});

/** true quando o relatório está agregando mais de uma empresa (header X-Company-Id ausente). */
export const IsConsolidated = createParamDecorator((_data: unknown, ctx: ExecutionContext): boolean => {
  const request = ctx.switchToHttp().getRequest();
  return request.isConsolidated;
});
