const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const FALLBACK_PHENOTYPE = {
  gene: null,
  diplotype: null,
  phenotype: "Unknown",
  confidence_score: 0.1
};

const FALLBACK_RISK = {
  risk_label: "Unknown",
  severity: "low",
  dose_adjustment: "Insufficient data. Use standard dosing with clinical monitoring.",
  note: "LLM analysis unavailable. Conservative approach recommended."
};

const FALLBACK_EXPLANATION = {
  summary: "Unable to generate pharmacogenomic explanation.",
  mechanism: "LLM service unavailable.",
  citations: ["CPIC Guidelines — https://cpicpgx.org/guidelines/"]
};

async function callLLM(prompt, systemPrompt, temperature = 0.2) {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature,
      top_p: 0.9,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ]
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty LLM response");
    return JSON.parse(content);
  } catch (error) {
    console.error("LLM Error:", error.message);
    throw error;
  }
}

async function mapGenesToPhenotypes(variants) {
  const systemPrompt = `You are a clinical pharmacogenomics expert. Given detected genetic variants from VCF analysis, determine the most likely diplotype and phenotype for each gene.

Supported genes: CYP2D6, CYP2C19, CYP2C9, SLCO1B1, TPMT, DPYD

Phenotype definitions:
- PM (Poor Metabolizer): Little to no enzyme activity
- IM (Intermediate Metabolizer): Reduced enzyme activity
- NM (Normal Metabolizer): Normal enzyme activity
- RM (Rapid Metabolizer): Increased enzyme activity
- URM (Ultrarapid Metabolizer): Very high enzyme activity

CYP2D6 star alleles: *1 (normal), *2 (normal), *3 (no function), *4 (no function), *5 (no function), *10 (reduced), *17 (reduced), *41 (reduced), *1xN (increased), *2xN (increased)
CYP2C19: *1 (normal), *2 (no function), *3 (no function), *17 (increased)
CYP2C9: *1 (normal), *2 (reduced), *3 (no function)
SLCO1B1: *1 (normal), *5 (no function), *15 (no function)
TPMT: *1 (normal), *2 (no function), *3A (no function), *3C (no function)
DPYD: *1 (normal), *2A (no function), *13 (no function)

Return EXACT JSON format. No markdown, no extra text.`;

  const prompt = `Analyze these detected variants and return phenotype predictions:

${variants.map(v => `- Gene: ${v.gene}, rsID: ${v.rsid}, STAR allele: ${v.allele}`).join("\n")}

Return JSON in this exact format:
{
  "gene_results": [
    {
      "gene": "GENE_SYMBOL",
      "diplotype": "*X/*Y",
      "phenotype": "PM|IM|NM|RM|URM",
      "confidence_score": 0.0,
      "reasoning": "brief explanation"
    }
  ]
}

If variants are insufficient to determine phenotype, use "Unknown" for phenotype and low confidence.`;

  try {
    const result = await callLLM(prompt, systemPrompt);
    
    if (!result.gene_results || !Array.isArray(result.gene_results)) {
      throw new Error("Invalid LLM response format");
    }

    return {
      success: true,
      results: result.gene_results.map(r => ({
        gene: r.gene,
        diplotype: r.diplotype || null,
        phenotype: r.phenotype || "Unknown",
        confidence_score: typeof r.confidence_score === "number" ? r.confidence_score : 0.3,
        reasoning: r.reasoning || ""
      })),
      fallback: false
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      fallback: true,
      error: error.message
    };
  }
}

async function predictDrugRisk(drug, geneProfiles) {
  const systemPrompt = `You are a clinical pharmacogenomics expert aligned with CPIC guidelines. Given a drug and patient gene phenotypes, determine the pharmacogenomic risk and dosing recommendations.

Drug-gene interactions to consider:
- CODEINE (CYP2D6): PM = ineffective, IM/RM = adjust dosage, URM = toxic
- WARFARIN (CYP2C9): PM/IM = adjust dosage (reduced clearance), NM = safe
- CLOPIDOGREL (CYP2C19): PM = ineffective (no activation), IM = adjust dosage, NM/RM/URM = safe
- SIMVASTATIN (SLCO1B1): PM = toxic (myopathy risk), IM = adjust dosage, NM = safe
- AZATHIOPRINE (TPMT): PM = toxic (myelosuppression), IM = adjust dosage, NM = safe
- FLUOROURACIL (DPYD): PM = toxic (fatal), IM = adjust dosage, NM = safe

Return EXACT JSON format. No markdown, no extra text.`;

  const geneInfo = geneProfiles
    .map(g => `- ${g.gene}: ${g.phenotype} (diplotype: ${g.diplotype || "unknown"})`)
    .join("\n");

  const prompt = `Patient Information:
Drug: ${drug}
Gene Profiles:
${geneInfo}

Return JSON in this exact format:
{
  "risk_label": "Safe|Adjust Dosage|Toxic|Ineffective|Unknown",
  "severity": "none|low|moderate|high|critical",
  "dose_adjustment": "specific clinical recommendation",
  "note": "clinical explanation with CPIC guideline reference"
}

Base severity on:
- none: NM phenotype for the drug's relevant gene
- low: Unknown or insufficient data
- moderate: IM, RM phenotypes
- high: PM phenotypes for drugs where this causes high risk
- critical: PM/URM phenotypes for drugs with life-threatening risks`;

  try {
    const result = await callLLM(prompt, systemPrompt);

    const risk = {
      risk_label: result.risk_label || "Unknown",
      severity: result.severity || "low",
      dose_adjustment: result.dose_adjustment || FALLBACK_RISK.dose_adjustment,
      note: result.note || FALLBACK_RISK.note
    };

    return { success: true, risk, fallback: false };
  } catch (error) {
    return { success: false, risk: FALLBACK_RISK, fallback: true, error: error.message };
  }
}

async function generateExplanation(gene, phenotype, diplotype, drug, riskLabel, severity, doseAdjustment) {
  const systemPrompt = `You are a clinical pharmacogenomics AI aligned with CPIC guidelines. Generate a concise, medically accurate explanation for a pharmacogenomic finding.

Requirements:
- Be medically precise and cite CPIC guidelines
- Use plain language but include necessary medical terminology
- If uncertain, state uncertainty clearly
- Output ONLY valid JSON with no markdown or extra text`;

  const prompt = `Generate a pharmacogenomic explanation:

Gene: ${gene}
Phenotype: ${phenotype}
Diplotype: ${diplotype || "unknown"}
Drug: ${drug}
Risk Label: ${riskLabel}
Severity: ${severity}
Dose Adjustment: ${doseAdjustment}

Return JSON in this exact format:
{
  "summary": "2-3 sentence summary of the pharmacogenomic finding",
  "mechanism": "Explanation of how this gene affects drug metabolism/response",
  "citations": ["CPIC guideline URL", "relevant publication"]
}`;

  try {
    const result = await callLLM(prompt, systemPrompt, 0.3);

    return {
      success: true,
      explanation: {
        summary: result.summary || FALLBACK_EXPLANATION.summary,
        mechanism: result.mechanism || FALLBACK_EXPLANATION.mechanism,
        citations: Array.isArray(result.citations) ? result.citations : []
      },
      fallback: false
    };
  } catch (error) {
    return {
      success: false,
      explanation: FALLBACK_EXPLANATION,
      fallback: true,
      error: error.message
    };
  }
}

async function batchAnalyze(variants, drug) {
  const genePhenotypeResult = await mapGenesToPhenotypes(variants);

  const geneProfiles = genePhenotypeResult.results;

  const drugRiskResult = await predictDrugRisk(drug, geneProfiles);

  const primaryGeneProfile = geneProfiles.find(
    g => g.gene === getGeneForDrug(drug)
  ) || { gene: getGeneForDrug(drug), phenotype: "Unknown", diplotype: null };

  const explanationResult = await generateExplanation(
    primaryGeneProfile.gene,
    primaryGeneProfile.phenotype,
    primaryGeneProfile.diplotype,
    drug,
    drugRiskResult.risk.risk_label,
    drugRiskResult.risk.severity,
    drugRiskResult.risk.dose_adjustment
  );

  return {
    genePhenotype: genePhenotypeResult,
    drugRisk: drugRiskResult,
    explanation: explanationResult
  };
}

function getGeneForDrug(drug) {
  const drugGeneMap = {
    codeine: "CYP2D6",
    warfarin: "CYP2C9",
    clopidogrel: "CYP2C19",
    simvastatin: "SLCO1B1",
    azathioprine: "TPMT",
    fluorouracil: "DPYD"
  };
  return drugGeneMap[drug.toLowerCase()] || null;
}

module.exports = {
  mapGenesToPhenotypes,
  predictDrugRisk,
  generateExplanation,
  batchAnalyze,
  getGeneForDrug,
  FALLBACK_PHENOTYPE,
  FALLBACK_RISK,
  FALLBACK_EXPLANATION
};
