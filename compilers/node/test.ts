import { parseHeroML, validateParsedHeroML, parseHeroMLToAST, interpret, extractVariables } from './index';
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, '../../examples/ScriberAI.heroml');

const readHeroML = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};


const assignInitialValues = (heroml: string): { [key: string]: any } => {
    const variables = extractVariables(heroml);
    
    const initialValues: { [key: string]: any } = {
      blog_title: 'SEO Optimization: A short Guide',
      keywords: "SEO,",
      tone: 'informative',
      number_of_main_points: 1
    };
    // const initialValues: { [key: string]: any } = {
    //     name_of_startup: 'Sambaly',
    //     what_startup_does: "Make social networking apps"
    // };
  
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
  

(async () => {
    try {
      const sampleHeroML = await readHeroML();
      const parsedHeroMLData = await parseHeroML(sampleHeroML);
  
      const status = validateParsedHeroML(parsedHeroMLData);
      console.log('Parsed actions:', status);
  
      if (status === "valid") {
        const AST = parseHeroMLToAST(parsedHeroMLData);
        const environment = assignInitialValues(sampleHeroML);
        
        console.log('Initial environment:', environment);
      
        try {
            const finalEnvironment = await interpret(AST, environment);
            console.log('Final environment:', finalEnvironment);
        } catch (error) {
            console.error('Error interpreting:', error);
        }
    }
    } catch (error) {
      console.error('Error:', error);
    }
  })();