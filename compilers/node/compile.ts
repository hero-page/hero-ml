import { parseHeroML, parseInstructions, validateParsedHeroML, parseHeroMLToAST, interpret, extractVariables } from './index';

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
    const heroml = parseInstructions(raw_heroml);
    const parsedHeroMLData = await parseHeroML(heroml);

    const status = validateParsedHeroML(parsedHeroMLData);

    if (status === "valid") {
      const AST = parseHeroMLToAST(parsedHeroMLData);
      const environment = assignInitialValues(heroml, initialValues);
      
      try {
        const finalEnvironment = await interpret(AST, environment);

        return finalEnvironment;
      } catch (error) {
        console.error('Error interpreting:', error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
