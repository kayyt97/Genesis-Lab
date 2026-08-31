import type {
  BiologicalEntity,
  Compound,
  Experiment,
  NotebookEntry,
  Sample,
  SimulationResult,
  MolecularModelPlaceholder,
} from '../types';

export const demoSamples: Sample[] = [
  {
    id: 'SMP-001',
    name: 'E. coli K-12 Broth Culture',
    sampleType: 'bacterial-culture',
    source: 'Laboratory stock strain',
    dateCreated: '2026-08-28T09:00:00Z',
    storageCondition: '4°C, LB broth',
    status: 'active',
    associatedExperimentIds: ['EXP-001'],
    notes: 'Demonstration bacterial culture for educational simulations.',
  },
  {
    id: 'SMP-002',
    name: 'HeLa Cell Suspension',
    sampleType: 'cell-culture',
    source: 'Cell line repository (demonstration)',
    dateCreated: '2026-08-25T14:30:00Z',
    storageCondition: '37°C, 5% CO₂, DMEM medium',
    status: 'active',
    associatedExperimentIds: ['EXP-002'],
    notes: 'Mammalian cell culture for temperature stress demonstrations.',
  },
  {
    id: 'SMP-003',
    name: 'Environmental Soil Extract',
    sampleType: 'environmental',
    source: 'Simulated field collection site A',
    dateCreated: '2026-08-20T11:00:00Z',
    storageCondition: 'Room temperature, sterile container',
    status: 'stored',
    associatedExperimentIds: [],
    notes: 'Mixed environmental sample for future microbiome studies.',
  },
  {
    id: 'SMP-004',
    name: 'Plasmid DNA — lacZ Reporter',
    sampleType: 'dna',
    source: 'Molecular biology prep (demonstration)',
    dateCreated: '2026-08-22T16:00:00Z',
    storageCondition: '-20°C',
    status: 'stored',
    associatedExperimentIds: [],
    notes: 'Purified plasmid DNA for educational reference.',
  },
];

export const demoOrganisms: BiologicalEntity[] = [
  {
    id: 'ORG-001',
    commonName: 'E. coli',
    scientificName: 'Escherichia coli',
    category: 'bacteria',
    classification: 'Domain Bacteria; Phylum Pseudomonadota; Class Gammaproteobacteria',
    description:
      'A rod-shaped, facultatively anaerobic bacterium commonly used as a model organism in molecular biology and microbiology education.',
    characteristics: [
      'Gram-negative',
      'Facultative anaerobe',
      'Mesophilic (optimal ~37°C)',
      'Rapid doubling time under ideal conditions',
    ],
    preferredEnvironment: {
      temperature: 37,
      ph: 7.0,
      oxygen: 21,
      nutrientAvailability: 80,
    },
    associatedExperimentIds: ['EXP-001'],
    references: ['Demonstration data — not a clinical reference strain'],
  },
  {
    id: 'ORG-002',
    commonName: 'SARS-CoV-2 (demonstration)',
    scientificName: 'Severe acute respiratory syndrome coronavirus 2',
    category: 'viruses',
    classification: 'Realm Riboviria; Order Nidovirales; Family Coronaviridae',
    description:
      'An enveloped RNA virus. Included as a demonstration entry for educational taxonomy and simulation architecture — not for diagnostic use.',
    characteristics: [
      'Single-stranded RNA genome',
      'Enveloped',
      'Obligate intracellular parasite',
      'Host-dependent replication',
    ],
    preferredEnvironment: {
      temperature: 37,
      ph: 7.4,
    },
    associatedExperimentIds: [],
    references: ['Educational reference only'],
  },
  {
    id: 'ORG-003',
    commonName: "Baker's Yeast",
    scientificName: 'Saccharomyces cerevisiae',
    category: 'fungi',
    classification: 'Kingdom Fungi; Phylum Ascomycota; Class Saccharomycetes',
    description:
      'A unicellular fungus widely used in baking, brewing, and as a eukaryotic model organism.',
    characteristics: [
      'Unicellular eukaryote',
      'Budding reproduction',
      'Facultative anaerobe',
      'Optimal growth ~30°C',
    ],
    preferredEnvironment: {
      temperature: 30,
      ph: 5.5,
      oxygen: 21,
      nutrientAvailability: 70,
    },
    associatedExperimentIds: [],
    references: ['Demonstration data'],
  },
  {
    id: 'ORG-004',
    commonName: 'HeLa Cells',
    scientificName: 'Homo sapiens (HeLa cell line)',
    category: 'mammalian-cells',
    classification: 'Eukaryotic adherent cell line derived from human cervical epithelium',
    description:
      'An immortalised human cell line extensively used in biomedical research. Demonstration entry only.',
    characteristics: [
      'Adherent morphology',
      'Diploid (with known anomalies)',
      'Requires serum-supplemented medium',
      'Sensitive to temperature extremes',
    ],
    preferredEnvironment: {
      temperature: 37,
      ph: 7.4,
      oxygen: 21,
      carbonDioxide: 5,
      humidity: 95,
    },
    associatedExperimentIds: ['EXP-002'],
    references: ['Demonstration data — ethical and historical context applies to real HeLa use'],
  },
  {
    id: 'ORG-005',
    commonName: 'Green Fluorescent Protein',
    scientificName: 'Green fluorescent protein (Aequorea victoria)',
    category: 'proteins',
    classification: 'Structural protein; β-barrel fold with chromophore',
    description:
      'A protein that emits green fluorescence when exposed to blue light. Used as a reporter in molecular biology.',
    characteristics: [
      '238 amino acids',
      'Autocatalytic chromophore formation',
      'Stable under neutral pH',
      'Denatures at extreme pH/temperature',
    ],
    preferredEnvironment: {
      temperature: 25,
      ph: 7.0,
    },
    associatedExperimentIds: [],
    references: ['Demonstration data'],
  },
  {
    id: 'ORG-006',
    commonName: 'Prion Protein (PrP)',
    scientificName: 'Prion protein (demonstration)',
    category: 'prions',
    classification: 'Misfolded proteinaceous infectious particle',
    description:
      'Prions are misfolded proteins that propagate by inducing conformational change in normal protein variants. Educational entry only.',
    characteristics: [
      'Protein-only infectious agent',
      'Conformation-dependent infectivity',
      'Extremely resistant to standard decontamination',
      'Associated with TSE diseases',
    ],
    preferredEnvironment: {},
    associatedExperimentIds: [],
    references: ['Educational reference — see Safety section for handling principles'],
  },
];

export const demoCompounds: Compound[] = [
  {
    id: 'CMP-001',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    molecularMass: 58.44,
    massUnit: 'g/mol',
    category: 'Salt / Electrolyte',
    description:
      'A common ionic compound used in buffers and media preparation. Adjusts osmolarity and salinity.',
    knownInteractions: ['Affects osmotic balance in cells', 'Used in PBS buffer preparation'],
    experimentalNotes: 'Demonstration compound for salinity and osmolarity experiments.',
    references: ['Standard laboratory reagent'],
  },
  {
    id: 'CMP-002',
    name: 'Glucose',
    formula: 'C₆H₁₂O₆',
    molecularMass: 180.16,
    massUnit: 'g/mol',
    category: 'Carbohydrate / Nutrient',
    description:
      'A primary energy source for many organisms. Commonly added to culture media.',
    knownInteractions: ['Metabolised via glycolysis', 'Supports bacterial and yeast growth'],
    experimentalNotes: 'Used to demonstrate nutrient availability effects on growth.',
    references: ['Demonstration data'],
  },
  {
    id: 'CMP-003',
    name: 'Ethanol',
    formula: 'C₂H₅OH',
    molecularMass: 46.07,
    massUnit: 'g/mol',
    category: 'Solvent / Disinfectant',
    description:
      'An alcohol used as a solvent and disinfectant in laboratory settings. Educational reference for chemical safety.',
    knownInteractions: ['Denatures proteins at high concentrations', 'Membrane disruption in microorganisms'],
    experimentalNotes: 'Demonstrates dose-dependent inhibition in prototype simulations.',
    references: ['Educational reference — see Safety section'],
  },
  {
    id: 'CMP-004',
    name: 'Ampicillin',
    formula: 'C₁₆H₁₉N₃O₄S',
    molecularMass: 349.4,
    massUnit: 'g/mol',
    category: 'Antibiotic',
    description:
      'A beta-lactam antibiotic that inhibits bacterial cell wall synthesis. Used in selective media.',
    knownInteractions: ['Inhibits transpeptidase in cell wall synthesis', 'Effective against many Gram-negative bacteria'],
    experimentalNotes: 'Demonstration antibiotic for inhibition modelling.',
    references: ['Demonstration data — not prescribing information'],
  },
  {
    id: 'CMP-005',
    name: 'Phosphate Buffer (PBS)',
    formula: 'Mixed salts',
    molecularMass: 0,
    massUnit: 'g/mol',
    category: 'Buffer',
    description:
      'A buffered saline solution maintaining pH around 7.4. Used for washing and suspending biological samples.',
    knownInteractions: ['Maintains isotonic conditions', 'pH buffering capacity'],
    experimentalNotes: 'Reference buffer for pH stability demonstrations.',
    references: ['Standard laboratory reagent'],
  },
];

export const defaultEnvironment = {
  temperature: 37,
  ph: 7.0,
  oxygen: 21,
  carbonDioxide: 5,
  humidity: 80,
  pressure: 101.3,
  salinity: 0,
  nutrientAvailability: 75,
  radiationExposure: 0,
  incubationTime: 0,
};

export const demoExperiments: Experiment[] = [
  {
    id: 'EXP-001',
    name: 'Temperature Effect on E. coli Growth',
    researchQuestion: 'How does temperature affect E. coli population growth in broth culture?',
    hypothesis: 'E. coli growth rate will peak near 37°C and decline significantly above 42°C.',
    sampleId: 'SMP-001',
    organismId: 'ORG-001',
    controlGroup: 'E. coli at 37°C, standard LB medium',
    experimentalGroup: 'E. coli at elevated temperature (42°C)',
    independentVariables: [
      { name: 'Temperature', role: 'independent', value: '37–42', unit: '°C' },
    ],
    dependentVariables: [
      { name: 'Population', role: 'dependent', value: 'measured each tick', unit: 'CFU/mL (simulated)' },
      { name: 'Viability', role: 'dependent', value: 'measured each tick', unit: '%' },
    ],
    controlledVariables: [
      { name: 'Medium', role: 'controlled', value: 'LB broth' },
      { name: 'pH', role: 'controlled', value: '7.0' },
      { name: 'Initial inoculum', role: 'controlled', value: '1×10⁶ CFU/mL' },
    ],
    compoundIds: [],
    environment: { ...defaultEnvironment },
    durationHours: 24,
    observations: [],
    notes: 'Demonstration experiment for prototype simulation.',
    status: 'active',
    createdAt: '2026-08-28T10:00:00Z',
    updatedAt: '2026-08-30T08:00:00Z',
  },
  {
    id: 'EXP-002',
    name: 'pH Stress in HeLa Cell Culture',
    researchQuestion: 'What effect does acidic pH have on mammalian cell viability?',
    hypothesis: 'Reducing pH below 6.5 will increase cellular stress and reduce viability.',
    sampleId: 'SMP-002',
    organismId: 'ORG-004',
    controlGroup: 'HeLa cells at pH 7.4',
    experimentalGroup: 'HeLa cells at pH 6.2',
    independentVariables: [
      { name: 'pH', role: 'independent', value: '6.2–7.4', unit: 'pH units' },
    ],
    dependentVariables: [
      { name: 'Viability', role: 'dependent', value: 'measured each tick', unit: '%' },
      { name: 'Stress index', role: 'dependent', value: 'simulated metric', unit: '0–100' },
    ],
    controlledVariables: [
      { name: 'Temperature', role: 'controlled', value: '37', unit: '°C' },
      { name: 'CO₂', role: 'controlled', value: '5', unit: '%' },
    ],
    compoundIds: [],
    environment: { ...defaultEnvironment, ph: 7.4, carbonDioxide: 5 },
    durationHours: 48,
    observations: [],
    notes: 'Educational simulation — not predictive of clinical outcomes.',
    status: 'draft',
    createdAt: '2026-08-29T14:00:00Z',
    updatedAt: '2026-08-29T14:00:00Z',
  },
];

export const demoNotebookEntries: NotebookEntry[] = [
  {
    id: 'NB-001',
    title: 'Initial E. coli culture observations',
    dateTime: '2026-08-28T10:30:00Z',
    experimentId: 'EXP-001',
    notes: 'Set up broth cultures at 37°C. Turbidity observed after 4 hours.',
    observations: 'Culture appeared homogeneous with no visible contamination.',
    hypothesis: 'Growth should follow exponential phase within first 6 hours.',
    conclusions: 'Pending — simulation in progress.',
    tags: ['e-coli', 'culture', 'temperature'],
    updatedAt: '2026-08-28T10:30:00Z',
  },
  {
    id: 'NB-002',
    title: 'Review of salinity effects on growth models',
    dateTime: '2026-08-27T09:00:00Z',
    notes: 'Reviewed prototype simulation rules for salinity. Current model uses linear stress increase above 20 ppt.',
    observations: 'Model behaviour is deterministic and educational only.',
    hypothesis: 'Higher salinity will reduce replication rate in freshwater-adapted strains.',
    conclusions: 'Prototype rules documented in simulation engine module.',
    tags: ['salinity', 'simulation', 'methodology'],
    updatedAt: '2026-08-27T09:00:00Z',
  },
  {
    id: 'NB-003',
    title: 'Safety review before starting cultures',
    dateTime: '2026-08-26T08:00:00Z',
    notes: 'Reviewed PPE requirements and sterile technique guidelines in Safety section.',
    observations: 'All demonstration work is virtual — no actual biological materials handled.',
    hypothesis: '',
    conclusions: 'Virtual lab protocols documented. Real lab work requires institutional training.',
    tags: ['safety', 'PPE', 'training'],
    updatedAt: '2026-08-26T08:00:00Z',
  },
];

export const demoSimulationResults: SimulationResult[] = [
  {
    id: 'RES-001',
    simulationId: 'SIM-DEMO',
    experimentId: 'EXP-001',
    summary:
      'Prototype simulation of E. coli growth at 37°C over 12 hours. Population increased from 1×10⁶ to approximately 8×10⁷ (simulated). Viability remained above 90%.',
    finalState: {
      population: 8.2e7,
      viability: 92,
      replicationRate: 0.35,
      stress: 8,
      mutationIndicator: 2,
      environmentalTolerance: 88,
    },
    timeline: [],
    events: [
      { tick: 0, timeHours: 0, message: 'Simulation started at 37°C, pH 7.0', type: 'info' },
      { tick: 48, timeHours: 12, message: 'Population entered simulated exponential phase', type: 'change' },
    ],
    controlComparison: {
      controlLabel: '37°C (control)',
      experimentalLabel: '42°C (experimental)',
      metrics: [
        { name: 'Final viability', control: 92, experimental: 54, unit: '%' },
        { name: 'Final population', control: 8.2e7, experimental: 2.1e6, unit: 'CFU/mL (simulated)' },
        { name: 'Stress index', control: 8, experimental: 67, unit: '0–100' },
      ],
    },
    metadata: {
      sourceType: 'simulation',
      label: 'SIMULATION / EDUCATIONAL MODEL',
      disclaimer: 'These results are from a prototype educational model and do not represent validated biological predictions.',
    },
    createdAt: '2026-08-30T12:00:00Z',
  },
];

export const molecularPlaceholders: MolecularModelPlaceholder[] = [
  {
    id: 'MOL-001',
    name: 'Atomic Structure Viewer',
    type: 'atom',
    status: 'placeholder',
    description: 'Future module for visualising atomic structure, electron shells, and elemental properties.',
    futureCapabilities: ['Element selection', 'Electron configuration display', 'Isotope information'],
  },
  {
    id: 'MOL-002',
    name: 'Molecular Bond Editor',
    type: 'bond',
    status: 'placeholder',
    description: 'Future module for building and visualising molecular structures and bond types.',
    futureCapabilities: ['Single/double/triple bonds', 'Bond angle display', 'SMILES import'],
  },
  {
    id: 'MOL-003',
    name: 'Protein Interaction Map',
    type: 'protein',
    status: 'placeholder',
    description: 'Future module for mapping protein-protein interactions, binding sites, and conformational changes.',
    futureCapabilities: ['Binding affinity display', 'Inhibition modelling', 'Domain architecture'],
  },
];

export const safetyTopics = [
  {
    id: 'ppe',
    title: 'Personal Protective Equipment (PPE)',
    content:
      'PPE includes lab coats, gloves, eye protection, and face shields as appropriate. Selection depends on the hazards present. In a real laboratory, PPE must be chosen based on risk assessment and institutional policy. Genesis Lab provides educational information only — it does not replace hands-on PPE training.',
  },
  {
    id: 'contamination',
    title: 'Contamination',
    content:
      'Contamination occurs when unwanted biological or chemical material enters a sample, culture, or workspace. Sources include airborne particles, unclean equipment, and cross-contamination from other samples. Sterile technique minimises this risk in real laboratories.',
  },
  {
    id: 'cross-contamination',
    title: 'Cross-Contamination',
    content:
      'Cross-contamination is the transfer of material from one sample or surface to another. Prevent it by using separate pipette tips, dedicated equipment, and proper workspace organisation. Never assume virtual lab practices substitute for real-world biosafety protocols.',
  },
  {
    id: 'sterile-technique',
    title: 'Sterile Technique',
    content:
      'Sterile technique involves procedures that prevent introduction of microorganisms into cultures or sterile materials. Key practices include flaming bottle necks, working near Bunsen burners (where appropriate), and minimising open-container time. Mastery requires supervised practice.',
  },
  {
    id: 'decontamination',
    title: 'Decontamination',
    content:
      'Decontamination removes or inactivates biological agents from surfaces and equipment. Methods include autoclaving, chemical disinfectants (e.g., bleach, ethanol), and UV exposure. Effectiveness depends on the agent, concentration, contact time, and material compatibility.',
  },
  {
    id: 'waste',
    title: 'Waste Categories',
    content:
      'Laboratory waste is classified by hazard type: general, chemical, biological (including sharps), and radioactive. Each category requires specific disposal containers and procedures defined by institutional policy and local regulations. Never dispose of laboratory waste in general rubbish.',
  },
  {
    id: 'biosafety',
    title: 'Biological Safety Principles',
    content:
      'Biological safety is governed by risk assessment, containment level (BSL-1 through BSL-4), and approved protocols. Work with pathogens requires appropriate facilities, training, and authorisation. Genesis Lab simulations do not involve actual biological materials.',
  },
  {
    id: 'chemsafety',
    title: 'Chemical Safety Principles',
    content:
      'Chemical safety includes reading Safety Data Sheets (SDS), using fume hoods for volatile substances, proper labelling, and knowing emergency procedures. Never mix chemicals without understanding potential reactions. This application does not provide manufacturing or synthesis instructions.',
  },
  {
    id: 'emergency',
    title: 'Emergency Awareness',
    content:
      'Know the location of eyewash stations, safety showers, fire extinguishers, and spill kits in your laboratory. Report incidents immediately. For real emergencies, follow institutional emergency procedures and contact emergency services. Genesis Lab cannot provide emergency response.',
  },
];
