const phenotypeMap = require("../data/phenotypeMap.json");

module.exports = function geneEngine(variants) {

  const genes = {};

  // Group stars by gene
  variants.forEach(v => {
    if (!v.star || !v.gene) return;

    if (!genes[v.gene]) {
      genes[v.gene] = [];
    }

    genes[v.gene].push(v.star);
  });

  const result = {};

  for (const gene in genes) {
    const stars = genes[gene];

    let diplotype;

    if (stars.length >= 2) {
      diplotype = `${stars[0]}/${stars[1]}`;
    } else {
      diplotype = `${stars[0]}/*1`;
    }

    const phenotype =
      phenotypeMap[gene]?.[diplotype] || "Unknown";

    result[gene] = {
      diplotype,
      phenotype
    };
  }

  return {
    genes: result
  };
};
