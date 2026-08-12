import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

type UserWithAccess = Prisma.UserGetPayload<{
  include: { companyAccess: { include: { company: true } } };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { companyAccess: { include: { company: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = await this.jwtService.signAsync({ sub: user.id, email: user.email });
    return { accessToken, user: this.serializeUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companyAccess: { include: { company: true } } },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.serializeUser(user);
  }

  private serializeUser(user: UserWithAccess) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companies: user.companyAccess.map((access) => ({
        id: access.companyId,
        name: access.company.name,
        tradeName: access.company.tradeName,
        role: access.role,
      })),
    };
  }
}
