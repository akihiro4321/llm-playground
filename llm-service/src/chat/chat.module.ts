import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { MastraModule } from '../mastra/mastra.module';

@Module({
  imports: [MastraModule],
  controllers: [ChatController],
})
export class ChatModule {}
