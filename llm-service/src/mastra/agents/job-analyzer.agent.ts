import { Agent } from '@mastra/core/agent';

import { readabilityCheckerTool } from '../tools/readability-checker.tool';
import { salaryBenchmarkTool } from '../tools/salary-benchmark.tool';
import { skillTrendTool } from '../tools/skill-trend.tool';

export const jobAnalyzerAgent = new Agent({
  id: 'job-analyzer-agent',
  name: 'Job Analyzer Agent',
  instructions: `
      あなたは求人票の品質を評価する専門家です。

      【分析手順】
      1. 給与情報をsalaryBenchmarkToolで業界相場と比較
      2. スキルリストをskillTrendToolでトレンドと照合
      3. 求人説明文をreadabilityCheckerToolで可読性評価
      4. 総合スコア（0-100）を算出
      5. 具体的な改善提案を3つ以上提示

      【評価基準】
      - 業務内容の具体性
      - 給与情報の明確さ
      - 求めるスキルの妥当性
      - 文章の読みやすさ

      【出力形式】
      JSON形式で以下の構造で返してください：
      {
        "score": 数値,
        "strengths": ["強み1", "強み2"],
        "weaknesses": ["弱み1", "弱み2"],
        "suggestions": ["提案1", "提案2", "提案3"]
      }
  `,
  model: 'openai/gpt-4o',
  tools: {
    salaryBenchmarkTool,
    skillTrendTool,
    readabilityCheckerTool,
  },
});
