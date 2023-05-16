# hero-ml
HeroML is an AI Prompt Chain/Workflow interpreter for Apps built on https://hero.page 

Download [VSCode Syntax Highlighter Ext. here](https://marketplace.visualstudio.com/items?itemName=hero-page.heroml)

# HeroML v0.0.1 Documentation

HeroML (Hero Markup Language) is a novel approach for setting up multi-step workflows to interact with AI models like OpenAI's GPT-3 and GPT-4. 

In this version, you can set up workflows in a series of steps, where each step is a prompt that the AI will respond to. The responses from previous steps can be used in the prompts for later steps.

## Basic Workflow

Each workflow is a series of steps separated by the "->>>>" delimiter.

Example:

```
Prompt for step 1 

->>>> 

Prompt for step 2 

->>>> 

Prompt for step 3
```

## Dynamic Variables

In the first step, you can define dynamic variables in the format `{{variable_name}}`. These variables can be used in any step of the workflow. 

Example:

```
In a blog post about {{topic}}, include the following points: {{point_1}}, {{point_2}}, {{point_3}}
```


## Using Responses from Previous Steps

You can reference the response of a previous step in your current step's prompt using the format `{{step_X}}`, where X is the step number. 

Example:

```
What is the capital of France? 

->>>> 

Write a paragraph about {{step_1}}
```


## Loop Action

There's only one action available in v0.0.1, which is "Loop". This action can be used to iterate over each item in an array from the response of a previous step.

In the first line of the prompt, write `ACTION: Loop`, followed by `ForEveryItemDoThis:` on the next line, and then the prompt. If you want each item in the loop to yield its own item in a UI list, you can add `ManyItems: TRUE` under the ACTION line.

Example:

```
ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: Write a short bio for {{step_1}}
{{step_1}}
```


In the example above, `{{step_1}}` must be an array for the loop to work.

## Format of the Response

You must specify the format you expect the response to be in. For example, if you want the response to be an array of strings, you can specify "Return the list as an array of strings".

Example:

```
List the top 5 countries in terms of population. Return the list as an array of strings, like ["China", "India", "USA", "Indonesia", "Pakistan"]
```

## Important Notes

1. When using `{{step_X}}` in a loop action, make sure that `step_X` is indeed an array. If it's not, the loop action will fail.

2. You can only use variables defined in the first step (`{{variable_name}}`) throughout the entire workflow. New variables cannot be introduced in subsequent steps.

3. In the loop action, if `ManyItems: TRUE` is not specified, all responses will be added to one item. 

## Workflow Example

Here's an example of a workflow:

```
For a blog post about {{topic}}, 
I want you to return an array of strings, of keywords 
(both short & long-tail) that are related to the following points:
{{point_1}}, {{point_2}}, {{point_3}}.

->>>>

ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: Regarding my blog post about {{topic}}, write a paragraph about:
{{step_1}}
```

In this workflow, the first step is a prompt asking the AI to write a blog post about a certain topic, including three points. The second step is a loop action that asks the AI to write a paragraph about each point. The result of the second step will be an array of paragraphs, each about one point from the first step.

# HeroML Extension for Visual Studio Code

This extension provides support for HeroML in Visual Studio Code, including syntax highlighting.

## Installation

Follow these steps to install the HeroML extension:

1. Download the `heroml-0.0.1.vsix` file from the `heroml/` directory in this repository.

2. Open Visual Studio Code.

3. Click on the Extensions view icon on the Sidebar or press `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS) to open the Extensions view.

4. Click on the three dots `...` at the top right corner of the Extensions view, next to the `Clear Extensions Input` icon.

5. From the dropdown, select `Install from VSIX...`.

6. Navigate to the directory where you downloaded the `heroml-0.0.1.vsix` file, select it, and click `Open`.

7. The extension will be installed and you will get a notification in VS Code.

## Usage

To start using the extension, simply open any `.heroml` file in VS Code. The syntax highlighting will be applied automatically.

Remember to reload VS Code after installing the extension to ensure it's properly activated.

Enjoy writing your HeroML workflows with syntax highlighting!


## Limitations

1. Only one action (`Loop`) is available in v0.0.1.

2. The responses from the AI are dependant on your own prompting. If you need a specific format (like an array of strings), you need to specify it in the prompt. I will make this easier in future versions.

3. The variables (`{{variable_name}}`) are static and must be defined in the first step. They cannot change throughout the workflow.

This documentation provides a basic overview of how to create and use workflows in HeroML v0.0.1. As the language evolves, new features and functionalities will be added. For the most up-to-date information, always refer to the latest documentation.

