// Cross-region inference profile (US): Claude Haiku 4.5
const MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

export function request(ctx) {
  const { ingredients = [] } = ctx.args;

  // Construct the prompt with the provided ingredients
  const prompt = `Suggest a recipe idea using these ingredients: ${ingredients.join(", ")}.`;

  // Return the HTTP request AppSync sends to Bedrock
  return {
    resourcePath: `/model/${MODEL_ID}/invoke`,
    method: "POST",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: prompt }],
          },
        ],
      }),
    },
  };
}

export function response(ctx) {
  // Surface Bedrock errors (e.g. access denied) instead of failing to parse
  if (ctx.result.statusCode !== 200) {
    return { error: ctx.result.body };
  }
  // Parse the response body and extract the generated text
  const parsedBody = JSON.parse(ctx.result.body);
  return { body: parsedBody.content[0].text };
}
