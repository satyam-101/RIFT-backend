const phenotypeMap = require("../data/phenotypeMap.json");

module.exports = function geneEngine(variants) {
  const genes = {};

  variants.forEach(v => {
    if (!v.allele || !v.gene) return;
    if (!genes[v.gene]) genes[v.gene] = [];
    genes[v.gene].push(v.allele);
  });

  const result = {};

  const supportedGenes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

  for (const gene of supportedGenes) {
    const alleles = genes[gene] || ["*1"];  // assume wild-type if missing
    const diplotype = alleles.length >= 2 ? `${alleles[0]}/${alleles[1]}` : `${alleles[0]}/*1`;

    // Sort alleles alphabetically to match phenotypeMap keys
    const sortedDiplotype = diplotype
      .split("/")
      .map(a => a.trim())
      .sort()
      .join("/");

    const phenotype = phenotypeMap[gene]?.[sortedDiplotype] || "Unknown";

    result[gene] = { diplotype: sortedDiplotype, phenotype };
  }

  return { genes: result };
};
