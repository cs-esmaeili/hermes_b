const inquirer = require('inquirer');

// Define the questions for commit message
const questions = [
  {
    type: 'list',
    name: 'type',
    message: 'What type of change are you committing? (choose one)',
    choices: [
      { name: 'feat: A new feature', value: 'feat' },
      { name: 'fix: A bug fix', value: 'fix' },
      { name: 'docs: Documentation changes', value: 'docs' },
      { name: 'style: Code style changes (no logic change)', value: 'style' },
      { name: 'refactor: Code refactoring', value: 'refactor' },
      { name: 'test: Adding or changing tests', value: 'test' },
      { name: 'chore: Miscellaneous changes', value: 'chore' },
    ],
  },
  {
    type: 'input',
    name: 'scope',
    message: 'What is the scope of this change? (e.g. auth, ui, api) Leave empty for none',
    default: '',
  },
  {
    type: 'input',
    name: 'subject',
    message: 'Write a short description of the change (e.g., add login feature, fix bug in payment)',
  },
  {
    type: 'input',
    name: 'body',
    message: 'Describe the change in more detail (Press Enter for multi-line input, use - at the start of each line)',
    default: '',
  },
  {
    type: 'input',
    name: 'footer',
    message: 'Enter footer information (optional, e.g., breaking change)',
    default: '',
  },
];

// Function to generate commit message
const generateCommitMessage = (answers) => {
  let message = `${answers.type}${answers.scope ? `(${answers.scope})` : ''}: ${answers.subject}`;
  
  // Process body input, each line starting with `-`
  if (answers.body) {
    // Split by line breaks and format lines starting with `-`
    const bodyLines = answers.body.split('\n').map(line => {
      // Check if the line starts with a hyphen (`-`)
      if (line.trim().startsWith('-')) {
        // Break the line after each hyphen and place it on a new line
        return line.split('-').map((part, index) => {
          if (index === 0) return ''; // Skip the first part as it's empty before `-`
          return `- ${part.trim()}`; // Add a new line with a `-` for each part
        }).join('\n');  // Join them with a new line
      }
      return line;  // Keep lines that don't start with `-` as they are
    }).join('\n');  // Join everything with a new line
    message += `${bodyLines}`;
  }

  if (answers.footer) {
    message += `\n\n${answers.footer}`;
  }

  return message;
};

// Main function
const main = async () => {
  try {
    const answers = await inquirer.prompt(questions);
    const commitMessage = generateCommitMessage(answers);
    
    // Output the generated commit message
    console.log('\nGenerated Commit Message:');
    console.log(commitMessage);

    console.log('\nThe commit message has been saved to commit_message.txt');
  } catch (error) {
    console.error('Error generating commit message:', error);
  }
};

main();
