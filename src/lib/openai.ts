import OpenAI from 'openai';

let client: OpenAI | null | undefined;

export function getOpenAIClient() {
  if (client !== undefined) {
    return client;
  }

  if (!process.env.DASHSCOPE_API_KEY) {
    client = null;
    return client;
  }

  client = new OpenAI({
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  });

  return client;
}
