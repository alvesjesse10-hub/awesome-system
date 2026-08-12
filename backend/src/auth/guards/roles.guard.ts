import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

/**
 * Verifica o papel do usuário NA EMPRESA ATIVA (request.companyRole, definido
 * pelo CompanyAccessGuard — precisa rodar depois dele). ADMIN sempre passa.
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

    if (!companyRole) {
      throw new ForbiddenException('Contexto de empresa não resolvido');
    }
    if (companyRole === UserRole.ADMIN || requiredRoles.includes(companyRole)) {
      return true;
    }

    throw new ForbiddenException('Usuário não tem papel suficiente para esta ação');
  }
}
