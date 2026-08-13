import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Papéis permitidos para a rota, avaliados contra o papel do usuário NA EMPRESA ativa (ver CompanyAccessGuard). ADMIN sempre passa. */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
