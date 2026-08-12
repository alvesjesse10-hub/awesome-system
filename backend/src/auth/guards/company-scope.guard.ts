import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../types';

/**
 * Para relatórios: se o header X-Company-Id vier preenchido, escopa para
 * aquela única empresa (igual ao CompanyAccessGuard). Se vier AUSENTE,
 * assume visão CONSOLIDADA — agrega todas as empresas às quais o usuário
 * tem acesso. Isso evita duplicar cada endpoint de relatório em uma
 * variante "por empresa" e outra "consolidada".
 */
@Injectable()
export class CompanyScopeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    const companyIdHeader = request.headers['x-company-id'];

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (companyIdHeader) {
      const access = user.companyAccess.find((entry) => entry.companyId === companyIdHeader);
      if (!access) {
        throw new ForbiddenException('Usuário não tem acesso a esta empresa');
      }
      request.companyIds = [companyIdHeader];
      request.isConsolidated = false;
      return true;
    }

    if (user.companyAccess.length === 0) {
      throw new ForbiddenException('Usuário não tem acesso a nenhuma empresa');
    }
    request.companyIds = user.companyAccess.map((entry) => entry.companyId);
    request.isConsolidated = true;
    return true;
  }
}
