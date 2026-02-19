const supportedGenes = ["CYP2D6","CYP2C19","CYP2C9","SLCO1B1","TPMT","DPYD"];

module.exports = function parseVCF(content) {
  const lines = content.split("\n");
  const results = [];

  lines.forEach(line => {
    if (line.startsWith("#")) return;
    const cols = line.split("\t");
    if (cols.length < 8) return;

    const info = cols[7];
    const infoParts = Object.fromEntries(
      info.split(";").map(i => i.split("="))
    );

    const gene = infoParts.GENE;
    const star = infoParts.STAR;
    const rsid = cols[2];

    if (supportedGenes.includes(gene)) {
      results.push({ gene, star, rsid });
    }
  });

  return results;
};
