import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../types';

/**
 * Verifica papel do usuário. Em rotas escopadas por empresa (CompanyAccessGuard
 * rodou antes e setou request.companyRole), usa o papel NAQUELA empresa.
 * Em rotas globais sem empresa ativa (ex.: plano de contas, compartilhado
 * entre empresas), qualquer papel do usuário que satisfaça a exigência em
 * PELO MENOS UMA de suas empresas já autoriza — não faz sentido exigir um
 * "papel global" que não existe no modelo. ADMIN sempre passa.
 * Rotas sem @Roles(...) ficam liberadas para qualquer papel autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const companyRole: UserRole | undefined = request.companyRole;

    if (companyRole) {
      if (companyRole === UserRole.ADMIN || requiredRoles.includes(companyRole)) {
        return true;
      }
      throw new ForbiddenException('Usuário não tem papel suficiente para esta ação');
    }

    const user: AuthenticatedUser | undefined = request.user;
    const satisfiesGlobally = user?.companyAccess.some(
      (access) => access.role === UserRole.ADMIN || requiredRoles.includes(access.role),
    );
    if (satisfiesGlobally) {
      return true;
    }

    throw new ForbiddenException('Usuário não tem papel suficiente para esta ação');
  }
}
