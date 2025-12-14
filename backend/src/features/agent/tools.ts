import OpenAI from 'openai';

// Tool definition for OpenAI API
export const getCurrentWeatherToolDefinition: OpenAI.ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_current_weather',
    description: 'Get the current weather in a given location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        },
      },
      required: ['location'],
    },
  },
};

// Stub execution function for get_current_weather
export async function getCurrentWeather(location: string): Promise<string> {
  const weathers = ['晴れ', '曇り', '雨', '雪'];
  const temperatures = ['20℃', '15℃', '10℃', '5℃', '0℃'];

  const randomWeather = weathers[Math.floor(Math.random() * weathers.length)];
  const randomTemperature = temperatures[Math.floor(Math.random() * temperatures.length)];

  return `${location}の現在の天気は${randomWeather}で、気温は${randomTemperature}です。`;
}

// Map of tool names to their execution functions
export const toolFunctions: { [key: string]: Function } = {
  get_current_weather: getCurrentWeather,
};
