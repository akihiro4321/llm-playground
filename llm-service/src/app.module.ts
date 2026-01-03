import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MastraModule } from './mastra/mastra.module';
import { ChatModule } from './chat/chat.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MastraModule, ChatModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
