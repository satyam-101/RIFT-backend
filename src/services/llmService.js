const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateExplanation({ gene, phenotype, rsids, drug, guidelineText }) {
  try {
    const systemPrompt = `You are a clinical pharmacogenomics AI aligned with CPIC guidelines.
You must be medically accurate, avoid hallucinations, and only output valid JSON with no markdown or extra text.`;

    const userPrompt = `Patient Pharmacogenomic Data:

Gene: ${gene}
Phenotype: ${phenotype}
Drug: ${drug}
Variants: ${rsids.join(", ")}

CPIC Guideline Context:
${guidelineText || "No additional guideline provided."}

Return response in EXACT JSON format:

{
  "summary": "...",
  "mechanism": "...",
  "clinical_impact": "..."
}

Requirements:
- Explain gene-drug metabolic pathway
- Reference variant impact
- Mention phenotype consequences
- Be clinically precise
- If uncertain, clearly state uncertainty`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      top_p: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("Empty LLM response");
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseErr) {
      parsed = {
        summary: content,
        mechanism: "Mechanism extraction unavailable.",
        clinical_impact: "Clinical impact explanation generated but not structured."
      };
    }

    return {
      summary: parsed.summary,
      mechanism: parsed.mechanism,
      clinical_impact: parsed.clinical_impact,
      success: true
    };
  } catch (error) {
    console.error("Groq LLM Error:", error.message);

    return {
      summary: "LLM unavailable. Pharmacogenomic interaction detected.",
      mechanism: "Metabolic pathway affected based on phenotype.",
      clinical_impact: "Clinical dosing adjustments may be required.",
      success: false
    };
  }
}

module.exports = generateExplanation;
