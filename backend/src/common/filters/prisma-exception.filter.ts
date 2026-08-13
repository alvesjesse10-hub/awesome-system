import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/**
 * Traduz erros conhecidos do Prisma em respostas HTTP previsíveis, para que
 * os services de CRUD não precisem tratar cada código manualmente:
 * P2002 (unique constraint) -> 409, P2025 (registro não encontrado) -> 404,
 * P2003 (violação de FK, ex.: exclusão de registro referenciado) -> 409.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[] | undefined)?.join(', ');
        return this.respond(
          host,
          new ConflictException(`Já existe um registro com o mesmo valor${target ? ` para: ${target}` : ''}.`),
        );
      }
      case 'P2025':
        return this.respond(host, new NotFoundException('Registro não encontrado.'));
      case 'P2003':
        return this.respond(
          host,
          new ConflictException('Não é possível concluir a operação: existem registros vinculados a este item.'),
        );
      default:
        return this.respond(host, exception);
    }
  }

  private respond(host: ArgumentsHost, exception: any) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = typeof exception.getStatus === 'function' ? exception.getStatus() : 500;
    const body = typeof exception.getResponse === 'function' ? exception.getResponse() : { message: 'Erro interno' };
    response.status(status).json(body);
  }
}
