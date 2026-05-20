const fs = require('fs');
const path = require('path');

// 1. Load API keys from .env
const envPath = path.join(__dirname, '.env');
let env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      env[key] = value;
    }
  });
}

const openaiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
if (!openaiKey) {
  console.error("Error: OPENAI_API_KEY is not set in environment or .env file");
  process.exit(1);
}

// 2. Read target source files
const filesToAnalyze = [
  { name: 'shared/schema.ts', path: path.join(__dirname, 'shared/schema.ts') },
  { name: 'server/routes.ts', path: path.join(__dirname, 'server/routes.ts') },
  { name: 'client/src/pages/Sales.tsx', path: path.join(__dirname, 'client/src/pages/Sales.tsx') },
  { name: 'client/src/pages/Invoices.tsx', path: path.join(__dirname, 'client/src/pages/Invoices.tsx') }
];

console.log("Reading source files...");
let fileContents = "";
for (const file of filesToAnalyze) {
  if (fs.existsSync(file.path)) {
    const content = fs.readFileSync(file.path, 'utf8');
    fileContents += `\n\n--- FILE: ${file.name} ---\n${content}`;
    console.log(`Loaded ${file.name} (${content.length} characters)`);
  } else {
    console.warn(`Warning: File not found ${file.name}`);
  }
}

// 3. Construct the prompt
const prompt = `You are a senior full-stack engineer and auditor.
Analyze the provided source code for:
1. Syntax, type safety, and compilation errors.
2. Logical bugs or discrepancies between the database schema (shared/schema.ts) and backend routes (server/routes.ts) or client-side pages (Sales.tsx and Invoices.tsx).
3. OCR processing logic edge cases, potential math errors, or state handling issues.
4. Broken API calls or mismatch of parameters between client-side requests and server-side routes.
5. Specific bugs, performance bottlenecks, or user-experience issues.

Please list all identified issues clearly. For each issue, provide:
- The file and context/line number range.
- A description of the bug or potential issue.
- The recommended correction.

Keep the report concise, objective, and technical.

Source Code:
${fileContents}`;

// 4. Send request to OpenAI GPT-4o
console.log("Calling OpenAI GPT-4o...");
async function runAnalysis() {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an expert static analysis tool that inspects full-stack applications for bugs." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const report = result.choices[0].message.content;

    const reportPath = path.join(__dirname, 'bug_report.md');
    fs.writeFileSync(reportPath, report, 'utf8');
    console.log(`\nAnalysis complete. Report written to ${reportPath}`);
  } catch (error) {
    console.error("Analysis failed:", error);
    process.exit(1);
  }
}

runAnalysis();
