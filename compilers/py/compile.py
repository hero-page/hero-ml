import logging

from lib import (
    parse_hero_ml,
    parse_heroML_to_AST,
    interpret,
    extract_variables,
    validate_parsed_heroML,
)


from typing import Dict, Any
import logging as log

# log.basicConfig(level=log.INFO)


def assign_initial_values(
    heroml: str, initial_values: Dict[str, Any]
) -> Dict[str, Any]:
    variables = extract_variables(heroml)
    environment = {}

    for variable in variables:
        if variable in initial_values:
            environment[variable] = initial_values[variable]
        else:
            log.warning(f"No initial value defined for variable: {variable}")

    return environment


def main(heroml: str, initial_values: Dict[str, Any]):
    parsed_hero_ml_data = parse_hero_ml(heroml)

    status = validate_parsed_heroML(parsed_hero_ml_data)
    log.info(f"Parsed actions: {status}")

    if status == "valid":
        ast = parse_heroML_to_AST(parsed_hero_ml_data)
        environment = assign_initial_values(heroml, initial_values)

        log.info(f"Initial environment: {environment}")

        try:
            final_environment = interpret(ast, environment)
            log.info(f"Final environment: {final_environment}")

            return final_environment
        except Exception as error:
            log.fatal(f"Error interpreting: {error}")


if __name__ == "__main__":
    import sys

    with open(sys.argv[1]) as f:
        heroml = f.read()

    initial_values = {
        "name_of_startup": "My Mom",
        "what_startup_does": "Watches regular show",
    }

    main(heroml, initial_values)
