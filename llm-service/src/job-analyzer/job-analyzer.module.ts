import { Module } from '@nestjs/common';

import { MastraModule } from '../mastra/mastra.module';
import { JobAnalyzerController } from './job-analyzer.controller';
import { JobAnalyzerService } from './job-analyzer.service';

@Module({
  imports: [MastraModule],
  controllers: [JobAnalyzerController],
  providers: [JobAnalyzerService],
})
export class JobAnalyzerModule {}
