import { Inject, Injectable, Logger } from '@nestjs/common';

import { MastraService } from '../mastra/mastra.service';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { AnalyzeJobPostingDto } from './dto/analyze-job-posting.dto';

@Injectable()
export class JobAnalyzerService {
  private readonly logger = new Logger(JobAnalyzerService.name);

  constructor(
    @Inject(MastraService) private readonly mastraService: MastraService,
  ) {
    this.logger.log(
      `JobAnalyzerService initialized. MastraService defined: ${!!mastraService}`,
    );
  }

  async analyzeJobPosting(
    dto: AnalyzeJobPostingDto,
  ): Promise<AnalysisResultDto> {
    if (!this.mastraService) {
      throw new Error('MastraService is not initialized');
    }

    const agent = this.mastraService.getAgent('jobAnalyzerAgent');

    if (!agent) {
      throw new Error('Job Analyzer Agent not found');
    }

    const prompt = `
        以下の求人情報を分析してください：

        職種: ${dto.jobTitle}
        給与: ${dto.salary}
        必須スキル: ${dto.requiredSkills.join(', ')}

        仕事内容:
        ${dto.jobDescription}
    `;

    this.logger.log('Starting job analysis...');

    try {
      const response = await agent.generate(prompt);
      this.logger.log('Agent response received');

      // Extract JSON from the response
      const text = response.text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[0];
      const result = JSON.parse(jsonStr);

      return {
        score: result.score || 0,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        suggestions: result.suggestions || [],
        industryBenchmark: result.industryBenchmark || {
          averageSalary: 'N/A',
          commonSkills: [],
        },
      };
    } catch (error) {
      this.logger.error('Error during job analysis', error);
      throw error;
    }
  }
}
