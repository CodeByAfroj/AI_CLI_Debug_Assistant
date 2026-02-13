import axios from "axios";

export async function askAI({ apiKey, model, prompt }) {

const res = await axios.post(
  "https://openrouter.ai/api/v1/chat/completions",
  {
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: prompt}],
    max_tokens: 800
  },
  {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 30000
  }
);


  return res.data.choices?.[0]?.message?.content || "No response from AI.";
}
