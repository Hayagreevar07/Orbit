const model = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-small-3.1-24b-instruct:free';
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

const commandSchema = `Return only valid JSON with this shape: {"message": string, "action": {"type": "add_task" | "complete_task" | "log_study" | "add_mess21_expense" | "none", "title": string, "amount": number, "category": string, "minutes": number, "time": string, "date": string}}. For an expense request, use type "add_mess21_expense", put the rupee value in amount and the expense category in category. Use type "none" when the request is informational or ambiguous.`;

export const aiConfigured = Boolean(apiKey);

export async function interpretCommand(command, context = {}) {
  if (!apiKey) {
    throw new Error('Add VITE_OPENROUTER_API_KEY to enable the Mistral assistant.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': import.meta.env.VITE_OPENROUTER_SITE_URL || window.location.origin,
      'X-Title': import.meta.env.VITE_OPENROUTER_APP_NAME || 'Orbit Desk',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: `You are Orbit Desk, a precise personal operations assistant. Convert natural language into one safe, reviewable action. Never invent a completed external operation. ${commandSchema}` },
        { role: 'user', content: JSON.stringify({ command, context }) },
      ],
    }),
  });

  if (!response.ok) throw new Error(`Mistral request failed with status ${response.status}`);
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '';
  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('Mistral returned an unreadable command.');
  return JSON.parse(json);
}
