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
