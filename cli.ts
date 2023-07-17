#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { main } from './compilers/node/compile';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import fetch from 'node-fetch';

import { extractVariables } from "./compilers/node/index";

import prompt from 'prompt';

yargs(hideBin(process.argv))
  .command('run <file>', 'run the HeroML script', (yargs) => {
    return yargs.positional('file', {
      describe: 'the HeroML script to run',
      type: 'string',
    })
    .option('output', {
      alias: 'o',
      describe: 'Output directory',
      type: 'string',
      default: './outputs',
    })
    .option('filename', {
      alias: 'f',
      describe: 'Output file name',
      type: 'string',
      default: `response_${new Date().toISOString()}.json`,
    })
    .option('publish', {
      alias: 'p',
      describe: 'Publish the result to the Cloud Function',
      type: 'boolean', // This flag is a boolean, it doesn't need a value
      default: false,  // By default, do not publish
    });
  }, runCommand)
  .argv;


// File Handling and Validation
async function getFileContents(filePath: string): Promise<string> {
  if (!filePath.endsWith('.heroml')) {
    throw new Error('File extension must be .heroml');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('File does not exist');
  }

  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    throw new Error('File is not readable');
  }

  return fs.readFileSync(filePath, 'utf8');
}

// Dynamic Variables Handling
async function getDynamicVariables(dynamicInitialValues: any, argv: any) {
  let initialValues: { [key: string]: any } = {};
  prompt.start();
  const get = promisify(prompt.get); // Convert to promise-based function

  for(let variable of dynamicInitialValues) {
    // Check if the value is already provided via CLI
    if(argv[variable]) {
      initialValues[variable] = argv[variable];
    } else {
      // Otherwise, prompt the user for the value
      const result = await get([variable]); // Now we can use await here
      initialValues[variable] = result[variable];
    }
  }

  return initialValues;
}

// Output Handling
function writeOutput(outputDir: string, filename: string, finalEnvironment: any) {
  // Create the output directory if it does not exist
  outputDir = path.resolve(outputDir);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Define the output path
  const outputPath = path.join(outputDir, filename);

  // Write the JSON data to the output file
  fs.writeFileSync(outputPath, JSON.stringify(finalEnvironment, null, 2), 'utf8');
  console.log(`Success! Output written to ${outputPath}`);
}

// Configuration Handling
function getConfig() {
  let config;
  try {
    const configPath = path.resolve('./heroconfig.json');
    const configRaw = fs.readFileSync(configPath, 'utf8');
    config = JSON.parse(configRaw);
  } catch (err) {
    throw new Error('Error reading configuration: ' + err);
  }

  return config;
}

// Publish Handling
async function publishResults(finalEnvironment: any, config: any) {
  console.log("Publishing results...");

  const apiKey = config.heroApiToken;
  if (!apiKey) {
    console.error('Error: Hero API Token missing.\n' + 
                  'You need to add your Hero API Token before you can publish results.\n' + 
                  'Go to https://hero.page -> Click on your profile on the top right of the page ->\n' + 
                  'Account Settings -> Get API Key\n' +
                  'Then add it to the "heroApiToken" field in your heroconfig.json');
    return;
  }

  const functionUrl = 'https://us-central1-focushero-1650416072840.cloudfunctions.net/api/publishItems';

  let response;
  try {
    response = await fetch(functionUrl, {
      method: 'POST',
      body: JSON.stringify({data: finalEnvironment}),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  } catch (error) {
    console.error('Error: Failed to make request to publish results.\n' +
                  'Please check your internet connection and ensure your API key is valid.\n' +
                  'Error Details: ', error);
    return;
  }

  if (!response.ok) {
    console.error(`Error: Failed to publish results.\n` +
                  `The server responded with HTTP status: ${response.status}.\n` +
                  'Please verify your API key and try again.\n' +
                  'If the problem persists, please contact support.\n' +
                  'Error Details: ', await response.text());
    return;
  }

  const responseBody = await response.json();
  console.log('Published successfully:', responseBody);
}

// Main Execution
async function runCommand(argv: any) {
  if (typeof argv.file === 'string') {
    try {
      const filePath = path.resolve(argv.file);
      const heroml = await getFileContents(filePath);

      if (!isValidHeroML(heroml)) {
        throw new Error('Invalid HeroML script');
      }

      const dynamicInitialValues = Array.from(new Set(extractVariables(heroml)));
      const initialValues = await getDynamicVariables(dynamicInitialValues, argv);

      const finalEnvironment = await main(heroml, initialValues);

      writeOutput(argv.output, argv.filename, finalEnvironment);

      if (argv.publish) {
        const config = getConfig();
        await publishResults(finalEnvironment, config);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// HeroML Validation
function isValidHeroML(heroml: string): boolean {
  // TODO: implement actual validation
  return true;
}



