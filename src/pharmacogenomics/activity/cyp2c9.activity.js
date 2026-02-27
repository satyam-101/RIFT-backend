// src/pharmacogenomics/activity/cyp2c9.activity.js

const CYP2C9_ACTIVITY = {
  "*1": 1,

  "*2": 0.5,
  "*5": 0.5,
  "*8": 0.5,
  "*11": 0.5,
  "*12": 0.5,

  "*3": 0,
  "*6": 0
};

function calculateCYP2C9ActivityScore(diplotype) {
  if (!diplotype) return null;

  const [a1, a2] = diplotype.split("/");

  const score1 = CYP2C9_ACTIVITY[a1];
  const score2 = CYP2C9_ACTIVITY[a2];

  if (score1 === undefined || score2 === undefined) {
    return null;
  }

  return score1 + score2;
}

function getCYP2C9Phenotype(score) {
  if (score === null) return "Unknown";

  if (score >= 2) return "NM";
  if (score >= 1 && score < 2) return "IM";
  if (score < 1) return "PM";

  return "Unknown";
}

module.exports = {
  calculateCYP2C9ActivityScore,
  getCYP2C9Phenotype
};