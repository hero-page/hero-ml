![HeroML version](https://img.shields.io/badge/HeroML-v0.0.1-%23171719)
![GitHub contributors](https://img.shields.io/github/contributors/hero-page/hero-ml?color=%23e82f64)
![Open issues](https://img.shields.io/github/issues-raw/hero-page/hero-ml?color=%23D264B6)
![Last commit](https://img.shields.io/github/last-commit/hero-page/hero-ml?color=%23067AFE)
![Forks](https://img.shields.io/github/forks/hero-page/hero-ml?style=social)
![Stars](https://img.shields.io/github/stars/hero-page/hero-ml?style=social)
![Watchers](https://img.shields.io/github/watchers/hero-page/hero-ml?style=social)


# hero-ml
HeroML is an AI Prompt Chain/Workflow interpreter for Apps built on https://hero.page 

Download [VSCode Syntax Highlighter Ext. here](https://marketplace.visualstudio.com/items?itemName=hero-page.heroml)

# Table of Contents

1. [HeroML v0.0.1 Documentation](#heroml-v001-documentation)
2. [How to use HeroML Interpreter in your project](#how-to-use-heroml-interpreter-in-your-project)
3. [HeroML Extension for Visual Studio Code](#heroml-extension-for-visual-studio-code)
4. [Formatting Rules](#formatting-rules)

![HeroML Image](https://firebasestorage.googleapis.com/v0/b/focushero-1650416072840.appspot.com/o/featured_images%2Fsamoshasfallen_a_cute_cartoon_of_a_spaceman_flying_in_space_whi_33f87d18-834f-4ec3-8f08-c4f79d51caaf%20(1).webp?alt=media&token=f5bcc9f9-e414-4610-b7e7-04388194e857)


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
What is the capital of {{country}}? 

->>>> 

Write a paragraph about the country: {{step_1}}
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

# How to use HeroML Interpreter in your project

This guide will show you how to import and use the HeroML Interpreter in your own projects. 

## Importing the HeroML Interpreter

Firstly, you need to import the `main` function from the HeroML Interpreter. You can do this with the following line of code:

```javascript
import { main } from './compilers/node/compile';
```

Ensure that the path in the import statement correctly points to the location of the `compile.js` file in your project.

## Setting up the Initial Values

Before you can use the `main` function, you need to set up the initial values for your dynamic variables. These are the variables that will be used in your HeroML script.

Here's an example of how to set up the initial values:

```javascript
const initialValues = {
    blog_title: 'SEO Optimization: A short Guide',
    keywords: "SEO,",
    tone: 'informative',
    number_of_main_points: 1
};
```

In this example, we're setting up four variables: `blog_title`, `keywords`, `tone`, and `number_of_main_points`.

## Using the HeroML Interpreter

After setting up your initial values, you can now use the `main` function to interpret your HeroML script. You need to pass in two arguments to the `main` function:

1. The HeroML script as a string
2. The initial values you just set up

Here's an example of how to use the `main` function:

```javascript
const heroml = `Your HeroML script goes here`;

async function run() {
    try {
        const finalEnvironment = await main(heroml, initialValues);
    } catch (error) {
        console.error('Error:', error);
    }
}

run();
```

In this example, we're wrapping the call to `main` inside an asynchronous function called `run`. This is because `main` returns a promise that resolves with the final environment — the output of the last step in the HeroML script. The `run` function is then called to initiate the interpretation process.

The response will be dependant on each step.
If `step_1` is a normal prompt, but `step_2` is a loop, of 3 items, it will look like:


```javascript
let finalEnvironment = {
  blog_title: 'SEO Optimization: A short Guide',
  keywords: 'SEO,',
  tone: 'informative',
  number_of_main_points: 1,
  step_1: '**Array of 3 objects**',
  step_2_1: '...',
  step_2_2: '...',
  step_2_3: '...',
}
```

To use your OpenAI API key, add:
```bash
OPENAI_API_KEY="YOUR_KEY_HERE"
```

to your `.env` file, and make sure _not_ to push it up... like me.


## Compilation

### Typescript

To use the TypeScript compiler, run:

```bash
npx ts-node index.ts
```

### Python

I recommend making a virtual environment and sourcing it since the openai library has a lot of dependencies. If you don't understand what this means, don't worry about it; it's an optional step that doesn't make much of a difference.

```bash
cd compilers/py
pythom -m venv venv
source venv/bin/activate
```

```bash
pip install -r requirements.txt
python compile.py $YOUR_HEROML_FILE_HERE
```


This is all there is to using the HeroML interpreter! You can now build your own applications using HeroML. Remember to replace `Your HeroML script goes here` with your actual HeroML script.

**Note:** If an error occurs during the interpretation process, it will be caught in the `catch` block and logged to the console.

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

# Formatting Rules

## 1. Step Separation
Different steps in a HeroML script are separated by `->>>>`.

## 2. Numbering
Steps do not need to be numbered.

## 3. Addressing
You're not writing to the user, but rather to an AI model. When you include dynamic variables in the first step, the UI will already prompt the user to fill them in, and they will be replaced as if a natural part of the sentence.

## 4. Dynamic Variables
You can only create new custom dynamic variables in the first step. In any following steps, the dynamic variables are either from the first step (re-used to maintain context) or step variables, like `{{step_1}}`.

## 5. Referencing Steps
You can only reference previous steps. For example, after step 1 finishes running, in step 2, you can reference the output from step 1, like so: "Write something about `{{step_1}}`".

## 6. Modes
There are two modes in HeroML:
### a. Default Mode
The default mode, where no action is present, and it is a single prompt that yields a response.
### b. Loop Action
A loop action, denoted by:

```
ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: for every item in this array, write 15 words:
{{step_2}}
```

### Author

Hello there! My name is [Sam Chahine](https://twitter.com/HeroMeers), and I'm the creator of HeroML. I built this project during the #AISF hackathon, an event that brings together innovators from all walks of life to collaborate and create something amazing in the field of AI. The hackathon was hosted by [Founders, Inc.](https://f.inc/), an organization based in San Francisco that loves AI! (Who doesn't?)

If you'd like to reach out, my personal email is sechahi at gmail dot com!

HeroML is an AI Prompt Chain/Workflow interpreter that can be a game changer for developers who work with AI models like OpenAI's GPT-3 and GPT-4. I plan to add support for more models from various platforms in the future. My hope is that HeroML can become a valuable tool that helps bridge the gap between AI and human creativity.


#### Contributors

* Python compiler: [Shinji322](https://github.com/Shinji322).
