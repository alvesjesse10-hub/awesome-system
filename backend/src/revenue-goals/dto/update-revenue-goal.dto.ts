import { IsNumber, IsPositive } from 'class-validator';

// year/month não são editáveis: mudar a identidade da meta depois de criada
// só confunde comparações históricas — para "mover" uma meta, exclua e
// recrie no mês certo.
export class UpdateRevenueGoalDto {
  @IsNumber()
  @IsPositive()
  targetAmount!: number;
}
