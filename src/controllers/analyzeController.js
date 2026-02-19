const { v4: uuidv4 } = require("uuid");
const parseVCF = require("../services/vcfParser");
const geneEngine = require("../services/geneEngine");
const drugEngine = require("../services/drugEngine");
const llmService = require("../services/llmService");
const confidence = require("../utils/confidence");
const responseSchema = require("../schemas/responseSchema");

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

    const drugsInput = req.body.drug;
    if (!drugsInput) {
      return res.status(400).json({ error: "Drug name required" });
    }

    const drugs = drugsInput.split(",").map(d => d.trim());
    const drugName = drugs[0];
    const vcfContent = req.file.buffer.toString();

    const { patient_id: vcfPatientId, variants } = parseVCF(vcfContent);

    if (!variants.length) {
      return res.status(400).json({ error: "No supported pharmacogenomic variants detected in VCF" });
    }

    const geneProfile = geneEngine(variants);
    const drugResult = drugEngine(drugName, geneProfile);

    const primaryGene = drugGeneMap[drugName.toLowerCase()] || "Unknown";
    const geneData = geneProfile.genes[primaryGene];
    const diplotype = geneData?.diplotype || "Unknown";
    const phenotype = geneData?.phenotype || "Unknown";

    const detectedGenes = Object.keys(geneProfile.genes);
    const missingAnnotations = supportedGenes.filter(g => !detectedGenes.includes(g));

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

    const patientId = vcfPatientId
      ? `PATIENT_${vcfPatientId}`
      : `PATIENT_${uuidv4().slice(0, 8).toUpperCase()}`;

    const response = {
      patient_id: patientId,
      drug: drugName,
      timestamp: new Date().toISOString(),
      risk_assessment: {
        risk_label: drugResult.risk_label,
        confidence_score: confidenceScore,
        severity: drugResult.severity
      },
      pharmacogenomic_profile: {
        primary_gene: primaryGene,
        diplotype,
        phenotype,
        detected_variants: variants
      },
      clinical_recommendation: {
        dose_adjustment: drugResult.dose_adjustment,
        note: drugResult.note
      },
      llm_generated_explanation: explanation,
      quality_metrics: {
        vcf_parsing_success: true,
        missing_annotations: missingAnnotations
      }
    };

    responseSchema.parse(response);

    res.json(response);
  } catch (err) {
    next(err);
  }
};
