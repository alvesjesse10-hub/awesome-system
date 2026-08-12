import { Module } from '@nestjs/common';
import { SimplesNacionalService } from './simples-nacional.service';
import { SimplesNacionalController } from './simples-nacional.controller';
import { SimplesNacionalBracketsController } from './simples-nacional-brackets.controller';

@Module({
  controllers: [SimplesNacionalController, SimplesNacionalBracketsController],
  providers: [SimplesNacionalService],
})
export class SimplesNacionalModule {}
