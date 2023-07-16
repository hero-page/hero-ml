export default  {
    "--return-json-array-strings": `Please output a valid JSON array of strings, formatted correctly. This array should contain one or more string values. Each string value must be enclosed in double quotes and separated from the next string by a comma. Remember, the entire array should be enclosed in square brackets.

    Here's an example of the format of the array I'm expecting: 
    ["this is a string", "this is another string", "another random string"]
    
    Note that there should be no trailing comma after the last string in the array, and no single quotes are used around string values. 
    Please avoid breaking the JSON structure by ensuring all opening brackets, quotes, and commas have corresponding closing brackets, quotes, and commas.`,

    "--return-json-array-numbers": `Only return a json array of numbers as a plain text response. For example:
[1, 2, 3, 4]`,

    "--return-json-array-boolean": `Only return a json array of boolean values as a plain text response. For example:
[true, false, true]`,

    "--return-json-array-dates": `Only return a json array of date strings as a plain text response. For example:
["2023-06-14", "2023-06-15", "2023-06-16"]`,

    "--return-json-array-objects": `Only return a json array of objects as a plain text response. Each object should be simple and have consistent keys. For example:
[{"name":"John", "age":30}, {"name":"Anna", "age":27}]`,


    "--return-json-array-objects-two-keys": `Only return a JSON array of objects, where each object has exactly two keys. For example:
[
    {"key1":"value1", "key2":"value2"},
    {"key1":"value3", "key2":"value4"}
]`,

    "--return-json-array-objects-three-keys": `Only return a JSON array of objects, where each object has exactly three keys. For example:
[
    {"key1":"value1", "key2":"value2", "key3":"value3"},
    {"key1":"value4", "key2":"value5", "key3":"value6"}
]`,

    "--return-json-array-objects-mixed": `Only return a JSON array of objects, where each object can have mixed key-value types. For example:
[
    {"key1":"value1", "key2":2},
    {"key1":"value3", "key2":4, "key3": true}
]`,

    "--return-json-array-objects-nested": `Only return a JSON array of objects, where some objects contain nested objects. For example:
[
    {"name":"John", "age":30, "address": {"city": "New York", "country": "USA"}},
    {"name":"Anna", "age":27, "address": {"city": "Berlin", "country": "Germany"}}
]`,

    "--return-json-array-objects-arrays": `Only return a JSON array of objects, where some objects contain arrays. For example:
[
    {"name":"John", "age":30, "hobbies": ["swimming", "reading"]},
    {"name":"Anna", "age":27, "hobbies": ["painting", "coding"]}
]`,

    "--return-json-array-mixed": `Only return a JSON array with mixed value types (strings, numbers, objects, arrays). For example:
[
    "String",
    42,
    {"key": "value"},
    ["Item1", "Item2"]
]`,
};