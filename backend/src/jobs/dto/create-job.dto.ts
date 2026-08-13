import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  CompetitionStatus,
  Deliverable,
  EventType,
  FunnelStage,
  JobPaymentStatus,
  JobResult,
  JobInvoicingStatus,
  JobType,
  ProductType,
  ProjectSize,
  ProjectType,
  ProposalStatus,
  SaleType,
  ServiceType,
  Temperature,
} from '@prisma/client';

export class CreateJobDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  agency?: string;

  @IsOptional()
  @IsUUID()
  clientId?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsDateString()
  entryDate?: string;

  @IsOptional()
  @IsDateString()
  proposalEntryDate?: string;

  @IsOptional()
  @IsDateString()
  eventDate?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedBudget?: number;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsArray()
  @IsEnum(ServiceType, { each: true })
  service?: ServiceType[];

  @IsOptional()
  @IsEnum(CompetitionStatus)
  competitionStatus?: CompetitionStatus;

  @IsOptional()
  @IsEnum(Temperature)
  temperature?: Temperature;

  @IsOptional()
  @IsEnum(ProjectType)
  projectType?: ProjectType;

  @IsOptional()
  @IsEnum(ProductType)
  product?: ProductType;

  @IsOptional()
  @IsEnum(EventType)
  eventType?: EventType;

  @IsOptional()
  @IsEnum(ProjectSize)
  projectSize?: ProjectSize;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  segment?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Deliverable, { each: true })
  deliverables?: Deliverable[];

  @IsOptional()
  @IsEnum(FunnelStage)
  funnelStage?: FunnelStage;

  @IsOptional()
  @IsEnum(ProposalStatus)
  proposalStatus?: ProposalStatus;

  @IsOptional()
  @IsEnum(SaleType)
  saleType?: SaleType;

  @IsOptional()
  @IsEnum(JobResult)
  result?: JobResult;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  closedValue?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  riskValue?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  successValue?: number;

  @IsOptional()
  @IsEnum(JobPaymentStatus)
  paymentStatus?: JobPaymentStatus;

  @IsOptional()
  @IsEnum(JobInvoicingStatus)
  invoicingStatus?: JobInvoicingStatus;

  @IsOptional()
  @IsUUID()
  responsibleEmployeeId?: string;
}
