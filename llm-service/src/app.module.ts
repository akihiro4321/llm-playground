import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatModule } from './chat/chat.module';
import { JobAnalyzerModule } from './job-analyzer/job-analyzer.module';
import { MastraModule } from './mastra/mastra.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MastraModule,
    ChatModule,
    JobAnalyzerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
