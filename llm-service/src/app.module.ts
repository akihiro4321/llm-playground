import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ChatModule } from './chat/chat.module';
import { MastraModule } from './mastra/mastra.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MastraModule, ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
