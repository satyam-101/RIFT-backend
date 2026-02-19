module.exports = function (drug, geneProfile) {
    console.log(drug);
  const drugGeneMap = {
    clopidogrel: "CYP2C19",
    codeine: "CYP2D6",
    warfarin: "CYP2C9",
    simvastatin: "SLCO1B1",
    azathioprine: "TPMT",
    fluorouracil: "DPYD"
  };

  const requiredGene = drugGeneMap[drug.toLowerCase()];

  if (!requiredGene) {
    return {
      matched: false,
      risk_label: "Unsupported Drug",
      severity: "low",
      recommendation_text: "Drug not supported in system."
    };
  }

  const geneData = geneProfile.genes[requiredGene];

  if (!geneData) {
    return {
      matched: false,
      risk_label: "Unknown",
      severity: "low",
      recommendation_text:
        "No actionable variants detected for required gene."
    };
  }

  const phenotype = geneData.phenotype;
    console.log(drug);
  // -----------------------------
  // CLOPIDOGREL – CYP2C19
  // -----------------------------
  if (drug.toLowerCase() === "clopidogrel") {

    if (phenotype === "PM") {
      return {
        matched: true,
        risk_label: "Ineffective",
        severity: "high",
        recommendation_text:
          "Avoid clopidogrel. Consider alternative antiplatelet therapy (e.g., prasugrel or ticagrelor)."
      };
    }

    if (phenotype === "IM") {
      return {
        matched: true,
        risk_label: "Reduced Response",
        severity: "moderate",
        recommendation_text:
          "Consider alternative therapy or monitor closely."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // -----------------------------
  // CODEINE – CYP2D6
  // -----------------------------
  if (drug.toLowerCase() === "codeine") {

    if (phenotype === "PM") {
      return {
        matched: true,
        risk_label: "Ineffective",
        severity: "high",
        recommendation_text:
          "Avoid codeine due to lack of activation. Consider alternative analgesic."
      };
    }

    if (phenotype === "UM") {
      return {
        matched: true,
        risk_label: "Toxicity Risk",
        severity: "high",
        recommendation_text:
          "Avoid codeine due to risk of morphine toxicity."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // -----------------------------
  // WARFARIN – CYP2C9
  // -----------------------------
  if (drug.toLowerCase() === "warfarin") {

    if (phenotype === "PM") {
      return {
        matched: true,
        risk_label: "High Bleeding Risk",
        severity: "high",
        recommendation_text:
          "Lower starting dose recommended. Monitor INR closely."
      };
    }

    if (phenotype === "IM") {
      return {
        matched: true,
        risk_label: "Moderate Bleeding Risk",
        severity: "moderate",
        recommendation_text:
          "Consider reduced initial dose and close INR monitoring."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // -----------------------------
  // SIMVASTATIN – SLCO1B1
  // -----------------------------
  if (drug.toLowerCase() === "simvastatin") {

    if (phenotype === "Low Function") {
      return {
        matched: true,
        risk_label: "Myopathy Risk",
        severity: "high",
        recommendation_text:
          "Consider lower dose or alternative statin."
      };
    }

    if (phenotype === "Intermediate Function") {
      return {
        matched: true,
        risk_label: "Moderate Myopathy Risk",
        severity: "moderate",
        recommendation_text:
          "Use lower dose or monitor for muscle symptoms."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // -----------------------------
  // AZATHIOPRINE – TPMT
  // -----------------------------
  if (drug.toLowerCase() === "azathioprine") {

    if (phenotype === "Low Activity") {
      return {
        matched: true,
        risk_label: "Severe Toxicity Risk",
        severity: "high",
        recommendation_text:
          "Avoid or drastically reduce dose due to risk of myelosuppression."
      };
    }

    if (phenotype === "Intermediate Activity") {
      return {
        matched: true,
        risk_label: "Moderate Toxicity Risk",
        severity: "moderate",
        recommendation_text:
          "Start with reduced dose and monitor blood counts."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // -----------------------------
  // FLUOROURACIL – DPYD
  // -----------------------------
  if (drug.toLowerCase() === "fluorouracil") {

    if (phenotype === "Low Activity") {
      return {
        matched: true,
        risk_label: "Severe Toxicity Risk",
        severity: "high",
        recommendation_text:
          "Avoid fluorouracil due to high risk of life-threatening toxicity."
      };
    }

    if (phenotype === "Intermediate Activity") {
      return {
        matched: true,
        risk_label: "High Toxicity Risk",
        severity: "moderate",
        recommendation_text:
          "Start with reduced dose and monitor closely."
      };
    }

    return {
      matched: true,
      risk_label: "Safe",
      severity: "low",
      recommendation_text:
        "Standard dosing recommended."
    };
  }

  // Fallback
  return {
    matched: false,
    risk_label: "Unknown",
    severity: "low",
    recommendation_text:
      "Unable to determine drug response from genetic profile."
  };
};
