module.exports = function confidence({ variantsCount, phenotype, drugMatch }) {
  let score = 0.3;

  if (variantsCount > 0) score += 0.3;
  if (phenotype !== "Unknown") score += 0.2;
  if (drugMatch) score += 0.2;

  return Math.min(1, parseFloat(score.toFixed(2)));
};
