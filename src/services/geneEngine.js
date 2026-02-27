const phenotypeMap = require("../data/phenotypeMap.json");

module.exports = function geneEngine(variants) {
  const genes = {};
  const warnings = [];

  // Group alleles per gene
  variants.forEach(v => {
    if (!v.allele || !v.gene) return;

    if (!genes[v.gene]) genes[v.gene] = new Set();
    genes[v.gene].add(v.allele);
  });

  const result = {};
  const supportedGenes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

  for (const gene of supportedGenes) {
    const alleleArray = genes[gene] ? Array.from(genes[gene]) : [];

    if (alleleArray.length > 2) {
      warnings.push(`More than 2 alleles detected for ${gene}. Using first two deterministically.`);
    }

    // Take first 2 alleles only
    const selectedAlleles = alleleArray.slice(0, 2);

    let diplotype;

    if (selectedAlleles.length === 2) {
      diplotype = selectedAlleles.sort().join("/");
    } else if (selectedAlleles.length === 1) {
      diplotype = `${selectedAlleles[0]}/*1`;
    } else {
      diplotype = "*1/*1"; // Wild-type default
    }

    const phenotype =
      phenotypeMap[gene]?.[diplotype] ||
      phenotypeMap[gene]?.[diplotype.split("/").reverse().join("/")] ||
      "Unknown";

    result[gene] = {
      diplotype,
      phenotype
    };
  }

  return {
    genes: result,
    warnings
  };
};