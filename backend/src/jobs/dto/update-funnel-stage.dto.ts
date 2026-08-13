import { IsEnum } from 'class-validator';
import { FunnelStage } from '@prisma/client';

/** Usado pelo drag-and-drop do kanban: move o job entre etapas sem exigir o resto do payload. */
export class UpdateFunnelStageDto {
  @IsEnum(FunnelStage)
  funnelStage!: FunnelStage;
}
