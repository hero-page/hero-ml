import { parseHeroML, validateParsedHeroML, parseHeroMLToAST, interpret, extractVariables } from './index';

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
  

export async function main(heroml: string, initialValues: { [key: string]: any }) {
  try {
    const parsedHeroMLData = await parseHeroML(heroml);

    const status = validateParsedHeroML(parsedHeroMLData);
    console.log('Parsed actions:', status);

    if (status === "valid") {
      const AST = parseHeroMLToAST(parsedHeroMLData);
      const environment = assignInitialValues(heroml, initialValues);
      
      console.log('Initial environment:', environment);
    
      try {
        const finalEnvironment = await interpret(AST, environment);
        console.log('Final environment:', finalEnvironment);

        return finalEnvironment;
      } catch (error) {
        console.error('Error interpreting:', error);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
