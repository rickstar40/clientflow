// Supabase Edge Function: calls OpenAI without exposing the API key in the browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    console.error("OPENAI_API_KEY is not configured.");
    return json({ error: "AI assistant is not configured." }, 503);
  }

  try {
    const body = await request.json();
    const incoming = body?.messages;

    if (!Array.isArray(incoming) || incoming.length === 0 || incoming.length > 20) {
      return json({ error: "Send between 1 and 20 messages." }, 400);
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [];
    for (const item of incoming) {
      if (
        !item ||
        !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string" ||
        item.content.trim().length === 0 ||
        item.content.length > 4000
      ) {
        return json({ error: "Each message must have a valid role and content under 4,000 characters." }, 400);
      }
      messages.push({ role: item.role, content: item.content.trim() });
    }

    if (messages[messages.length - 1].role !== "user") {
      return json({ error: "The last message must be from the user." }, 400);
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are ClientFlow's helpful assistant. Give concise, practical guidance about client management and business workflows. Do not claim to access or change the user's ClientFlow data. Do not ask for confidential or sensitive personal information.",
          },
          ...messages,
        ],
        max_tokens: 700,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI request failed with status:", response.status);
      return json({ error: "AI provider request failed." }, 502);
    }

    const result = await response.json();
    const reply = result?.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      return json({ error: "AI provider returned an empty response." }, 502);
    }

    return json({ reply: reply.trim() });
  } catch (error) {
    console.error("Chat function error:", error);
    return json({ error: "Invalid request or temporary assistant error." }, 400);
  }
});
