# Tumour taxonomy sources

## Primary source

- **NCI Thesaurus Neoplasm Core** (NCI Enterprise Vocabulary Services)
- Download base: https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Neoplasm
- Files used: `Neoplasm_Core.txt`, `Neoplasm_Core_Hierarchy.txt`, `Neoplasm_Core_Mappings_NCIm_Terms.csv`
- Review / import date: **2026-09-22**
- Licence posture: NCIt is published as free, non-licence-restricted terminology; attribute NCI EVS.

## ICD-O

- Morphology codes included **only** when an NCIm mapping with source `ICDO` exists for a Core concept.
- **ICD-O-4 full tables are not redistributed** (IARC/WHO). Reference: https://tumourclassification.iarc.who.int/icd-o-4/
- Genesis Lab does not fabricate site–histology combinations.

## Genesis Lab educational text

- `overview` fields are original Genesis Lab framing derived from structured fields (name, behaviour, hierarchy).
- `sourceDefinition` (when present) is the NCI Neoplasm Core definition, attributed, not claimed as Genesis Lab original prose.

## Regeneration

```bash
node scripts/import-tumour-taxonomy.mjs
# or offline from data/tumour-sources cache:
node scripts/import-tumour-taxonomy.mjs --offline
```

## Import summary (last run)

- Concepts imported: **1365**
- With ICD-O mapping: **512**
- Blood/lymphoid: **299**
- Paediatric-tagged (name/synonym heuristics): **13**
- Simulation-ready taxonomy disease entries: **0** (by design)
