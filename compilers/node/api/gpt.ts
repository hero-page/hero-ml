import { Configuration, OpenAIApi } from 'openai';
require('dotenv').config();

import path from "path";
import fs from "fs";
import os from 'os';

const CONFIG_FILE_NAME = 'heroconfig.json';

// Look for the config file in the current directory
const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);

interface Config {
  openaiApiKey?: string;
  // Add any other properties you need here
}

let config: Config = {};

if (fs.existsSync(configPath)) {
  // If the config file exists, read and parse it
  const configFile = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configFile);
}

// Now you can use `config` to get your settings. For example:
const apiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error('Error: No OpenAI API Key found. Please set it in the heroconfig.json file or the OPENAI_API_KEY environment variable.');
  process.exit(1);
}

// Create a new configuration with your API key
const configuration = new Configuration({ apiKey: apiKey });
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
