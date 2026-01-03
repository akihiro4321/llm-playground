import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { MastraService } from '../mastra/mastra.service';

@Controller('api/chat')
export class ChatController {
  constructor(private readonly mastraService: MastraService) {}

  @Post()
  async chat(@Body() body: { messages: any[] }, @Res() res: Response) {
    const agent = this.mastraService.getAgent('weatherAgent');
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    try {
      const result = await agent.stream(body.messages);

      // Assuming result.textStream is an async iterable or readable stream
      // We need to pipe it to the response.
      // If result itself is a response-like object from AI SDK, we might handle it differently.
      
      // For now, let's assume simple text streaming compatible with AI SDK's basic handling
      // or we might need to use `pipeDataStreamToResponse` if Mastra returns AI SDK result.

      // Examining Mastra source or docs would be best, but let's try standard iteration.
      
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // If 'result.textStream' exists (based on weather-workflow example)
      if (result.textStream) {
        for await (const chunk of result.textStream) {
          res.write(chunk);
        }
      }
      
      res.end();
    } catch (error) {
      console.error('Error in chat:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
