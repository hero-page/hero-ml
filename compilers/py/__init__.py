from typing import List, Union, Dict, Any, Optional
from pydantic import BaseModel
from enum import Enum
from api.gpt import call_gpt4, CallGPT4Options
import logging as log
import json
import re


class Rules(BaseModel):
    show_item_in_list: bool
    ai_prompt: bool


class ActionType(Enum):
    default = "default"
    loop = "Loop"
    any = "any"


class ASTNode(BaseModel):
    type: str
    variables: List[str] = list()
    rules: Rules
    # This is very confusing
    content: Union[str, List["ASTNode"]]
    references: List[str] = list()
    referencedResponse: Union[str, None] = None


class HeroMLAction(BaseModel):
    type: ActionType
    variable: List[str]
    actions: str | List[ASTNode]
    rules: Rules
    referencedResponse: str | None


def parse_hero_ml(code: str) -> List[HeroMLAction]:
    # perhaps this should be different
    actions = list()
    steps = code.split("->>>>")

    return actions


def parse_heroML_to_AST(actions: List[HeroMLAction]) -> List[ASTNode]:
    ast = []

    for action in actions:
        if isinstance(action.actions, str):
            node = ASTNode(
                type=action.type.value,
                variables=action.variable,
                rules=action.rules,
                content=action.actions,
                references=list(
                    set(extract_variables(action.actions) + action.variable)
                ),
                referencedResponse=action.referencedResponse,
            )
        elif isinstance(action.actions, list):
            node = ASTNode(
                type=action.type.value,
                variables=action.variable,
                rules=action.rules,
                content=action.actions,
                references=list(
                    set(extract_variables_from_ast(action.actions) + action.variable)
                ),
                referencedResponse=action.referencedResponse,
            )
        else:
            raise ValueError("Invalid action type")

        ast.append(node)

    return ast


def parse_rules(input: str) -> Rules:
    return Rules(
        show_item_in_list=(not "--hide-item-from-list" in input),
        ai_prompt=("--is-ai-prompt" in input),
    )


def extract_variables(content: str) -> List[str]:
    pattern = "{{(.*?)}}"
    return [match for match in re.findall(pattern, content)]


def extract_variables_from_ast(ast: List[ASTNode]) -> List[str]:
    vars = []
    for node in ast:
        if isinstance(node.content, str):
            vars.extend(extract_variables(node.content))
        elif isinstance(node.content, list):
            vars.extend(extract_variables_from_ast(node.content))
    return vars


def check_dynamic_prompt_for_rule(
    prompt: str, current_index: int, whitelist: List[str] = []
) -> str:
    # this function should most definitely be rewritten but I'm keeping it as is so as not to rewrite the existing codebase too much
    if prompt.strip() == "":
        return "empty_string"

    variables = extract_variables(prompt)

    for variable_name in variables:
        if variable_name in whitelist:
            continue

        underscore_index = variable_name.find("_")

        if underscore_index == -1:
            return "missing_underscore"

        prefix = variable_name[:underscore_index]
        number = variable_name[underscore_index + 1 :]

        if "-" in number:
            return "negative_number"

        if prefix != "step":
            return "incorrect_prefix"

        try:
            variable_index = int(number)
        except ValueError:
            return "incorrect_number"

        if variable_index >= current_index or variable_index < 1:
            return "incorrect_number"

    return "valid"


Environment = Dict[str, Any]


def interpret(
    nodes: Union[List["ASTNode"], str],
    dynamicEnvironment: Environment,
    stepEnvironment: Environment = {},
    depth: int = 0,
    index: int = 0,
) -> Environment:
    if isinstance(nodes, str):
        parsedHeroMLData = parse_hero_ml(nodes)
        AST = parse_heroML_to_AST(parsedHeroMLData)
        nodes = AST

    for node in nodes:
        log.info("Processing node:", node)
        log.info("Current dynamicEnvironment:", dynamicEnvironment)
        log.info("Current stepEnvironment:", stepEnvironment)

        newStepEnvironment = stepEnvironment.copy()
        stepKey = f"step_{index + 1}"

        if node.type == "default":
            if isinstance(node.content, str):
                dynamicEnvironment = evaluate(node.content, dynamicEnvironment, stepKey)
            else:
                raise ValueError("Invalid content for default action")
        elif node.type == "Loop":
            try:
                if node.referencedResponse:
                    items = json.loads(dynamicEnvironment[node.referencedResponse])
                    if not isinstance(items, list):
                        raise ValueError("Loop variable is not an array")
                    else:
                        subIndex = 1
                        for item in items:
                            loopEnvironment = {
                                **newStepEnvironment,
                                node.variables[0]: item,
                            }
                            loopStepKey = f"{stepKey}_{subIndex}"
                            if isinstance(node.content, str):
                                dynamicEnvironment = evaluate(
                                    node.content, dynamicEnvironment, loopStepKey, item
                                )
                                stepEnvironment[loopStepKey] = dynamicEnvironment[
                                    loopStepKey
                                ]
                            else:
                                raise ValueError("Invalid content for Loop action")
                            subIndex += 1
                else:
                    raise ValueError("Loop referenceResponse is null")
            except ValueError:
                raise ValueError("Loop variable is not an array")
        else:
            raise ValueError(f"Unknown node type: {node.type}")
        index += 1

    dynamicEnvironment.update(stepEnvironment)

    return dynamicEnvironment


def validate_parsed_heroML(actions: List[HeroMLAction]) -> str:
    if len(actions) < 1:
        return "no_actions"

    whitelist = []

    for i, action in enumerate(actions):
        if i == 0:
            whitelist.extend(action.variable)

            if len(whitelist) == 0:
                return "no_vars_in_first_step"

        if isinstance(action.actions, str):
            rule_check = check_dynamic_prompt_for_rule(action.actions, i + 1, whitelist)

            if rule_check != "valid":
                return f"step_{i + 1}_{rule_check}"
        elif isinstance(action.actions, list):
            for childAction in action.actions:
                if isinstance(childAction.content, str):
                    rule_check = check_dynamic_prompt_for_rule(
                        childAction.content, i + 1, whitelist
                    )

                    if rule_check != "valid":
                        return f"step_{i + 1}_{rule_check}"
                # Handle childAction.actions if it's another list (recursion might be needed)

        next_step_index = f"step_{i + 1}"
        if next_step_index not in whitelist:
            whitelist.append(next_step_index)

    return "valid"


def parse_action_string(string):
    action_regex = re.compile(r"ACTION: (\w+)")
    for_each_item_regex = re.compile(r"ForEveryItemDoThis: (.+)")
    many_items_regex = re.compile(r"ManyItems: (TRUE|FALSE)")
    reference_regex = re.compile(r"{{(.*?)}}$")

    action_match = action_regex.search(string)
    for_each_item_match = for_each_item_regex.search(string)
    many_items_match = many_items_regex.search(string)

    reference_match = None
    lines = string.split("\n")
    for_each_item_index = next(
        (i for i, line in enumerate(lines) if "ForEveryItemDoThis:" in line), -1
    )
    if for_each_item_index >= 0:
        for i in range(for_each_item_index + 1, len(lines)):
            reference_match = reference_regex.search(lines[i])
            if reference_match:
                break

    if action_match and for_each_item_match:
        return {
            "action": action_match.group(1),
            "forEachItemDoThis": for_each_item_match.group(1),
            "aggregateResponses": many_items_match.group(1) != "TRUE"
            if many_items_match
            else True,
            "referencedResponse": reference_match.group(1) if reference_match else None,
        }
    else:
        return None


def replace_dynamic_vars(text, environment):
    def replace_variable(match):
        variable = match.group(1)
        print(f"Replace variable: {variable}, Environment: {environment}")
        if variable in environment:
            if isinstance(environment[variable], str):
                return environment[variable]
            elif isinstance(environment[variable], list):
                return ", ".join(str(item) for item in environment[variable])
            else:
                return json.dumps(environment[variable])
        else:
            raise ValueError(f"Undefined variable: {variable}")

    return re.sub(r"{{(?!step_\d+)(.*?)}}", replace_variable, text)


def replace_step_vars(text, environment):
    def replace_variable(match):
        variable = match.group(1)
        print(f"Replace variable: {variable}, Environment: {environment}")
        if variable in environment:
            if isinstance(environment[variable], str):
                return environment[variable]
            elif isinstance(environment[variable], list):
                return ", ".join(str(item) for item in environment[variable])
            else:
                return json.dumps(environment[variable])
        else:
            raise ValueError(f"Undefined variable: {variable}")

    return re.sub(r"{{(step_\d+)}}", replace_variable, text)


def evaluate(
    content: str, environment: Environment, variable: str, item: Optional[str] = None
) -> Environment:
    # Replace placeholders with their values from the environment
    print("Before placeholder replacement:", content)

    replaced_content = replace_dynamic_vars(content, environment)

    # Replace step variables as well
    replaced_content = replace_step_vars(replaced_content, environment)

    if item is not None:
        replaced_content = f"{replaced_content} \n{json.dumps(item)}"

    print("❣️❣️❣️❣️❣️❣️❣️❣️❣️❣️❣️")

    print("After placeholder replacement:", replaced_content)
    print("--------------------------------")
    print("Sending prompt to GPT-4:", replaced_content)

    # Call GPT-4 with the replaced content
    gpt4_response = call_gpt4(
        CallGPT4Options(model="gpt-3.5-turbo", prompt=replaced_content)
    )

    if gpt4_response is not None:
        print(
            "Received response from GPT-4:", gpt4_response["data"]["choices"][0]["text"]
        )

        # Create a copy of the environment and update only the copy with the response
        updated_environment = environment.copy()
        updated_environment[variable] = gpt4_response["data"]["choices"][0]["text"]

        # Return the updated environment
        return updated_environment
    else:
        print("Error: GPT-4 response is null")
        return environment
