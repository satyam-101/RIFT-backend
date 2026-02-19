const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function chatWithContext({ message, context, history }) {
  try {
    const systemPrompt = `You are PharmaGuard AI, a clinical pharmacogenomics assistant aligned with CPIC guidelines.
You are having a conversation about a specific patient's pharmacogenomic analysis results.

Patient Context:
- Patient ID: ${context.patient_id}
- Drug: ${context.drug}
- Primary Gene: ${context.primary_gene}
- Diplotype: ${context.diplotype}
- Phenotype: ${context.phenotype}
- Risk Label: ${context.risk_label}
- Severity: ${context.severity}
- Confidence Score: ${context.confidence_score}
- Dose Adjustment: ${context.dose_adjustment}
- Clinical Note: ${context.note}
- Detected Variants: ${context.detected_variants || "N/A"}

Rules:
- Be medically accurate and cite CPIC guidelines when relevant.
- Answer concisely but thoroughly.
- If the user asks about something outside pharmacogenomics, politely redirect.
- Never fabricate clinical data. If uncertain, say so.
- Use plain language when possible, but be precise with medical terminology when needed.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: message }
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 1024,
      messages
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      throw new Error("Empty LLM response");
    }

    return { reply, success: true };
  } catch (error) {
    console.error("Groq Chat Error:", error.message);
    return {
      reply: "I'm sorry, I'm unable to respond right now. Please try again.",
      success: false
    };
  }
}

module.exports = chatWithContext;
