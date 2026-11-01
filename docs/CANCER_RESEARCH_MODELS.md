# Cancer research model catalogue

Genesis-Lab already imports the NCI Thesaurus Neoplasm Core taxonomy (see `SOURCES.md`) and exposes it through Organisms & Biological Systems. The taxonomy is broad reference data, not a promise that every disease has a simulation.

This extension adds traceable cell-line reference records for:
- **Head and neck squamous cell carcinoma (HNSCC):** FaDu (hypopharynx; NCIt C4043) and SCC-25 (oral tongue; NCIt C4648).
- **Melanoma:** A-375 (amelanotic melanoma; NCIt C3802).
- **Pancreatic ductal adenocarcinoma (PDAC):** PANC-1 (NCIt C9120).

Existing curated cell-line records already cover cervical, breast, lung adenocarcinoma, colorectal, prostate, glioblastoma, T-cell leukaemia and chronic myeloid leukaemia contexts. The imported tumour taxonomy adds many further tumour entities and synonyms across body systems.

## Evidence and safeguards

- Cell-line disease/site provenance is linked to Cellosaurus records; FaDu is additionally cross-checked against DSMZ.
- A cell line is not interchangeable with every tumour of the same histology or anatomical site.
- The new records are **reference-only**. They are deliberately excluded from Virtual Lab and Experiment Builder.
- The current generic mammalian culture viability model is not a cancer progression model, metastasis model, therapeutic-vector model or clinical-response predictor.
- For a future HNSCC programme, choose models only after the primary anatomical site and relevant molecular context are known. FaDu and SCC-25 represent different head-and-neck sites; neither should be treated as a patient-specific proxy.
- Keep primary tumour, regional lymph-node involvement and distant metastasis distinct in study design. A lung metastasis from HNSCC must not automatically be relabelled as primary lung squamous carcinoma.

## Primary cell-line references

- FaDu: https://www.cellosaurus.org/CVCL_1218
- SCC-25: https://www.cellosaurus.org/CVCL_1682
- A-375: https://www.cellosaurus.org/CVCL_0132
- PANC-1: https://www.cellosaurus.org/CVCL_0480
- DSMZ FaDu catalogue: https://webshop.dsmz.de/en/human-animal-cell-lines/fadu.html
- UKHSA Culture Collections A-375: https://www.culturecollections.org.uk/nop/product/a375
