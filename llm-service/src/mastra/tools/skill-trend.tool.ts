import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const skillTrendTool = createTool({
  id: 'skill-trend-analysis',
  description: 'スキルリストを分析し、トレンド、需要度、推奨スキルを返します',

  inputSchema: z.object({
    skills: z.array(z.string()).describe('分析対象のスキルリスト'),
  }),

  outputSchema: z.object({
    trendingSkills: z
      .array(z.string())
      .describe('トレンドのスキル（需要が高い）'),
    outdatedSkills: z.array(z.string()).describe('需要が減少しているスキル'),
    recommendedSkills: z.array(z.string()).describe('追加を推奨するスキル'),
  }),
  execute: async (context) => {
    const { skills } = context;

    // スキルデータベース（モック）
    const skillDatabase: Record<
      string,
      {
        demand: 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
        trend: 'rising' | 'stable' | 'declining';
        demandScore: number;
        category: string;
      }
    > = {
      // フロントエンド
      React: {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 95,
        category: 'frontend',
      },
      'Vue.js': {
        demand: 'high',
        trend: 'stable',
        demandScore: 80,
        category: 'frontend',
      },
      Angular: {
        demand: 'medium',
        trend: 'declining',
        demandScore: 60,
        category: 'frontend',
      },
      'Next.js': {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 92,
        category: 'frontend',
      },
      TypeScript: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 98,
        category: 'frontend',
      },
      JavaScript: {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 90,
        category: 'frontend',
      },
      jQuery: {
        demand: 'low',
        trend: 'declining',
        demandScore: 30,
        category: 'frontend',
      },
      Svelte: {
        demand: 'medium',
        trend: 'rising',
        demandScore: 65,
        category: 'frontend',
      },

      // バックエンド
      'Node.js': {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 93,
        category: 'backend',
      },
      Python: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 95,
        category: 'backend',
      },
      Java: {
        demand: 'high',
        trend: 'stable',
        demandScore: 85,
        category: 'backend',
      },
      Go: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 88,
        category: 'backend',
      },
      Ruby: {
        demand: 'medium',
        trend: 'declining',
        demandScore: 55,
        category: 'backend',
      },
      PHP: {
        demand: 'medium',
        trend: 'declining',
        demandScore: 50,
        category: 'backend',
      },
      Rust: {
        demand: 'high',
        trend: 'rising',
        demandScore: 82,
        category: 'backend',
      },

      // インフラ・クラウド
      AWS: {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 96,
        category: 'infrastructure',
      },
      Docker: {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 94,
        category: 'infrastructure',
      },
      Kubernetes: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 90,
        category: 'infrastructure',
      },
      Terraform: {
        demand: 'high',
        trend: 'rising',
        demandScore: 85,
        category: 'infrastructure',
      },
      GCP: {
        demand: 'high',
        trend: 'rising',
        demandScore: 83,
        category: 'infrastructure',
      },
      Azure: {
        demand: 'high',
        trend: 'stable',
        demandScore: 81,
        category: 'infrastructure',
      },

      // データベース
      PostgreSQL: {
        demand: 'very-high',
        trend: 'stable',
        demandScore: 91,
        category: 'database',
      },
      MySQL: {
        demand: 'high',
        trend: 'stable',
        demandScore: 82,
        category: 'database',
      },
      MongoDB: {
        demand: 'high',
        trend: 'stable',
        demandScore: 78,
        category: 'database',
      },
      Redis: {
        demand: 'high',
        trend: 'stable',
        demandScore: 80,
        category: 'database',
      },

      // AI/ML
      LangChain: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 89,
        category: 'ai-ml',
      },
      'OpenAI API': {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 92,
        category: 'ai-ml',
      },
      TensorFlow: {
        demand: 'high',
        trend: 'stable',
        demandScore: 75,
        category: 'ai-ml',
      },
      PyTorch: {
        demand: 'very-high',
        trend: 'rising',
        demandScore: 87,
        category: 'ai-ml',
      },
    };

    // 入力スキルを正規化して分析
    const analyzedSkills = skills.map((skill) => {
      // 大文字小文字を正規化
      const normalizedSkill = skill.trim();

      // データベースから検索（部分一致も考慮）
      let matchedSkill = skillDatabase[normalizedSkill];

      // 完全一致しない場合、部分一致を試す
      if (!matchedSkill) {
        const lowerSkill = normalizedSkill.toLowerCase();
        for (const [key, value] of Object.entries(skillDatabase)) {
          if (key.toLowerCase() === lowerSkill) {
            matchedSkill = value;
            break;
          }
        }
      }

      // 見つからない場合はデフォルト値
      if (!matchedSkill) {
        matchedSkill = {
          demand: 'medium',
          trend: 'stable',
          demandScore: 50,
          category: 'unknown',
        };
      }

      return {
        skill: normalizedSkill,
        demand: matchedSkill.demand,
        trend: matchedSkill.trend,
        demandScore: matchedSkill.demandScore,
      };
    });

    // トレンディングスキル（需要が高く、上昇トレンド）
    const trendingSkills = analyzedSkills
      .filter((s) => s.trend === 'rising' && s.demandScore >= 80)
      .map((s) => s.skill);

    // 時代遅れのスキル（需要が低く、下降トレンド）
    const outdatedSkills = analyzedSkills
      .filter((s) => s.trend === 'declining' && s.demandScore < 60)
      .map((s) => s.skill);

    // 推奨スキルの生成（入力スキルに基づいて関連スキルを推奨）
    const recommendedSkills = generateRecommendations(skills, skillDatabase);

    console.log(`[Skill Trend] Analyzed ${skills.length} skills`);
    console.log(`  Trending: ${trendingSkills.join(', ') || 'None'}`);
    console.log(`  Outdated: ${outdatedSkills.join(', ') || 'None'}`);
    console.log(`  Recommended: ${recommendedSkills.join(', ')}`);

    return {
      trendingSkills,
      outdatedSkills,
      recommendedSkills,
    };
  },
});

// 推奨スキル生成ロジック
function generateRecommendations(
  inputSkills: string[],
  database: Record<string, any>,
): string[] {
  const recommendations = new Set<string>();

  // カテゴリ別の推奨マップ
  const recommendationMap: Record<string, string[]> = {
    frontend: ['TypeScript', 'Next.js', 'React', 'Tailwind CSS'],
    backend: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
    infrastructure: ['Kubernetes', 'Terraform', 'AWS', 'Docker'],
    'ai-ml': ['LangChain', 'OpenAI API', 'PyTorch', 'Vector DB'],
  };

  // 入力スキルからカテゴリを判定
  const categories = new Set<string>();
  inputSkills.forEach((skill) => {
    const skillInfo = database[skill];
    if (skillInfo) {
      categories.add(skillInfo.category);
    }
  });

  // カテゴリに基づいて推奨
  categories.forEach((category) => {
    const categoryRecommendations = recommendationMap[category] || [];
    categoryRecommendations.forEach((rec) => {
      // 既に持っているスキルは推奨しない
      if (!inputSkills.includes(rec)) {
        recommendations.add(rec);
      }
    });
  });

  // カテゴリが判定できない場合は汎用的な推奨
  if (recommendations.size === 0) {
    ['TypeScript', 'Docker', 'AWS', 'PostgreSQL'].forEach((rec) => {
      if (!inputSkills.includes(rec)) {
        recommendations.add(rec);
      }
    });
  }

  // 最大5つまで
  return Array.from(recommendations).slice(0, 5);
}
