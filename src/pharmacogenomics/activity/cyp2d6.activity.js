const CYP2D6_ACTIVITY = {
  "*1": 1,
  "*2": 1,

  "*41": 0.5,
  "*10": 0.5,
  "*17": 0.5,

  "*4": 0,
  "*5": 0,
  "*6": 0
};

function calculateCYP2D6ActivityScore(diplotype) {
  if (!diplotype) return null;

  const [allele1, allele2] = diplotype.split("/");

  const score1 = CYP2D6_ACTIVITY[allele1];
  const score2 = CYP2D6_ACTIVITY[allele2];

  if (score1 === undefined || score2 === undefined) {
    return null;
  }

  return score1 + score2;
}

function getCYP2D6Phenotype(score) {
  if (score === null) return "Unknown";

  if (score === 0) return "PM";
  if (score > 0 && score < 1.25) return "IM";
  if (score >= 1.25 && score <= 2.25) return "NM";
  if (score > 2.25) return "URM";

  return "Unknown";
}

module.exports = {
  calculateCYP2D6ActivityScore,
  getCYP2D6Phenotype
};