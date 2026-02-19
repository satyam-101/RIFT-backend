const { v4: uuidv4 } = require("uuid");
const parseVCF = require("../services/vcfParser");
const geneEngine = require("../services/geneEngine");
const drugEngine = require("../services/drugEngine");
const llmService = require("../services/llmService");
const confidence = require("../utils/confidence");
const responseSchema = require("../schemas/responseSchema");

exports.analyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No VCF file uploaded" });
    }

    const drugsInput = req.body.drug;
    if (!drugsInput) {
      return res.status(400).json({ error: "Drug name required" });
    }

    const drugs = drugsInput.split(",").map(d => d.trim());
    const vcfContent = req.file.buffer.toString();

    const variants = parseVCF(vcfContent);
    if (!variants.length) {
      return res.status(400).json({ error: "No supported genes detected" });
    }

    const geneProfile = geneEngine(variants);
    const drugResult = drugEngine(drugs[0], geneProfile);

    const llmResult = await llmService({
      gene: geneProfile.primary_gene,
      phenotype: geneProfile.phenotype,
      rsids: variants.map(v => v.rsid),
      drug: drugs[0]
    });

    const confidenceScore = confidence({
      variantsCount: variants.length,
      phenotype: geneProfile.phenotype,
      drugMatch: drugResult.matched
    });

    const response = {
      patient_id: `PATIENT_${uuidv4().slice(0, 8)}`,
      drug: drugs[0],
      timestamp: new Date().toISOString(),
      risk_assessment: {
        risk_label: drugResult.risk_label,
        confidence_score: confidenceScore,
        severity: drugResult.severity
      },
      pharmacogenomic_profile: {
        primary_gene: geneProfile.primary_gene,
        diplotype: geneProfile.diplotype,
        phenotype: geneProfile.phenotype,
        detected_variants: variants
      },
      clinical_recommendation: {
        guideline_source: "CPIC",
        recommendation_text: drugResult.recommendation_text
      },
      llm_generated_explanation: llmResult,
      quality_metrics: {
        vcf_parsing_success: true,
        genes_detected: variants.length,
        llm_success: llmResult.success
      }
    };

    responseSchema.parse(response);

    res.json(response);

  } catch (err) {
    next(err);
  }
};
