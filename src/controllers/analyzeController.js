const { v4: uuidv4 } = require("uuid");
const parseVCF = require("../services/vcfParser");
const geneEngine = require("../services/geneEngine");
const drugEngine = require("../services/drugEngine");
const llmService = require("../services/llmService");
const confidence = require("../utils/confidence");
// const responseSchema = require("../schemas/responseSchema"); // temporarily disabled for multi-drug

const drugGeneMap = {
  codeine: "CYP2D6",
  warfarin: "CYP2C9",
  clopidogrel: "CYP2C19",
  simvastatin: "SLCO1B1",
  azathioprine: "TPMT",
  fluorouracil: "DPYD"
};

const supportedGenes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

exports.analyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No VCF file uploaded" });
    }

    let drugs = req.body.drugs;

    if (!drugs) {
      return res.status(400).json({ error: "drugs array required" });
    }

    // Handle stringified JSON (common with form-data)
    if (typeof drugs === "string") {
      try {
        drugs = JSON.parse(drugs);
      } catch {
        return res.status(400).json({ error: "Invalid drugs format. Must be JSON array." });
      }
    }

    if (!Array.isArray(drugs) || drugs.length === 0) {
      return res.status(400).json({ error: "drugs must be a non-empty array" });
    }

    const vcfContent = req.file.buffer.toString();
    const { patient_id: vcfPatientId, variants } = parseVCF(vcfContent);

    if (!variants.length) {
      return res.status(400).json({
        error: "No supported pharmacogenomic variants detected in VCF"
      });
    }

    const geneProfile = geneEngine(variants);

    const detectedGenes = Object.keys(geneProfile.genes);
    const missingAnnotations = supportedGenes.filter(
      g => !detectedGenes.includes(g)
    );

    const drugAnalyses = [];

    for (const drugName of drugs) {
      const drugResult = drugEngine(drugName, geneProfile);

      const primaryGene = drugGeneMap[drugName.toLowerCase()] || "Unknown";
      const geneData = geneProfile.genes[primaryGene];

      const diplotype = geneData?.diplotype || "Unknown";
      const phenotype = geneData?.phenotype || "Unknown";

      const llmResult = await llmService({
        gene: primaryGene,
        phenotype,
        rsids: variants.map(v => v.rsid),
        drug: drugName,
        guidelineText: drugResult.note || ""
      });

      const { success: llmSuccess, ...explanation } = llmResult;

      const confidenceScore = confidence({
        variantsCount: variants.length,
        phenotype,
        drugMatch: drugResult.matched
      });

      drugAnalyses.push({
        drug: drugName,
        risk_assessment: {
          risk_label: drugResult.risk_label,
          severity: drugResult.severity,
          confidence_score: confidenceScore,
          action_required:
          drugResult.risk_label === "Toxic" ||
          drugResult.risk_label === "Ineffective"
        },
        pharmacogenomic_profile: {
          primary_gene: primaryGene,
          diplotype,
          phenotype
        },
        clinical_recommendation: {
          dose_adjustment: drugResult.dose_adjustment,
          alternative_drugs: drugResult.alternative_drugs || [],
          note: drugResult.note,

        },
        llm_generated_explanation: explanation
      });
    }

    const patientId = vcfPatientId
      ? `PATIENT_${vcfPatientId}`
      : `PATIENT_${uuidv4().slice(0, 8).toUpperCase()}`;

    const response = {
      patient_id: patientId,
      timestamp: new Date().toISOString(),
      detected_variants: variants,
      gene_analysis: geneProfile.genes,
      drug_analysis: drugAnalyses,
      quality_metrics: {
        vcf_parsing_success: true,
        missing_annotations: missingAnnotations
      }
    };

    // responseSchema.parse(response); // will rebuild schema later

    res.json(response);

  } catch (err) {
    next(err);
  }
};