import type { EquipmentDefinition, TeachingScenario } from '../types/scientific';

export const EQUIPMENT: EquipmentDefinition[] = [
  {
    id: 'EQ-MICRO',
    name: 'Microscope',
    category: 'Imaging',
    description: {
      simple: 'Magnifies tiny objects so you can see cells and bacteria.',
      standard: 'Optical instrument for magnified observation of specimens.',
      technical: 'Compound light microscope with objective lens system (simulated).',
    },
    measures: ['Magnification', 'Contrast', 'Field of view'],
    /** Opens dedicated Virtual Microscope — not an in-card instrument simulator. */
    status: 'interactive',
  },
  {
    id: 'EQ-CENT',
    name: 'Centrifuge',
    category: 'Separation',
    description: {
      simple: 'Spins samples very fast to separate heavier and lighter parts.',
      standard: 'Separates components by density via centrifugal force.',
      technical: 'RCF-dependent pelleting of particulates (conceptual model).',
    },
    measures: ['RPM', 'RCF', 'Separation efficiency'],
    status: 'conceptual',
  },
  {
    id: 'EQ-SPEC',
    name: 'Spectrophotometer',
    category: 'Measurement',
    description: {
      simple: 'Measures how much light a sample absorbs — used to estimate concentration.',
      standard: 'Quantifies absorbance at specified wavelength.',
      technical: 'Beer-Lambert law-based absorbance (A = εcl) for concentration estimation.',
    },
    measures: ['Absorbance (AU)', 'Wavelength (nm)', 'Concentration (estimated)'],
    status: 'conceptual',
  },
  {
    id: 'EQ-PCR',
    name: 'PCR / qPCR Viewer',
    category: 'Amplification',
    description: {
      simple: 'Shows how DNA can be copied in cycles for detection (conceptual).',
      standard: 'Conceptual polymerase chain reaction amplification curve viewer.',
      technical: 'Exponential amplification model with Ct estimation (educational).',
    },
    measures: ['Cycle number', 'Fluorescence (relative)', 'Ct (conceptual)'],
    status: 'conceptual',
  },
  {
    id: 'EQ-GEL',
    name: 'Electrophoresis Viewer',
    category: 'Separation',
    description: {
      simple: 'Separates DNA or protein pieces by size using an electric field (conceptual).',
      standard: 'Gel-based size separation visualisation.',
      technical: 'Migration distance vs molecular weight (log-linear approximation).',
    },
    measures: ['Band position', 'Relative size', 'Lane intensity'],
    status: 'conceptual',
  },
  {
    id: 'EQ-INC',
    name: 'Incubator / Environment Chamber',
    category: 'Environment',
    description: {
      simple: 'Keeps cultures at the right temperature, humidity, and gas levels.',
      standard: 'Controlled atmosphere chamber for cultivation.',
      technical: 'Closed-loop T/RH/CO₂ control (linked to Virtual Lab environment).',
    },
    measures: ['Temperature', 'Humidity', 'CO₂', 'Time'],
    /** Opens dedicated Virtual Lab environment controls — not an in-card incubator. */
    status: 'interactive',
  },
  {
    id: 'EQ-PLATE',
    name: 'Plate Reader',
    category: 'Measurement',
    description: {
      simple: 'Reads many small wells at once — useful for growth or colour assays.',
      standard: 'Multi-well absorbance/fluorescence reader (conceptual).',
      technical: 'Microplate photometric endpoint acquisition (simulated).',
    },
    measures: ['Well absorbance', 'Fluorescence', 'Time series'],
    status: 'conceptual',
  },
  {
    id: 'EQ-BAL',
    name: 'Balance',
    category: 'Measurement',
    description: {
      simple: 'Weighs samples accurately for preparing solutions.',
      standard: 'Analytical balance for mass measurement.',
      technical: 'Calibrated gravimetric measurement with readability limits.',
    },
    measures: ['Mass (g)', 'Tare', 'Uncertainty'],
    status: 'conceptual',
  },
  {
    id: 'EQ-PIP',
    name: 'Pipetting Helper',
    category: 'Calculation',
    description: {
      simple: 'Helps calculate volumes when diluting or mixing liquids.',
      standard: 'C1V1=C2V2 dilution calculator.',
      technical: 'Molarity and dilution computation assistant.',
    },
    measures: ['Volume', 'Concentration', 'Dilution factor'],
    status: 'interactive',
  },
];

export const TEACHING_SCENARIOS: TeachingScenario[] = [
  {
    id: 'TEACH-001',
    title: 'Missing Control Group',
    description: {
      simple: 'Your experiment has a treatment but nothing to compare it against. What is wrong?',
      standard: 'An experiment lacks a proper control condition for comparison.',
      technical: 'Absence of baseline control invalidates causal attribution.',
    },
    problemType: 'incorrect-control',
    options: [
      {
        id: 'a',
        label: 'No control group was included',
        correct: true,
        explanation: {
          simple: 'Correct! You need a control group that does not get the treatment so you can compare.',
          standard: 'A control group is essential to isolate the effect of the independent variable.',
          technical: 'Without a control arm, confounding variables cannot be excluded.',
        },
      },
      {
        id: 'b',
        label: 'The sample colour is wrong',
        correct: false,
        explanation: {
          simple: 'Colour alone does not explain the missing comparison group issue.',
          standard: 'Sample appearance is not the primary experimental design flaw here.',
          technical: 'Visual artefact is unrelated to control group omission.',
        },
      },
      {
        id: 'c',
        label: 'The incubator is too small',
        correct: false,
        explanation: {
          simple: 'Incubator size is not the main problem in this scenario.',
          standard: 'Equipment capacity is not the identified design flaw.',
          technical: 'Hardware constraint is a distractor; design flaw is control absence.',
        },
      },
    ],
  },
  {
    id: 'TEACH-002',
    title: 'Degraded Sample Flag',
    description: {
      simple: 'Viability dropped before you started the treatment. What might have happened?',
      standard: 'Pre-treatment viability loss suggests sample degradation.',
      technical: 'Baseline viability below threshold indicates pre-analytical degradation.',
    },
    problemType: 'degraded-sample',
    options: [
      {
        id: 'a',
        label: 'Sample may have degraded before the experiment',
        correct: true,
        explanation: {
          simple: 'Yes — old or poorly stored samples often lose viability before you even begin.',
          standard: 'Storage time and conditions likely compromised sample integrity.',
          technical: 'Pre-treatment viability collapse suggests storage or handling degradation.',
        },
      },
      {
        id: 'b',
        label: 'The hypothesis was proven',
        correct: false,
        explanation: {
          simple: 'A hypothesis is never "proven" — and degraded samples do not support that conclusion.',
          standard: 'Degradation artefacts cannot validate a hypothesis.',
          technical: 'Confounding from sample quality invalidates inference.',
        },
      },
      {
        id: 'c',
        label: 'Radiation always improves growth',
        correct: false,
        explanation: {
          simple: 'Radiation usually harms cells, not helps them grow.',
          standard: 'Radiation exposure typically increases stress in models.',
          technical: 'Ionising radiation is a damaging agent in prototype models.',
        },
      },
    ],
  },
];
