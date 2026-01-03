import { Module } from '@nestjs/common';

import { MastraModule } from '../mastra/mastra.module';
import { ChatController } from './chat.controller';

@Module({
  imports: [MastraModule],
  controllers: [ChatController],
})
export class ChatModule {}
