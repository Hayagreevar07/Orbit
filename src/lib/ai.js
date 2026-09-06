const model = import.meta.env.VITE_OPENROUTER_MODEL || 'mistralai/mistral-small-3.1-24b-instruct';
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

const commandSchema = `Return only valid JSON with this shape: {"message": string, "action": {"type": "add_task" | "complete_task" | "log_study" | "add_note" | "add_event" | "add_mess21_expense" | "none", "title": string, "text": string, "amount": number, "category": string, "minutes": number, "time": string, "date": string}}. For an expense request, use type "add_mess21_expense", put the rupee value in amount and the expense category in category. Use type "none" when the request is informational or ambiguous.`;

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
        { role: 'system', content: `You are the operating intelligence inside Orbit Desk, not a generic chat bot. You own the user's daily planning loop: understand the workspace, decide the next useful operation, and propose one concrete change or answer. Use the supplied workspace context. You may add or complete tasks, log study time, schedule events, save notes, or update Mess-21 expenses. Never claim a write happened before the user approves it and the app verifies it. ${commandSchema}` },
        { role: 'user', content: JSON.stringify({ command, context }) },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message || `Mistral request failed with status ${response.status}`);
  }
  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content || '';
  const json = content.match(/\{[\s\S]*\}/)?.[0];
  if (!json) throw new Error('Mistral returned an unreadable command.');
  return JSON.parse(json);
}
