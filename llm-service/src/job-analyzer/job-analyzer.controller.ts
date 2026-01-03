import {
  Body,
  Controller,
  HttpStatus,
  Inject,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import { AnalyzeJobPostingDto } from './dto/analyze-job-posting.dto';
import { JobAnalyzerService } from './job-analyzer.service';

@Controller('api/v1/job-analyzer')
export class JobAnalyzerController {
  private readonly logger = new Logger(JobAnalyzerController.name);

  constructor(
    @Inject(JobAnalyzerService)
    private readonly jobAnalyzerService: JobAnalyzerService,
  ) {
    this.logger.log(
      `JobAnalyzerController initialized. Service defined: ${!!jobAnalyzerService}`,
    );
  }

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeJobPostingDto, @Res() res: Response) {
    try {
      this.logger.log(`Analyzing job posting: ${dto.jobTitle}`);

      if (!this.jobAnalyzerService) {
        throw new Error('JobAnalyzerService was not injected correctly.');
      }

      const result = await this.jobAnalyzerService.analyzeJobPosting(dto);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error('Error analyzing job posting:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to analyze job posting',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
