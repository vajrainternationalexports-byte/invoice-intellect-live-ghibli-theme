const fs = require('fs');
const path = require('path');

async function testOpenAI() {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const match = envContent.match(/OPENAI_API_KEY=(.*)/);
  if (!match) {
    console.error("No OPENAI_API_KEY found in .env");
    return;
  }
  const key = match[1].trim();
  console.log("Testing OpenAI with key:", key.slice(0, 10) + "...");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello, say 'API works'" }]
      })
    });

    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Direct fetch failed:", err);
  }
}

testOpenAI();
