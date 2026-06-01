import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum EDisputeAction {
  // Force-release the held payment to the teacher.
  RELEASE = 'release',
  // Refund the held payment back to the student and cancel the session.
  REFUND = 'refund',
}

export class ResolveDisputeDto {
  @ApiProperty({
    description: 'Whether to release the held money or refund the student.',
    enum: EDisputeAction,
    example: EDisputeAction.REFUND,
  })
  @IsEnum(EDisputeAction)
  action: EDisputeAction;

  @ApiPropertyOptional({
    description: 'Optional admin note for the audit trail.',
    example: 'Student reported the teacher did not show up.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
