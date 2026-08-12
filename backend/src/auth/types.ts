import { UserRole } from '@prisma/client';

export interface AuthenticatedUserCompanyAccess {
  companyId: string;
  companyName: string;
  companyTradeName: string | null;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  companyAccess: AuthenticatedUserCompanyAccess[];
}

export interface JwtPayload {
  sub: string;
  email: string;
}
