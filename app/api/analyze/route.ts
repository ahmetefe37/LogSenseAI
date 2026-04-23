import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { logs, instructions, apiKey: userApiKey, modelName: userModel, language } = await req.json();

    if (!logs) {
      return NextResponse.json(
        { error: 'Logs/Error content is required.' },
        { status: 400 }
      );
    }

    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;
    const targetModel = userModel || "minimax/minimax-m2.5:free";
    const targetLanguage = language || "Turkish";
    
    // If running in development without a key, provide a dummy response or error clearly
    if (!apiKey || apiKey === "YOUR_OPENROUTER_API_KEY") {
       return NextResponse.json(
        { error: 'OpenRouter API Key is not configured. Please add it to Settings or your environment variables.' },
        { status: 500 }
      );
    }

    const systemPrompt = `You are an expert Senior Full-Stack Software Engineer and DevOps specialist. 
Your task is to analyze logs, error traces, and code snippets provided by the user.

You MUST respond strictly in valid JSON format with exactly two keys: "detailed_analysis" and "quick_summary".
Do NOT wrap the JSON in Markdown code blocks (e.g. no \`\`\`json). Return raw JSON only.

"detailed_analysis": Provide a clear, concise, professional explanation of what the error/log means, the likely root cause, and steps to resolve the issue with specific code fixes formatted in Markdown. Write this detailed analysis in ${targetLanguage}.

"quick_summary": Provide a concise, direct, professional developer summary strictly in ${targetLanguage}, using Markdown. 
CRITICAL RULE: The 5 bold headers in the quick summary MUST be translated completely into ${targetLanguage}. Do NOT use English or Turkish headers unless the requested language is English or Turkish.

Use the exact following structure, but TRANSLATE the bold headers into ${targetLanguage}:
**Errors found in logs:** <Summary of errors>
**Root cause:** <Core reason>
**Files to review:** <Specific files>
**Proposed solution:** <Clear fix>
**Alternative solution:** <Alternative approach>`;

    const userPrompt = `${instructions ? `User Configuration/Instructions: ${instructions}\n\n` : ''}Target Language: ${targetLanguage}\n\nLog/Error Content:\n\`\`\`\n${logs}\n\`\`\``;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: targetModel,
        response_format: { type: "json_object" }, // Some models support this
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", errorText);
      return NextResponse.json(
        { error: `OpenRouter API Error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from OpenRouter API: Missing choices.' },
        { status: 500 }
      );
    }

    let aiText = data.choices[0].message.content || "";
    aiText = aiText.trim();
    
    // Strip markdown code blocks if the model ignored instructions
    if (aiText.startsWith('```json')) aiText = aiText.replace(/^```json\n?/, '');
    if (aiText.startsWith('```')) aiText = aiText.replace(/^```\n?/, '');
    if (aiText.endsWith('```')) aiText = aiText.replace(/\n?```$/, '');
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(aiText);
    } catch (e) {
      console.error("Failed to parse JSON:", aiText);
      parsedResult = {
        detailed_analysis: aiText,
        quick_summary: "**Error:** Analizi JSON formatında ayrıştıramadım / Could not parse analysis in JSON format."
      };
    }

    const usage = data.usage || { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 };

    return NextResponse.json({ 
      result: parsedResult,
      usage: usage
    });

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json(
      { error: error?.message || 'An unexpected error occurred during analysis.' },
      { status: 500 }
    );
  }
}
