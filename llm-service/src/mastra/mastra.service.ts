import { Mastra } from '@mastra/core/mastra';
import { Injectable, OnModuleInit } from '@nestjs/common';

import { mastra } from './index';

@Injectable()
export class MastraService implements OnModuleInit {
  private mastra: Mastra;

  constructor() {
    this.mastra = mastra;
  }

  onModuleInit() {
    // Initialization logic if needed
  }

  getMastra() {
    return this.mastra;
  }

  getAgent(agentId: string) {
    return this.mastra.getAgent(agentId);
  }

  getWorkflow(workflowId: string) {
    return this.mastra.getWorkflow(workflowId);
  }
}
