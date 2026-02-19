const supportedGenes = ["CYP2D6", "CYP2C19", "CYP2C9", "SLCO1B1", "TPMT", "DPYD"];

module.exports = function parseVCF(content) {
  const lines = content.split(/\r?\n/);
  const variants = [];
  let patient_id = null;

  for (const line of lines) {
    if (line.startsWith("#CHROM")) {
      const cols = line.split("\t");
      if (cols.length >= 10) {
        patient_id = cols[9].trim();
      }
      continue;
    }

    if (line.startsWith("#") || !line.trim()) continue;

    const cols = line.split("\t");
    if (cols.length < 8) continue;

    const rsid = cols[2];
    const info = cols[7];
    const infoParts = Object.fromEntries(
      info.split(";").map(i => {
        const [key, ...rest] = i.split("=");
        return [key, rest.join("=")];
      })
    );

    const gene = infoParts.GENE;
    const allele = infoParts.STAR;

    if (gene && supportedGenes.includes(gene)) {
      variants.push({
        rsid: rsid || ".",
        gene,
        allele: allele || "Unknown",
        effect: allele
          ? `Variant allele ${allele} detected in ${gene}`
          : `Variant detected in ${gene}`
      });
    }
  }

  return { patient_id, variants };
};
