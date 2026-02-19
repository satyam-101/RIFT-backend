const { z } = require("zod");

module.exports = z.object({
  patient_id: z.string(),
  drug: z.string(),
  timestamp: z.string(),
  risk_assessment: z.object({
    risk_label: z.string(),
    confidence_score: z.number(),
    severity: z.string()
  }),
  pharmacogenomic_profile: z.object({
    primary_gene: z.string(),
    diplotype: z.string(),
    phenotype: z.string(),
    detected_variants: z.array(
      z.object({
        rsid: z.string(),
        gene: z.string(),
        allele: z.string(),
        effect: z.string()
      })
    )
  }),
  clinical_recommendation: z.object({
    dose_adjustment: z.string(),
    note: z.string()
  }),
  llm_generated_explanation: z.object({
    summary: z.string(),
    mechanism: z.string(),
    citations: z.array(z.string())
  }),
  quality_metrics: z.object({
    vcf_parsing_success: z.boolean(),
    missing_annotations: z.array(z.string())
  })
});
