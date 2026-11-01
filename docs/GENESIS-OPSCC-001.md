# GENESIS-OPSCC-001 — Research programme specification

**Disease:** Oropharyngeal squamous cell carcinoma (OPSCC), within head and neck squamous cell carcinoma (HNSCC), with reported secondary metastasis to the right lung.

## Context recorded (family-reported; not independently verified)

- Primary anatomical region: oropharynx.
- Soft palate involvement is reported; exact site of origin is not confirmed.
- Right lung involvement is reported as secondary metastasis from the oropharyngeal primary, not a separate primary lung cancer.
- HPV and p16 status: **unknown**.
- Previous treatments: chemotherapy and radiotherapy.
- Current treatment: pembrolizumab, as reported by family.
- Family reports treatment intent is no longer curative. This is contextual history, not a model-generated prognosis.
- PD-L1 CPS/TPS results: not reported.

Do not infer HPV status from the diagnosis, treatment, or cell-line choice. Do not infer pembrolizumab response or resistance from the fact it is being administered.

## Model-selection note

The existing FaDu model is hypopharyngeal and SCC-25 is oral-tongue derived; neither is a site-matched OPSCC model. UPCI-SCC-090 is added as an **HPV16-positive base-of-tongue comparator reference** (Cellosaurus CVCL_1899; ATCC CRL-3239). Base of tongue is within the oropharynx. It is not a proxy for the reported patient, whose HPV/p16 status remains unknown.

An HPV-negative comparator scenario is included conceptually, but a site-appropriate, provenance-verified HPV-negative OPSCC cell-line reference should be selected only after review. Do not silently substitute a laryngeal, hypopharyngeal or oral-cavity line and label it OPSCC.

## Research workstreams

1. **Oncogenesis:** epithelial transformation, HPV-associated versus HPV-independent mechanisms, genomic alterations, cell-cycle control, DNA damage response and apoptosis.
2. **Local invasion:** tumour–stroma interactions, extracellular matrix, adhesion, hypoxia and local tissue invasion.
3. **Metastatic cascade:** invasion, intravasation, lymphatic/haematogenous transport, survival in circulation, extravasation and pulmonary colonisation.
4. **Therapy resistance:** chemotherapy and radiotherapy mechanisms, DNA repair, apoptosis, clonal selection, heterogeneity and recurrence.
5. **Immune checkpoint biology:** PD-1/PD-L1 signalling, T-cell suppression, pembrolizumab mechanism, biomarkers and resistance.
6. **Systemic consequences:** local swallowing/airway effects; pulmonary function; cachexia; infection/sepsis; thrombosis; organ dysfunction; and treatment-related toxicity, including immune-mediated pneumonitis.

## Evidence labelling

Every model output must distinguish:
- **Established evidence:** findings supported by cited primary research, authoritative reviews or clinical evidence.
- **Model assumption:** simplifications introduced to make a computational model tractable.
- **Research hypothesis:** a question or predicted relationship that has not been experimentally validated.

## Planned comparison scenarios

- HPV16-positive OPSCC reference scenario.
- HPV-independent / HPV-negative OPSCC reference scenario.
- Unknown patient HPV/p16 status remains unknown; neither scenario is assigned to the patient.

## What Genesis may and may not claim

Genesis may provide literature-linked educational pathway maps, transparent conceptual models, sensitivity analyses, uncertainty ranges and hypothesis registers.

Genesis must not claim to reproduce this individual's cancer, predict pembrolizumab response, prescribe or rank treatments, infer a survival timeline, or predict the cause of death. A pathway score or simulated cell-survival change is not clinical evidence.

The programme is not a validated tumour-progression, metastasis, radiotherapy, chemotherapy, immunotherapy, therapeutic-vector or clinical-response simulator. The generic cell-culture viability simulator must not be repurposed or relabelled as one.

## Key references

- NCI PDQ, Oropharyngeal Cancer Treatment: https://www.cancer.gov/types/head-and-neck/hp/adult/oropharyngeal-treatment-pdq
- Cellosaurus UPCI-SCC-090 (CVCL_1899): https://www.cellosaurus.org/CVCL_1899
- ATCC UPCI:SCC090 (CRL-3239): https://www.atcc.org/products/crl-3239
- Cellosaurus UM-SCC-47 (CVCL_7759), HPV16-positive lateral-tongue model (not OPSCC): https://www.cellosaurus.org/CVCL_7759
- HPV-positive and HPV-negative HNSCC cell-line comparison study: https://pmc.ncbi.nlm.nih.gov/articles/PMC7464531/
