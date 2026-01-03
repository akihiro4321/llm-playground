export class AnalysisResultDto {
  score: number = 0;
  strengths: string[] = [];
  weaknesses: string[] = [];
  suggestions: string[] = [];
  industryBenchmark: { averageSalary: string; commonSkills: string[] } = {
    averageSalary: '',
    commonSkills: [],
  };
}
