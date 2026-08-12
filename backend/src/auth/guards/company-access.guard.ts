import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../types';

/**
 * Resolve a empresa ativa da requisição a partir do header `X-Company-Id`
 * e confirma que o usuário autenticado tem acesso a ela (UserCompanyAccess).
 * Deve ser aplicado em rotas/controllers que operam sobre dados de UMA
 * empresa (cadastros, lançamentos, jobs). Relatórios consolidados que
 * agregam várias empresas não usam este guard — filtram pela lista de
 * empresas do próprio `request.user.companyAccess`.
 */
@Injectable()
export class CompanyAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    const companyId = request.headers['x-company-id'];

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }
    if (!companyId || typeof companyId !== 'string') {
      throw new ForbiddenException('Header X-Company-Id é obrigatório');
    }

    const access = user.companyAccess.find((entry) => entry.companyId === companyId);
    if (!access) {
      throw new ForbiddenException('Usuário não tem acesso a esta empresa');
    }

    request.companyId = access.companyId;
    request.companyRole = access.role;
    return true;
  }
}
