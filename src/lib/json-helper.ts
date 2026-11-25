// Robust JSON parser to handle AI output with preamble, trailing text, or markdown codeblocks
export function extractJsonFromAiResponse(raw: string): any {
  if (!raw) return null;

  // 1. Strip markdown fences if present
  let clean = raw.trim();
  clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // 2. Direct JSON.parse attempt
  try {
    return JSON.parse(clean);
  } catch {
    // Continue to substring search
  }

  // 3. Find first { or [ and matching last } or ]
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const candidate = clean.slice(firstBrace, lastBrace + 1);
      return JSON.parse(candidate);
    } catch {
      // Continue
    }
  }

  // 4. Try array format if response was a list
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      const candidate = clean.slice(firstBracket, lastBracket + 1);
      return JSON.parse(candidate);
    } catch {
      // Continue
    }
  }

  return null;
}
