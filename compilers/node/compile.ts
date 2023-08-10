import { parseHeroML, parseInstructions, validateParsedHeroML, parseHeroMLToAST, interpret, extractVariables } from './index';
import * as cliProgress from 'cli-progress';

// create a new progress bar instance and use shades_classic theme
const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

const assignInitialValues = (heroml: string, initialValues: { [key: string]: any }): { [key: string]: any } => {
    const variables = extractVariables(heroml);
    const environment: { [key: string]: any } = {};
  
    for (let variable of variables) {
      if (initialValues.hasOwnProperty(variable)) {
        environment[variable] = initialValues[variable];
      } else {
        console.warn(`No initial value defined for variable: ${variable}`);
      }
    }
  
    return environment;
};
  

export async function main(raw_heroml: string, initialValues: { [key: string]: any }) {
  try {
    // start the progress bar with a total value of 100 and initial value of 0
    progressBar.start(100, 0);
    const heroml = parseInstructions(raw_heroml);
    console.log("const heroml = parseInstructions(raw_heroml)");
    progressBar.update(5);
    const parsedHeroMLData = await parseHeroML(heroml);
    // console.log("const parsedHeroMLData = await parseHeroML(heroml)");

    progressBar.update(10);

    const status = validateParsedHeroML(parsedHeroMLData);
    // console.log("const status = validateParsedHeroML(parsedHeroMLData)");

    progressBar.update(15);

    if (status === "valid") {
      const AST = parseHeroMLToAST(parsedHeroMLData);
      // console.log("const AST = parseHeroMLToAST(parsedHeroMLData)");

      progressBar.update(30);

      const environment = assignInitialValues(heroml, initialValues);
      // console.log("const environment = assignInitialValues(heroml, initialValues)");

      progressBar.update(40);

      const interpretStatus = { inProgress: true };
      let interpretProgress = 0;

      const incrementPerSecond = 60 / (heroml.length / 30);

      // Run this in a loop in the background
      const intervalId = setInterval(() => {
        if (interpretStatus.inProgress) {
          interpretProgress += incrementPerSecond;
          progressBar.update(40 + parseInt(interpretProgress.toFixed(0))); // Update the progress bar
          // if (interpretProgress >= 60) { // If interpret takes more than 60 seconds
          //   interpretProgress = 0;
          //   interpretStatus.inProgress = false; // Stop the loop
          //   clearInterval(intervalId); // Stop the interval
          // }
        }
      }, 1000); // Run every second
      

      try {
        const finalEnvironment = await interpret(AST, environment);
        interpretStatus.inProgress = false; // Stop the loop
        progressBar.update(100); // Set progress bar to 100
        progressBar.stop();
        clearInterval(intervalId); // Stop the interval
        return finalEnvironment;
      } catch (error) {
        interpretStatus.inProgress = false; // Stop the loop
        clearInterval(intervalId); // Stop the interval
        console.error('Error interpreting:', error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
