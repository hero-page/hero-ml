import { Configuration, OpenAIApi } from 'openai';
require('dotenv').config();

// Create a new configuration with your API key
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

interface CallGPT4Options {
  model: string;
  prompt: string;
}

/**
 * It takes a prompt and some options, and returns the first completion from the GPT-4 API
 * @param options - The prompt and model to give to GPT-4.
 * @return The text of the first choice.
 */
async function callGPT4(options: CallGPT4Options) {
  try {
    const completion = await openai.createChatCompletion({
      model: options.model,
      messages: [{ role: 'user', content: options.prompt }],
    });

    return {
      data: {
        choices: [
          {
            text: completion.data.choices[0].message?.content || '',
          },
        ],
        usage: completion.data.usage,
      },
    };
  } catch (error) {
    console.error('Error calling GPT-4:', error);
    return null;
  }
}

export default callGPT4;
