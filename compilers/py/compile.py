from . import (
    parse_hero_ml,
    parse_heroML_to_AST,
    interpret,
    extract_variables,
    validate_parsed_heroML,
)


from typing import Dict, Any


def assign_initial_values(
    heroml: str, initial_values: Dict[str, Any]
) -> Dict[str, Any]:
    variables = extract_variables(heroml)
    environment = {}

    for variable in variables:
        if variable in initial_values:
            environment[variable] = initial_values[variable]
        else:
            print(f"No initial value defined for variable: {variable}")

    return environment


async def main(heroml: str, initial_values: Dict[str, Any]):
    try:
        parsed_hero_ml_data = parse_hero_ml(heroml)

        status = validate_parsed_heroML(parsed_hero_ml_data)
        print("Parsed actions:", status)

        if status == "valid":
            ast = parse_heroML_to_AST(parsed_hero_ml_data)
            environment = assign_initial_values(heroml, initial_values)

            print("Initial environment:", environment)

            try:
                final_environment = interpret(ast, environment)
                print("Final environment:", final_environment)

                return final_environment
            except Exception as error:
                print("Error interpreting:", error)
    except Exception as error:
        print("Error:", error)
