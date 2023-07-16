#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { main } from './compilers/node/compile';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

import { extractVariables } from "./compilers/node/index";

import prompt from 'prompt';

yargs(hideBin(process.argv))
  .command('run <file>', 'run the HeroML script', (yargs) => {
    yargs.positional('file', {
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
    });
  }, runCommand)
  .help()
  .argv;


async function runCommand(argv: any) {
  if (typeof argv.file === 'string') {
    const filePath = path.resolve(argv.file);

    if (!filePath.endsWith('.heroml')) {
      console.error('Error: File extension must be .heroml');
      return;
    }

    if (!fs.existsSync(filePath)) {
      console.error('Error: File does not exist');
      return;
    }

    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (err) {
      console.error('Error: File is not readable');
      return;
    }

    const heroml = fs.readFileSync(filePath, 'utf8');

    if (!isValidHeroML(heroml)) {
      console.error('Error: Invalid HeroML script');
      return;
    }

    
    const dynamicInitialValues = Array.from(new Set(extractVariables(heroml)));

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

    try {
      const finalEnvironment = await main(heroml, initialValues);
  
      // Create the output directory if it does not exist
      const outputDir = path.resolve(argv.output);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
  
      // Define the output path
      const outputPath = path.join(outputDir, argv.filename);
  
      // Write the JSON data to the output file
      fs.writeFileSync(outputPath, JSON.stringify(finalEnvironment, null, 2), 'utf8');
      console.log(`Success! Output written to ${outputPath}`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
}

// Replace this with your actual HeroML validation logic
function isValidHeroML(heroml: string): boolean {
  // TODO: implement actual validation
  return true;
}