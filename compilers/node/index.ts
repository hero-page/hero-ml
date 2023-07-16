import instructions from "../../utils/instructions";

import callGPT4 from './api/gpt';

interface Rules {
    showItemInList: boolean;
    isAIPrompt: boolean;
}

type ActionType = 'default' | 'Loop' | any;

type HeroMLAction = {
    type: ActionType;
    variable: string[];
    actions: string | ASTNode[];
    rules: Rules;
    referencedResponse?: string | null;
};


interface ASTNode {
    type: string;
    variables: string[];
    rules: Rules;
    content: string | ASTNode[];
    referencedResponse?: string | null;
    references: string[];
}

async function parseHeroML(code: string): Promise<HeroMLAction[]> {
    const actions: HeroMLAction[] = [];
    const steps = code.split('->>>>');

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const rules = parseRules(step);
        const variables = extractVariables(step);
        const parsedAction = parseActionString(step);

        const action: HeroMLAction = {
            type: 'default',
            variable: variables,
            rules: rules,
            actions: step.trim(),
            referencedResponse: null
        };

        if (parsedAction) {
            action.type = parsedAction.action;
            action.actions = parsedAction.forEachItemDoThis;
            action.referencedResponse = parsedAction.referencedResponse;
        }

        actions.push(action);
    }

    return actions;
}

function validateParsedHeroML(actions: HeroMLAction[]): string {
    if (actions.length < 1) {
        return "no_actions";
    }

    let whitelist: string[] = [];

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        if (i === 0) {
            whitelist = [...whitelist, ...action.variable];

            if (whitelist.length === 0) {
                return "no_vars_in_first_step";
            }
        }

        if (typeof action.actions === "string") {
            const rule_check = checkDynamicPromptForRule(action.actions, i + 1, whitelist);

            if (rule_check !== "valid") {
                return `step_${i + 1}_${rule_check}`;
            }
        } else if (Array.isArray(action.actions)) {
            // Process each child action
            for (let j = 0; j < action.actions.length; j++) {
                const childAction = action.actions[j];
                if (typeof childAction.content === "string") {
                    const rule_check = checkDynamicPromptForRule(childAction.content, i + 1, whitelist);

                    if (rule_check !== "valid") {
                        return `step_${i + 1}_${rule_check}`;
                    }
                }
                // If childAction.actions is another array, you should handle it here
                // Depending on your requirements, you might need to handle this recursively
            }
        }

        // Any variable generated in this step can be used in the next step
        const nextStepIndex = `step_${i + 1}`;
        if (!whitelist.includes(nextStepIndex)) {
            whitelist.push(nextStepIndex);
        }
    }

    return "valid";
}

function parseHeroMLToAST(actions: HeroMLAction[]): ASTNode[] {
    const ast: ASTNode[] = [];

    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];

        let node: ASTNode;
        if (typeof action.actions === "string") {
            node = {
                type: action.type,
                variables: action.variable,
                rules: action.rules,
                content: action.actions,
                references: [...new Set([...extractVariables(action.actions), ...action.variable])],
                referencedResponse: action.referencedResponse
            };
        } else if (Array.isArray(action.actions)) {
            node = {
                type: action.type,
                variables: action.variable,
                rules: action.rules,
                content: action.actions, // Simply assign action.actions to content
                references: [...new Set([...extractVariablesFromAST(action.actions), ...action.variable])],
                referencedResponse: action.referencedResponse
            };
        } else {
            throw new Error("Invalid action type");
        }

        ast.push(node);
    }

    return ast;
}



function parseRules(str: string) {
    const hideItemFromListFlag = '--hide-item-from-list';
    const isAIPromptFlag = '--is-ai-prompt';

    let options = {
        showItemInList: !str.includes(hideItemFromListFlag),
        isAIPrompt: str.includes(isAIPromptFlag)
    };
    
    return options;
}

function parseActionString(str: string) {
    const actionRegex = /ACTION: (\w+)/;
    const forEachItemRegex = /ForEveryItemDoThis: (.+)/;
    const manyItemsRegex = /ManyItems: (TRUE|FALSE)/;
    const referenceRegex = /{{(.*?)}}$/; // updated regex

    const actionMatch = str.match(actionRegex);
    const forEachItemMatch = str.match(forEachItemRegex);
    const manyItemsMatch = str.match(manyItemsRegex);

    let referenceMatch;
    const lines = str.split('\n');
    const forEachItemIndex = lines.findIndex(line => line.includes('ForEveryItemDoThis:'));
    if (forEachItemIndex >= 0) {
        for (let i = forEachItemIndex + 1; i < lines.length; i++) {
            referenceMatch = lines[i].match(referenceRegex);
            if (referenceMatch) {
                break;
            }
        }
    }

    if (actionMatch && forEachItemMatch) {
        return {
            action: actionMatch[1],
            forEachItemDoThis: forEachItemMatch[1],
            aggregateResponses: manyItemsMatch ? manyItemsMatch[1] !== 'TRUE' : true,
            referencedResponse: referenceMatch ? referenceMatch[1] : null
        };
    } else {
        return null;
    }
}

function extractVariables(content: string): string[] {
    let variables: string[] = [];
    let re = /{{(.*?)}}/g, match;

    while ((match = re.exec(content)) != null) {
        variables.push(match[1]);
    }

    return variables;
}

function extractVariablesFromAST(ast: ASTNode[]): string[] {
    let variables: string[] = [];
    for (let node of ast) {
        if (typeof node.content === "string") {
            variables.push(...extractVariables(node.content));
        } else if (Array.isArray(node.content)) {
            variables.push(...extractVariablesFromAST(node.content));
        }
    }
    return variables;
}


function checkDynamicPromptForRule(prompt: string, currentIndex: number, whitelist: string[] = []) {
    if (prompt.trim() === "") {
        return 'empty_string'
    }

    const variables = extractVariables(prompt);
  
    for (const variableName of variables) {
      if (whitelist.includes(variableName)) {
        continue;
      }
  
      const underscoreIndex = variableName.indexOf('_');
  
      if (underscoreIndex === -1) {
        return 'missing_underscore';
      }
  
      const prefix = variableName.slice(0, underscoreIndex);
      const number = variableName.slice(underscoreIndex + 1);

      if (number.includes("-")) {
        return 'negative_number';
      }
  
      if (prefix !== 'step') {
        return 'incorrect_prefix';
      }
  
      const variableIndex = parseInt(number);
      if (isNaN(variableIndex) || variableIndex >= currentIndex || variableIndex < 1) {
        return 'incorrect_number';
      }
    }
  
    return 'valid';
}

type Environment = { [key: string]: any };

async function interpret(nodes: ASTNode[] | string, dynamicEnvironment: Environment, stepEnvironment: Environment = {}, depth: number = 0, index: number = 0): Promise<Environment> {
    if (typeof nodes === 'string') {
        const parsedHeroMLData = await parseHeroML(nodes);
        const AST = parseHeroMLToAST(parsedHeroMLData);
        nodes = AST;
    }

    for (const node of nodes) {
        console.log('Processing node:', node);
        let newStepEnvironment = { ...stepEnvironment };
        let stepKey = `step_${index + 1}`;

        switch (node.type) {
            case 'default':
                if (typeof node.content === 'string') {
                    dynamicEnvironment = await evaluate(node.content, dynamicEnvironment, stepKey);
                } else {
                    throw new Error('Invalid content for default action');
                }
                break;
            case 'Loop':
                try {
                    if (node.referencedResponse) {
                        const items = JSON.parse(dynamicEnvironment[node.referencedResponse])
                        if (!Array.isArray(items)) {
                            throw new Error('Loop variable is not an array');
                        } else {
                            let subIndex = 1;
                            for (let item of items) {
                                const loopEnvironment = { ...newStepEnvironment, [node.variables[0]]: item };
                                let loopStepKey = `${stepKey}_${subIndex}`;
                                if (typeof node.content === 'string') {
                                    dynamicEnvironment = await evaluate(node.content, dynamicEnvironment, loopStepKey, item);
                                    stepEnvironment[loopStepKey] = dynamicEnvironment[loopStepKey];
                                } else {
                                    throw new Error('Invalid content for Loop action');
                                }
                                subIndex++;
                            }
                        }
                    } else {
                        throw new Error('Loop referenceResponse is null');
                    }
                } catch (err) {
                    throw new Error('Loop variable is not an array');
                }
                break;
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
        index++;
    }

    for (let key in stepEnvironment) {
        dynamicEnvironment[key] = stepEnvironment[key];
    }

    return dynamicEnvironment;
}

function replaceDynamicVars(text: string, environment: Environment): string {
    return text.replace(/{{(?!step_\d+)(.*?)}}/g, (_, variable) => {
      if (environment.hasOwnProperty(variable)) {
        if (typeof environment[variable] === 'string') {
          return environment[variable];
        } else if (Array.isArray(environment[variable])) {
          return environment[variable].join(', ');
        } else {
          return JSON.stringify(environment[variable]);
        }
      } else {
        throw new Error(`Undefined variable: ${variable}`);
      }
    });
}
  
function replaceStepVars(text: string, environment: Environment): string {
    return text.replace(/{{(step_\d+)}}/g, (_, variable) => {
      if (environment.hasOwnProperty(variable)) {
        if (typeof environment[variable] === 'string') {
          return environment[variable];
        } else if (Array.isArray(environment[variable])) {
          return environment[variable].join(', ');
        } else {
          return JSON.stringify(environment[variable]);
        }
      } else {
        throw new Error(`Undefined variable: ${variable}`);
      }
    });
}
  


type GPT4Response = {
    data: {
      choices: {
        text: string;
      }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
};

async function evaluate(content: string, environment: Environment, variable: string, item: string | null = null): Promise<Environment> {
    // Replace placeholders with their values from the environment
    let replacedContent = replaceDynamicVars(content, environment);

    // Replace step variables as well
    replacedContent = replaceStepVars(replacedContent, environment);

    if (item !== null) {
        replacedContent = `${replacedContent} \n
${JSON.stringify(item)}`;

        console.log("❣️❣️❣️❣️❣️❣️❣️❣️❣️❣️❣️");
    };
    
    // Call GPT-4 with the replaced content
    return callGPT4({ prompt: replacedContent, model: "gpt-3.5-turbo" })
      .then((gpt4Response: GPT4Response | null) => {
          if (gpt4Response) {
              // console.log('Received response from GPT-4:', gpt4Response.data.choices[0].text);
              
              // Create a copy of the environment and update only the copy with the response
              const updatedEnvironment = { ...environment };
              updatedEnvironment[variable] = gpt4Response.data.choices[0].text;

              // Return the updated environment
              return updatedEnvironment;
          } else {
              console.error("Error: GPT-4 response is null");
              return environment;
          }
      });
}

function parseInstructions(str: string): string {
    try {
        // Ensure that str is a string
        if (typeof str !== "string") {
            throw new Error("Expected a string as input");
        }

        let parsedString = str;

        for (const [rule, instruction] of Object.entries(instructions)) {
            // Replace each occurrence of the rule with its instruction
            const regex = new RegExp(rule, "g");
            parsedString = parsedString.replace(regex, instruction);
        }

        // You might want to remove any double spaces that might have been created when replacing rules
        parsedString = parsedString.replace(/  +/g, " ");

        return parsedString.trim();
    } catch (err) {
        // Log the error message and return the original string
        console.error(err);
        return str;
    }
}

export {
    parseHeroML,
    parseInstructions,
    validateParsedHeroML,
    parseHeroMLToAST,
    interpret,
    extractVariables
};