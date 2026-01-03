import { Module, Global } from '@nestjs/common';
import { MastraService } from './mastra.service';

@Global()
@Module({
  providers: [MastraService],
  exports: [MastraService],
})
export class MastraModule {}
