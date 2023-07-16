from typing import Union, Dict
import os
import openai
import logging as log

openai.api_key = os.getenv("OPENAI_API_KEY")


class CallGPT4Options:
    def __init__(self, model: str, prompt: str):
        self.model = model
        self.prompt = prompt


def call_gpt4(options: CallGPT4Options) -> Union[Dict[str, Dict], None]:
    try:
        log.info(f"Calling GPT4 with: {options.prompt}")
        completion = openai.ChatCompletion.create(
            model=options.model, messages=[{"role": "user", "content": options.prompt}]
        )

        return {
            "data": {
                # THIS MESSAGE HAS BEEN REDACTED.
                "choices": [{"text": completion.choices[0].message.get("content", "")}],
                "usage": completion.usage,
            }
        }
    except Exception as error:
        log.fatal(f"Error calling GPT-4: {error}")
        return None
