const cpicRules = require("../data/cpicRules.json");

const drugGeneMap = {
  codeine: "CYP2D6",
  warfarin: "CYP2C9",
  clopidogrel: "CYP2C19",
  simvastatin: "SLCO1B1",
  azathioprine: "TPMT",
  fluorouracil: "DPYD"
};

module.exports = function drugEngine(drug, geneProfile) {
  const drugKey = drug.toUpperCase();
  const requiredGene = drugGeneMap[drug.toLowerCase()];

  if (!requiredGene || !cpicRules[drugKey]) {
    return {
      matched: false,
      risk_label: "Unknown",
      severity: "low",
      dose_adjustment: "Drug not supported in this system.",
      note: "No CPIC guideline available for this drug-gene pair."
    };
  }

  const geneData = geneProfile.genes[requiredGene];

  if (!geneData) {
    const fallback = cpicRules[drugKey]["Unknown"];
    return {
      matched: false,
      risk_label: fallback ? fallback.risk_label : "Unknown",
      severity: fallback ? fallback.severity : "low",
      dose_adjustment: fallback
        ? fallback.dose_adjustment
        : "No actionable variants detected for required gene.",
      note: fallback
        ? fallback.note
        : "Relevant gene not found in VCF data."
    };
  }

  const phenotype = geneData.phenotype;
  const rule = cpicRules[drugKey][phenotype] || cpicRules[drugKey]["Unknown"];

  if (!rule) {
    return {
      matched: true,
      risk_label: "Unknown",
      severity: "low",
      dose_adjustment: "No CPIC rule found for this phenotype.",
      note: `Phenotype '${phenotype}' not covered in CPIC guidelines for ${drug}.`
    };
  }

  return {
  matched: true,
  risk_label: rule.risk_label,
  severity: rule.severity,
  dose_adjustment: rule.dose_adjustment,
  note: rule.note,
  alternative_drugs: rule.alternative_drugs || []
};
};
