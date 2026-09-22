#!/usr/bin/env node
/**
 * Repeatable tumour taxonomy importer for Genesis Lab.
 *
 * Primary source: NCI Thesaurus Neoplasm Core (NCIt) — free, non-licence-restricted
 * terminology published by NCI EVS. Definitions and preferred terms are attributed.
 *
 * ICD-O morphology codes: only those present as NCIm "ICDO" mappings for Core concepts
 * are retained. Full ICD-O-4 morphology/topography tables from IARC/WHO are NOT
 * redistributed here (IARC requires permission for wider reproduction).
 *
 * Usage:
 *   node scripts/import-tumour-taxonomy.mjs
 *   node scripts/import-tumour-taxonomy.mjs --offline   # use cached downloads only
 */

import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(ROOT, 'data', 'tumour-sources');
const OUT_DIR = join(ROOT, 'src', 'catalogue', 'data', 'tumours');

const NCI_BASE = 'https://evs.nci.nih.gov/ftp1/NCI_Thesaurus/Neoplasm';
const FILES = {
  core: 'Neoplasm_Core.txt',
  hierarchy: 'Neoplasm_Core_Hierarchy.txt',
  hierarchyPlus: 'Neoplasm_Core_Hierarchy_Plus.txt',
  mappings: 'Neoplasm_Core_Mappings_NCIm_Terms.csv',
};

const SOURCE_META = {
  primarySource: 'NCI Thesaurus Neoplasm Core',
  publisher: 'NCI Enterprise Vocabulary Services (EVS)',
  downloadBase: NCI_BASE,
  reviewDate: new Date().toISOString().slice(0, 10),
  ncitLicenseNote:
    'NCIt is published by NCI EVS as free, non-licence-restricted biomedical terminology. Prefer terms, codes, synonyms, neoplastic status, and hierarchy from Neoplasm Core with attribution.',
  icdoNote:
    'ICD-O morphology codes included only when present as NCIm source=ICDO mappings for a Core concept (typically ICD-O-3 style morph/behaviour codes). Full ICD-O-4 morphology and topography tables are IARC/WHO copyright and are not bundled; see https://tumourclassification.iarc.who.int/icd-o-4/',
  genesisPolicy:
    'Genesis Lab writes original educational framing. NCI definitions are stored as attributed sourceDefinition fields and are not claimed as Genesis Lab original prose.',
};

const offline = process.argv.includes('--offline');

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

async function download(name) {
  ensureDir(CACHE);
  const dest = join(CACHE, name);
  if (existsSync(dest) && offline) return dest;
  if (existsSync(dest) && !process.argv.includes('--force')) {
    // Refresh if older than 30 days unless --force
    // Always refresh in CI-like runs when not --offline
  }
  if (offline && !existsSync(dest)) {
    throw new Error(`Missing cached source ${dest} (offline mode)`);
  }
  const url = `${NCI_BASE}/${name}`;
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  return dest;
}

function parseTsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const headers = lines[0].split('\t');
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    // Handle truncated rows gracefully
    if (cols.length < 2) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function splitSynonyms(raw) {
  if (!raw) return [];
  return [...new Set(
    raw
      .split(/\s*\|\|\s*|\|/)
      .map((s) => s.trim())
      .filter(Boolean),
  )];
}

function behaviourFromStatus(status) {
  const s = (status || '').trim().toLowerCase();
  if (s === 'benign') return 'benign';
  if (s === 'malignant') return 'malignant';
  if (s === 'precancerous') return 'in-situ-or-precancerous';
  if (s === 'uncertain malignant potential') return 'borderline-uncertain';
  if (s === 'undetermined') return 'undetermined';
  return 'undetermined';
}

function behaviourLabel(behaviour) {
  switch (behaviour) {
    case 'benign': return 'Benign neoplasm';
    case 'malignant': return 'Malignant neoplasm (cancer when clinically applicable)';
    case 'in-situ-or-precancerous': return 'In situ / precancerous';
    case 'borderline-uncertain': return 'Borderline / uncertain malignant potential';
    default: return 'Behaviour undetermined in source';
  }
}

function britishAmericanVariants(term) {
  const out = new Set();
  const add = (t) => {
    if (t) out.add(t);
  };
  add(term);
  add(term.replace(/\btumour\b/gi, 'tumor').replace(/\bTumour\b/g, 'Tumor').replace(/\bTUMOUR\b/g, 'TUMOR'));
  add(term.replace(/\btumor\b/gi, 'tumour').replace(/\bTumor\b/g, 'Tumour').replace(/\bTUMOR\b/g, 'TUMOUR'));
  add(term.replace(/\bleukaemia\b/gi, 'leukemia').replace(/\bLeukaemia\b/g, 'Leukemia'));
  add(term.replace(/\bleukemia\b/gi, 'leukaemia').replace(/\bLeukemia\b/g, 'Leukaemia'));
  add(term.replace(/\boesophageal\b/gi, 'esophageal').replace(/\bOesophageal\b/g, 'Esophageal'));
  add(term.replace(/\besophageal\b/gi, 'oesophageal').replace(/\bEsophageal\b/g, 'Oesophageal'));
  add(term.replace(/\bhaematopoietic\b/gi, 'hematopoietic').replace(/\bHaematopoietic\b/g, 'Hematopoietic'));
  add(term.replace(/\bhematopoietic\b/gi, 'haematopoietic').replace(/\bHematopoietic\b/g, 'Haematopoietic'));
  return [...out].filter((t) => t !== term);
}

function detectAgeGroup(name, synonyms) {
  const blob = `${name} ${synonyms.join(' ')}`.toLowerCase();
  if (/\b(pediatric|paediatric|childhood|juvenile|infantile)\b/.test(blob)) return 'paediatric';
  if (/\b(adult)\b/.test(blob)) return 'adult';
  return 'any';
}

function isSolidVsBlood(bodySystem, familyPath, name) {
  const blob = `${bodySystem} ${familyPath} ${name}`.toLowerCase();
  if (/hematopoietic|haematopoietic|lymphoid|leukemia|leukaemia|lymphoma|myeloma|myeloid|myeloproliferative|myelodysplastic/.test(blob)) {
    return 'blood-lymphoid';
  }
  return 'solid';
}

function originalOverview({ name, behaviour, bodySystem, family, tissueForm }) {
  const behaviourPhrase = {
    benign: 'classified as benign in the NCI Neoplasm Core',
    malignant: 'classified as malignant in the NCI Neoplasm Core',
    'in-situ-or-precancerous': 'classified as precancerous / in-situ related in the NCI Neoplasm Core',
    'borderline-uncertain': 'classified with uncertain malignant potential in the NCI Neoplasm Core',
    undetermined: 'with neoplastic behaviour marked undetermined in the NCI Neoplasm Core',
  }[behaviour];

  const systemBit = bodySystem ? ` It is organised under ${bodySystem.replace(/ Neoplasm$/, '').toLowerCase()} neoplasms` : '';
  const familyBit = family ? ` within the ${family} family` : '';
  const formBit = tissueForm === 'blood-lymphoid'
    ? ' This is a blood or lymphoid neoplasm and typically does not form a solid tumour mass in the same way as carcinomas or sarcomas.'
    : ' This entry refers to a solid-tissue neoplasm classification unless otherwise noted.';

  const simple = `${name} is a recognised neoplasm type (${behaviourPhrase}). Educational reference only.`;
  const standard = `${name} is ${behaviourPhrase}.${systemBit}${familyBit}.${formBit} Genesis Lab lists this as a searchable educational catalogue entry. Simulation of disease progression is not available for taxonomy entries.`;
  const technical = `Catalogue entity derived from NCIt Neoplasm Core preferred term “${name}”. Behaviour label mirrors Neoplastic Status; hierarchy placement follows Neoplasm Core simplified hierarchy (site and/or morphology). Not a clinical diagnosis tool. ICD-O codes appear only when an NCIm ICDO mapping exists for this concept.`;
  return { simple, standard, technical };
}

async function parseCsvMappings(path) {
  const text = readFileSync(path, 'latin1');
  // Simple CSV parser that handles quoted fields
  const rows = [];
  let i = 0;
  const len = text.length;
  function readRow() {
    const fields = [];
    let field = '';
    let inQuotes = false;
    while (i < len) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          }
          inQuotes = false;
          i++;
          continue;
        }
        field += c;
        i++;
        continue;
      }
      if (c === '"') {
        inQuotes = true;
        i++;
        continue;
      }
      if (c === ',') {
        fields.push(field);
        field = '';
        i++;
        continue;
      }
      if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        i++;
        fields.push(field);
        return fields;
      }
      field += c;
      i++;
    }
    if (field.length || fields.length) {
      fields.push(field);
      return fields;
    }
    return null;
  }

  const header = readRow();
  if (!header) return [];
  while (i < len) {
    const fields = readRow();
    if (!fields) break;
    const row = {};
    header.forEach((h, idx) => {
      row[h] = fields[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

function parseHierarchy(text) {
  const byCode = new Map(); // code -> { name, depth, parentCode, pathNames, pathCodes }
  const stack = []; // { code, name, depth }
  const siteSystems = new Map(); // code -> top-level site system name
  let section = null; // 'morphology' | 'site'

  for (const rawLine of text.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const depth = rawLine.match(/^\t*/)[0].length;
    const trimmed = rawLine.trim();
    const match = trimmed.match(/^(.*?)\s+\(([CR]_\d+|C\d+)\)(?:\s+\([BMU]\))?$/);
    if (!match) continue;
    const name = match[1].trim();
    const code = match[2];

    if (depth === 0) {
      if (name.startsWith('Neoplasm by Morphology')) section = 'morphology';
      else if (name.startsWith('Neoplasm by Site')) section = 'site';
      else section = null;
      stack.length = 0;
      stack.push({ code, name, depth });
      continue;
    }

    while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
    const parent = stack[stack.length - 1];
    const path = [...stack.map((s) => s.name), name];
    const pathCodes = [...stack.map((s) => s.code), code];
    stack.push({ code, name, depth });

    // Only store real NCIt concept codes (C####), not R_ roots
    if (!code.startsWith('C')) continue;

    const existing = byCode.get(code) ?? {
      code,
      name,
      morphPath: null,
      sitePath: null,
      morphFamily: null,
      bodySystem: null,
      parentMorph: null,
      parentSite: null,
    };

    if (section === 'morphology') {
      existing.morphPath = path.slice(1); // drop root
      existing.morphFamily = path[1] ?? name;
      existing.parentMorph = parent?.code?.startsWith('C') ? parent.code : null;
    }
    if (section === 'site') {
      existing.sitePath = path.slice(1);
      // top-level under site root is body system
      const systemName = path[1] ?? null;
      existing.bodySystem = systemName;
      existing.parentSite = parent?.code?.startsWith('C') ? parent.code : null;
      if (systemName && depth === 1) siteSystems.set(code, systemName);
    }
    byCode.set(code, existing);
  }

  return { byCode, siteSystems };
}

function ncitBrowserUrl(code) {
  return `https://ncithesaurus.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&code=${encodeURIComponent(code)}`;
}

function nciCancerTypeSearchUrl(name) {
  return `https://www.cancer.gov/search/results?swKeyword=${encodeURIComponent(name)}`;
}

async function main() {
  ensureDir(OUT_DIR);
  ensureDir(CACHE);

  const corePath = await download(FILES.core);
  const hierPath = await download(FILES.hierarchy);
  const mapPath = await download(FILES.mappings);

  const coreText = readFileSync(corePath, 'latin1');
  const coreRows = parseTsv(coreText);
  const hierText = readFileSync(hierPath, 'latin1');
  const { byCode: hier } = parseHierarchy(hierText);
  const mappings = await parseCsvMappings(mapPath);

  const icdoByCode = new Map();
  let icdoMappingRows = 0;
  for (const row of mappings) {
    if (row['NCIm Source'] !== 'ICDO') continue;
    icdoMappingRows++;
    const code = row['NCIt Code'];
    const list = icdoByCode.get(code) ?? [];
    const morph = (row['Source Code'] || '').trim();
    const term = (row['Source Term'] || '').trim();
    if (morph && !list.some((x) => x.code === morph && x.term === term)) {
      list.push({ code: morph, term, termType: row['Term Type'] || '' });
    }
    icdoByCode.set(code, list);
  }

  const entries = [];
  const exclusions = {
    missingCode: 0,
    missingPreferredTerm: 0,
    emptyStatus: 0,
  };

  for (const row of coreRows) {
    const code = (row.Code || '').trim();
    const preferred = (row['Preferred Term'] || '').trim();
    if (!code) {
      exclusions.missingCode++;
      continue;
    }
    if (!preferred) {
      exclusions.missingPreferredTerm++;
      continue;
    }
    const status = (row['Neoplastic Status'] || '').trim();
    if (!status) exclusions.emptyStatus++;

    const synonyms = splitSynonyms(row.Synonyms || '');
    const spellingVariants = [
      ...britishAmericanVariants(preferred),
      ...synonyms.flatMap((s) => britishAmericanVariants(s)),
    ];
    const behaviour = behaviourFromStatus(status);
    const h = hier.get(code);
    const bodySystem = h?.bodySystem ?? null;
    const family = h?.morphFamily ?? (h?.morphPath?.[0] ?? null);
    const subtypeParent = h?.parentMorph ?? h?.parentSite ?? null;
    const pathBlob = [...(h?.morphPath ?? []), ...(h?.sitePath ?? [])];
    const ageGroup = detectAgeGroup(preferred, [...synonyms, ...pathBlob]);
    const tissueForm = isSolidVsBlood(
      bodySystem ?? '',
      `${family ?? ''} ${pathBlob.join(' ')}`,
      preferred,
    );
    const icdo = icdoByCode.get(code) ?? [];
    // Prefer PT morph codes, unique
    const icdoCodes = [...new Set(icdo.map((x) => x.code).filter(Boolean))];
    const overview = originalOverview({
      name: preferred,
      behaviour,
      bodySystem,
      family,
      tissueForm,
    });

    const sourceDefinition = (row.Definition || '').trim();

    entries.push({
      ncitCode: code,
      preferredTerm: preferred,
      synonyms,
      spellingVariants: [...new Set(spellingVariants)],
      neoplasticStatus: status || 'Undetermined',
      behaviour,
      behaviourLabel: behaviourLabel(behaviour),
      bodySystem,
      tumourFamily: family,
      morphPath: h?.morphPath ?? [],
      sitePath: h?.sitePath ?? [],
      parentConceptCode: subtypeParent,
      ageGroup,
      tissueForm,
      icdoMorphologyCodes: icdoCodes,
      // Keep a short attributed excerpt only — full NCI text remains on the NCIt concept page.
      sourceDefinitionExcerpt: sourceDefinition ? sourceDefinition.slice(0, 320) : null,
      overview,
      sourceLinks: {
        ncitConcept: ncitBrowserUrl(code),
        nciCancerSearch: nciCancerTypeSearchUrl(preferred),
        icdo4Reference: 'https://tumourclassification.iarc.who.int/icd-o-4/',
      },
      simulationReady: false,
      microscopeSupported: tissueForm === 'blood-lymphoid' || Boolean(bodySystem),
      entryKind: 'neoplasm-taxonomy',
    });
  }

  // Sort stable by preferred term
  entries.sort((a, b) => a.preferredTerm.localeCompare(b.preferredTerm));

  const statusCounts = {};
  const systemCounts = {};
  const formCounts = {};
  for (const e of entries) {
    statusCounts[e.neoplasticStatus] = (statusCounts[e.neoplasticStatus] || 0) + 1;
    systemCounts[e.bodySystem || '(no site placement)'] = (systemCounts[e.bodySystem || '(no site placement)'] || 0) + 1;
    formCounts[e.tissueForm] = (formCounts[e.tissueForm] || 0) + 1;
  }

  const report = {
    importedAt: new Date().toISOString(),
    source: SOURCE_META,
    files: {
      core: FILES.core,
      hierarchy: FILES.hierarchy,
      mappings: FILES.mappings,
      cacheDir: 'data/tumour-sources/ (gitignored download cache)',
    },
    counts: {
      neoplasmCoreConcepts: entries.length,
      withIcdoMapping: entries.filter((e) => e.icdoMorphologyCodes.length > 0).length,
      icdoMappingRows,
      withBodySystem: entries.filter((e) => e.bodySystem).length,
      withMorphFamily: entries.filter((e) => e.tumourFamily).length,
      paediatricTagged: entries.filter((e) => e.ageGroup === 'paediatric').length,
      bloodLymphoid: entries.filter((e) => e.tissueForm === 'blood-lymphoid').length,
      solid: entries.filter((e) => e.tissueForm === 'solid').length,
      simulationReadyTaxonomy: 0,
    },
    statusCounts,
    systemCounts,
    formCounts,
    exclusions,
    licensingLimits: [
      'Full ICD-O-4 morphology and topography tables are not bundled (IARC/WHO copyright; wider reproduction requires permission).',
      'ICD-O codes present are those linked via NCIm ICDO mappings to Neoplasm Core concepts (commonly ICD-O-3 style).',
      'NCI cancer.gov page prose is not scraped or copied; only search links are provided.',
      'Neoplasm Core is a curated core (~1.4k concepts), not a claim of every rare entity in full NCIt or every ICD-O code.',
      'Site–histology pairs are not invented: hierarchy placements come only from Neoplasm Core hierarchy files.',
    ],
    completenessStatement:
      'This catalogue mirrors NCI Thesaurus Neoplasm Core membership and hierarchy for the downloaded release. It is not a literal claim of completeness of all recognised tumours worldwide or of ICD-O-4.',
  };

  const bundle = {
    meta: {
      ...SOURCE_META,
      generatedAt: report.importedAt,
      entryCount: entries.length,
    },
    entries,
  };

  writeFileSync(join(OUT_DIR, 'neoplasm-core.generated.json'), JSON.stringify(bundle));
  writeFileSync(join(OUT_DIR, 'import-report.json'), JSON.stringify(report, null, 2));

  const sourcesMd = `# Tumour taxonomy sources

## Primary source

- **NCI Thesaurus Neoplasm Core** (NCI Enterprise Vocabulary Services)
- Download base: ${NCI_BASE}
- Files used: \`${FILES.core}\`, \`${FILES.hierarchy}\`, \`${FILES.mappings}\`
- Review / import date: **${SOURCE_META.reviewDate}**
- Licence posture: NCIt is published as free, non-licence-restricted terminology; attribute NCI EVS.

## ICD-O

- Morphology codes included **only** when an NCIm mapping with source \`ICDO\` exists for a Core concept.
- **ICD-O-4 full tables are not redistributed** (IARC/WHO). Reference: https://tumourclassification.iarc.who.int/icd-o-4/
- Genesis Lab does not fabricate site–histology combinations.

## Genesis Lab educational text

- \`overview\` fields are original Genesis Lab framing derived from structured fields (name, behaviour, hierarchy).
- \`sourceDefinition\` (when present) is the NCI Neoplasm Core definition, attributed, not claimed as Genesis Lab original prose.

## Regeneration

\`\`\`bash
node scripts/import-tumour-taxonomy.mjs
# or offline from data/tumour-sources cache:
node scripts/import-tumour-taxonomy.mjs --offline
\`\`\`

## Import summary (last run)

- Concepts imported: **${entries.length}**
- With ICD-O mapping: **${report.counts.withIcdoMapping}**
- Blood/lymphoid: **${report.counts.bloodLymphoid}**
- Paediatric-tagged (name/synonym heuristics): **${report.counts.paediatricTagged}**
- Simulation-ready taxonomy disease entries: **0** (by design)
`;

  writeFileSync(join(OUT_DIR, 'SOURCES.md'), sourcesMd);

  console.log(JSON.stringify(report.counts, null, 2));
  console.log('Wrote', join(OUT_DIR, 'neoplasm-core.generated.json'));
  console.log('Wrote', join(OUT_DIR, 'import-report.json'));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
