// src/pharmacogenomics/activity/cyp2c19.activity.js

const LOSS_OF_FUNCTION = ["*2", "*3", "*4", "*5", "*6"];
const GAIN_OF_FUNCTION = ["*17"];

function getCYP2C19Phenotype(diplotype) {
  if (!diplotype) return "Unknown";

  const [a1, a2] = diplotype.split("/");

  const lofCount =
    (LOSS_OF_FUNCTION.includes(a1) ? 1 : 0) +
    (LOSS_OF_FUNCTION.includes(a2) ? 1 : 0);

  const gofCount =
    (GAIN_OF_FUNCTION.includes(a1) ? 1 : 0) +
    (GAIN_OF_FUNCTION.includes(a2) ? 1 : 0);

  // Poor Metabolizer
  if (lofCount === 2) return "PM";

  // Intermediate Metabolizer
  if (lofCount === 1 && gofCount === 0) return "IM";

  // Likely Intermediate (*2/*17)
  if (lofCount === 1 && gofCount === 1) return "IM";

  // Ultrarapid
  if (gofCount === 2) return "URM";

  // Rapid
  if (gofCount === 1 && lofCount === 0) return "RM";

  // Normal
  if (lofCount === 0 && gofCount === 0) return "NM";

  return "Unknown";
}

module.exports = { getCYP2C19Phenotype };