import { main } from './compilers/node/compile';

import fs from 'fs';
import path from 'path';

const heroml = `
Generate a list of {{number_of_colors}} colors

--return-json-array-strings

->>>>

Generate a list of {{number_of_colors}} names, whose last names are respectively: {{step_1}}

->>>>

ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: Please write a small intro about this color, tell me about any spiritual meaning it has:
{{step_1}}
`;  

async function run() {
    const initialValues = {
      number_of_colors: 4
    };
      
    try {
          const finalEnvironment = await main(heroml, initialValues);

          console.log(finalEnvironment);

            // Create the output directory if it does not exist
            const outputDir = path.resolve(__dirname, 'outputs');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Define the output path
            const outputPath = path.join(outputDir, 'response.json');

            // Write the JSON data to the output file
            fs.writeFileSync(outputPath, JSON.stringify(finalEnvironment, null, 2), 'utf8');
      } catch (error) {
          console.error('Error:', error);
      }
}

run();