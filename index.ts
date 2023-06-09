import { main } from './compilers/node/compile';

import fs from 'fs';
import path from 'path';

const heroml = `
I want you to generate an outline for a blog post titled "{{blog_title}}". This post will incorporate the following keywords:
{{keywords}}

The tone of the post should be {{tone}}. Please provide {{number_of_main_points}} main points that should be covered in the post, and the sub-points under each main point, in a structured format.

Return the outline as an array of objects, each with a main point and an array of sub-points, like this:

    [
      {
        "mainPoint": "Main Point 1",
        "subPoints": ["Sub-point 1", "Sub-point 2", "Sub-point 3"]
      },
      {
        "mainPoint": "Main Point 2",
        "subPoints": ["Sub-point 1", "Sub-point 2"]
      }
    ]	

--hide-item-from-list

->>>>

ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: Now, let's write a detailed section for each main point in the outline of the blog titled "{{blog_title}}". The section should be 300-500 words, and should cover the main point and all its sub-points in detail. Please make sure the content adheres to the {{tone}} of the blog post and effectively integrates the keywords: {{keywords}}. Your response should be formatted in Markdown, including lists, headers, etc. Here's the main point and its sub-points for you to expand on:
{{step_1}}

->>>>

Based on the main points provided in this array: {{step_1}}, suggest additional related topics or points that might add value to the {{blog_title}} blog post. 

The suggestions should include topics, subtopics, potential keywords, and talking points. Please format the response in Markdown for readability. You can use headers, lists, etc.

->>>>

Write an engaging introduction and a compelling conclusion for the blog post titled {{blog_title}}. The introduction should provide a brief overview of the topics in {{step_1}} and entice readers to continue reading. The conclusion should summarize the main points and leave readers with a final thought or call to action. Format the introduction and conclusion in Markdown, and return them as an array of objects like this: 

        [{"type": "Introduction", "content": "intro text"}, {"type": "Conclusion", "content": "conclusion text"}].

--hide-item-from-list

->>>>

ACTION: Loop
ManyItems: TRUE
ForEveryItemDoThis: Please expand on this content, making it more engaging and comprehensive. Ensure you maintain the overall {{tone}} of the blog post. Format your response in Markdown.
{{step_4}}
`;  // Your HeroML string here

async function run() {
    const initialValues = {
        blog_title: 'SEO Optimization: A short Guide',
        keywords: "SEO,",
        tone: 'informative',
        number_of_main_points: 1
      };
      
      try {
          const finalEnvironment = await main(heroml, initialValues);

            // Create the output directory if it does not exist
            const outputDir = path.resolve(__dirname, 'outputs');
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Define the output path
            const outputPath = path.join(outputDir, 'response.json');

            // Write the JSON data to the output file
            fs.writeFileSync(outputPath, JSON.stringify(finalEnvironment, null, 2), 'utf8');
      } catch (error) {
          console.error('Error:', error);
      }
}

run();