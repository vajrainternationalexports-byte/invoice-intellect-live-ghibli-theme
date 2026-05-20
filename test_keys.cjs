const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const anthropicKey = env.ANTHROPIC_API_KEY;
const openaiKey = env.OPENAI_API_KEY;

console.log("Anthropic API key exists:", !!anthropicKey, anthropicKey ? anthropicKey.substring(0, 12) + "..." : "");
console.log("OpenAI API key exists:", !!openaiKey, openaiKey ? openaiKey.substring(0, 12) + "..." : "");

async function testOpenAI() {
  if (!openaiKey) {
    console.log("OpenAI Key not set");
    return;
  }
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Say hello in 3 words" }]
      }),
    });
    console.log("OpenAI status:", res.status);
    const json = await res.json();
    console.log("OpenAI response:", JSON.stringify(json));
  } catch (err) {
    console.error("OpenAI test failed:", err);
  }
}

async function testAnthropic() {
  if (!anthropicKey) {
    console.log("Anthropic Key not set");
    return;
  }
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 10,
        messages: [{ role: "user", content: "Say hello in 3 words" }]
      }),
    });
    console.log("Anthropic status:", res.status);
    const json = await res.json();
    console.log("Anthropic response:", JSON.stringify(json));
  } catch (err) {
    console.error("Anthropic test failed:", err);
  }
}

async function run() {
  await testOpenAI();
  await testAnthropic();
}

run();
