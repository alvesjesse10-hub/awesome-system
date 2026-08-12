import { PartialType } from '@nestjs/mapped-types';
import { CreateBracketDto } from './create-bracket.dto';

export class UpdateBracketDto extends PartialType(CreateBracketDto) {}
