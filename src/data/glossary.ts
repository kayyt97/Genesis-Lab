import type { GlossaryEntry } from '../types';

export const glossaryEntries: GlossaryEntry[] = [
  {
    id: 'ph',
    term: 'pH',
    plainEnglish: 'A measure of how acidic or alkaline (basic) a solution is, on a scale from 0 to 14.',
    scientificDefinition:
      'The negative logarithm (base 10) of hydrogen ion activity in a solution. pH 7 is neutral; lower values are acidic, higher values are alkaline.',
    unit: 'pH units (dimensionless scale 0–14)',
    example: 'Pure water at 25°C has a pH of approximately 7.0.',
    appearsIn: ['Virtual Lab', 'Experiment Builder', 'Environment controls'],
    relatedTerms: ['concentration', 'compound', 'medium'],
  },
  {
    id: 'molarity',
    term: 'Molarity',
    plainEnglish: 'How many moles of a substance are dissolved in one litre of solution.',
    scientificDefinition:
      'Molar concentration (M) expressed as moles of solute per litre of solution (mol/L).',
    unit: 'mol/L (M)',
    example: 'A 0.1 M NaCl solution contains 0.1 moles of NaCl per litre.',
    appearsIn: ['Molecular Library', 'Experiment Builder'],
    relatedTerms: ['concentration', 'compound', 'dose'],
  },
  {
    id: 'concentration',
    term: 'Concentration',
    plainEnglish: 'The amount of a substance present in a given volume or mass of mixture.',
    scientificDefinition:
      'Quantity of solute per unit volume or mass of solution or mixture. Common units include mol/L, g/L, and mg/mL.',
    unit: 'Varies (mol/L, g/L, mg/mL, etc.)',
    example: 'A bacterial culture may be diluted to reduce cell concentration before counting.',
    appearsIn: ['Virtual Lab', 'Molecular Library', 'Experiment Builder'],
    relatedTerms: ['molarity', 'dose', 'compound'],
  },
  {
    id: 'temperature',
    term: 'Temperature',
    plainEnglish: 'How hot or cold something is — a measure of thermal energy.',
    scientificDefinition:
      'A measure of the average kinetic energy of particles in a system. In laboratory work, typically measured in degrees Celsius (°C) or Kelvin (K).',
    unit: '°C or K',
    example: 'Many bacterial cultures are incubated at 37°C to mimic body temperature.',
    appearsIn: ['Virtual Lab', 'Samples', 'Organisms'],
    relatedTerms: ['incubation', 'environment'],
  },
  {
    id: 'pressure',
    term: 'Pressure',
    plainEnglish: 'The force applied over a surface area — how much something is being pushed on.',
    scientificDefinition:
      'Force per unit area. In laboratory contexts, atmospheric or gauge pressure may affect gas solubility and cell behaviour.',
    unit: 'kPa, atm, or mmHg',
    example: 'Anaerobic cultures may be maintained under reduced atmospheric pressure or in sealed vessels.',
    appearsIn: ['Virtual Lab', 'Environment controls'],
    relatedTerms: ['oxygen', 'incubation'],
  },
  {
    id: 'salinity',
    term: 'Salinity',
    plainEnglish: 'The amount of dissolved salt in water.',
    scientificDefinition:
      'Concentration of dissolved salts in aqueous solution, often expressed as parts per thousand (ppt) or practical salinity units (PSU).',
    unit: 'ppt or PSU',
    example: 'Marine bacterial samples have high salinity compared to freshwater environments.',
    appearsIn: ['Virtual Lab', 'Samples'],
    relatedTerms: ['concentration', 'medium'],
  },
  {
    id: 'incubation',
    term: 'Incubation',
    plainEnglish: 'Keeping samples at controlled conditions (usually warm) so organisms can grow or reactions can proceed.',
    scientificDefinition:
      'Maintenance of biological or chemical samples under defined environmental conditions for a specified period to allow growth, reaction, or observation.',
    unit: 'Time (hours, days)',
    example: 'A petri dish may be incubated at 37°C for 24 hours to allow bacterial colonies to form.',
    appearsIn: ['Virtual Lab', 'Experiment Builder', 'Dashboard'],
    relatedTerms: ['temperature', 'culture', 'medium'],
  },
  {
    id: 'culture',
    term: 'Culture',
    plainEnglish: 'A population of cells or microorganisms grown under controlled conditions in the lab.',
    scientificDefinition:
      'A maintained population of cells or microorganisms propagated in or on a defined medium under controlled environmental conditions.',
    example: 'A bacterial culture in broth medium can be subcultured to maintain the strain.',
    appearsIn: ['Samples', 'Virtual Lab', 'Organisms'],
    relatedTerms: ['medium', 'incubation', 'viability'],
  },
  {
    id: 'medium',
    term: 'Medium',
    plainEnglish: 'The nutrient mixture used to grow cells or microorganisms in the lab.',
    scientificDefinition:
      'A prepared mixture of nutrients, salts, and sometimes growth factors that supports the cultivation of cells or microorganisms.',
    example: 'LB broth is a common medium for growing E. coli bacteria.',
    appearsIn: ['Samples', 'Organisms', 'Virtual Lab'],
    relatedTerms: ['culture', 'nutrient', 'compound'],
  },
  {
    id: 'control',
    term: 'Control',
    plainEnglish: 'A comparison group in an experiment that is not changed, so you can see what the treatment actually did.',
    scientificDefinition:
      'An experimental group maintained under baseline or standard conditions against which treated or manipulated groups are compared.',
    example: 'In a drug test, the control group receives no drug while the experimental group does.',
    appearsIn: ['Experiment Builder', 'Results'],
    relatedTerms: ['variable', 'hypothesis', 'result'],
  },
  {
    id: 'variable',
    term: 'Variable',
    plainEnglish: 'Any factor in an experiment that can change or be changed.',
    scientificDefinition:
      'Any factor, property, or condition that can vary and be measured or manipulated in an experimental system.',
    example: 'Temperature, pH, and drug concentration are all variables that can affect cell growth.',
    appearsIn: ['Experiment Builder', 'Virtual Lab', 'Results'],
    relatedTerms: ['independent variable', 'dependent variable', 'control'],
  },
  {
    id: 'independent-variable',
    term: 'Independent Variable',
    plainEnglish: 'The factor you deliberately change in an experiment to see what happens.',
    scientificDefinition:
      'The variable that is intentionally manipulated by the experimenter. Also called the manipulated variable.',
    example: 'If you test how pH affects bacterial growth, pH is the independent variable.',
    appearsIn: ['Experiment Builder'],
    relatedTerms: ['dependent variable', 'variable', 'control'],
  },
  {
    id: 'dependent-variable',
    term: 'Dependent Variable',
    plainEnglish: 'What you measure in an experiment — the outcome that may change because of what you did.',
    scientificDefinition:
      'The variable that is measured or observed in response to manipulation of the independent variable. Also called the response variable.',
    example: 'Bacterial population count after 24 hours could be a dependent variable.',
    appearsIn: ['Experiment Builder', 'Results'],
    relatedTerms: ['independent variable', 'variable', 'observation'],
  },
  {
    id: 'replication',
    term: 'Replication',
    plainEnglish: 'When organisms make copies of themselves — cells dividing or viruses multiplying.',
    scientificDefinition:
      'The process by which biological entities reproduce or multiply. In experiments, replication also refers to repeating trials for reliability.',
    example: 'Bacteria replicate by binary fission, doubling their population under ideal conditions.',
    appearsIn: ['Virtual Lab', 'Simulation', 'Organisms'],
    relatedTerms: ['viability', 'culture', 'mutation'],
  },
  {
    id: 'mutation',
    term: 'Mutation',
    plainEnglish: 'A change in the genetic code (DNA or RNA) of an organism.',
    scientificDefinition:
      'A permanent alteration in the nucleotide sequence of an organism\'s genome. May arise spontaneously or from environmental stressors.',
    example: 'Exposure to UV radiation can cause mutations in bacterial DNA.',
    appearsIn: ['Virtual Lab', 'Simulation', 'Organisms'],
    relatedTerms: ['DNA', 'RNA', 'viability'],
  },
  {
    id: 'viability',
    term: 'Viability',
    plainEnglish: 'Whether cells or organisms are alive and able to function or reproduce.',
    scientificDefinition:
      'The proportion or state of living, functional cells or organisms capable of metabolism and/or reproduction under given conditions.',
    unit: '% (percentage of viable units)',
    example: 'A viability assay determines what fraction of cells in a culture are still alive.',
    appearsIn: ['Virtual Lab', 'Simulation', 'Results'],
    relatedTerms: ['replication', 'culture', 'stress'],
  },
  {
    id: 'pathogen',
    term: 'Pathogen',
    plainEnglish: 'A microorganism or agent that can cause disease.',
    scientificDefinition:
      'An infectious agent — such as a bacterium, virus, fungus, or prion — capable of causing disease in a susceptible host.',
    example: 'Escherichia coli O157:H7 is a pathogenic strain that can cause severe illness.',
    appearsIn: ['Organisms', 'Safety', 'Glossary'],
    relatedTerms: ['bacteria', 'virus', 'fungus'],
  },
  {
    id: 'bacteria',
    term: 'Bacteria',
    plainEnglish: 'Single-celled microorganisms found almost everywhere on Earth.',
    scientificDefinition:
      'Prokaryotic, single-celled microorganisms belonging to the domain Bacteria. Lack a membrane-bound nucleus.',
    example: 'E. coli is a commonly studied bacterium used in molecular biology research.',
    appearsIn: ['Organisms', 'Virtual Lab', 'Samples'],
    relatedTerms: ['culture', 'pathogen', 'virus'],
  },
  {
    id: 'virus',
    term: 'Virus',
    plainEnglish: 'Tiny infectious agents that need to enter a host cell to reproduce.',
    scientificDefinition:
      'Non-cellular infectious agents composed of nucleic acid (DNA or RNA) enclosed in a protein capsid. Obligate intracellular parasites.',
    example: 'Bacteriophages are viruses that infect bacteria.',
    appearsIn: ['Organisms', 'Virtual Lab'],
    relatedTerms: ['bacteria', 'pathogen', 'DNA', 'RNA'],
  },
  {
    id: 'fungus',
    term: 'Fungus',
    plainEnglish: 'Organisms like yeasts and moulds — neither plants nor animals.',
    scientificDefinition:
      'Eukaryotic organisms belonging to the kingdom Fungi, including yeasts, moulds, and mushrooms. Many are decomposers or pathogens.',
    example: 'Saccharomyces cerevisiae (baker\'s yeast) is a model fungus used in research.',
    appearsIn: ['Organisms', 'Samples'],
    relatedTerms: ['culture', 'pathogen', 'cell'],
  },
  {
    id: 'cell',
    term: 'Cell',
    plainEnglish: 'The basic building block of all living things.',
    scientificDefinition:
      'The smallest structural and functional unit of life. May be prokaryotic (no nucleus) or eukaryotic (membrane-bound nucleus).',
    example: 'HeLa cells are human cervical cancer cells widely used in research.',
    appearsIn: ['Organisms', 'Virtual Lab', 'Samples'],
    relatedTerms: ['culture', 'protein', 'DNA'],
  },
  {
    id: 'protein',
    term: 'Protein',
    plainEnglish: 'Large molecules made of amino acids that do most of the work in cells.',
    scientificDefinition:
      'Macromolecules composed of amino acid chains folded into specific three-dimensional structures. Perform structural, enzymatic, and regulatory functions.',
    example: 'Enzymes are proteins that speed up chemical reactions in cells.',
    appearsIn: ['Organisms', 'Molecular Library', 'Molecular Modelling (future)'],
    relatedTerms: ['molecule', 'activation', 'inhibition'],
  },
  {
    id: 'dna',
    term: 'DNA',
    plainEnglish: 'The molecule that carries genetic instructions in almost all living things.',
    scientificDefinition:
      'Deoxyribonucleic acid — a double-stranded nucleic acid polymer encoding genetic information using four bases: adenine, thymine, cytosine, and guanine.',
    example: 'DNA sequencing reveals the order of bases in a gene.',
    appearsIn: ['Organisms', 'Samples', 'Molecular Library'],
    relatedTerms: ['RNA', 'mutation', 'cell'],
  },
  {
    id: 'rna',
    term: 'RNA',
    plainEnglish: 'A molecule similar to DNA that helps carry out genetic instructions.',
    scientificDefinition:
      'Ribonucleic acid — a single-stranded nucleic acid involved in protein synthesis, gene regulation, and as genetic material in some viruses.',
    example: 'Messenger RNA (mRNA) carries instructions from DNA to ribosomes for protein production.',
    appearsIn: ['Organisms', 'Samples'],
    relatedTerms: ['DNA', 'protein', 'virus'],
  },
  {
    id: 'prion',
    term: 'Prion',
    plainEnglish: 'An infectious protein that can cause other proteins to misfold.',
    scientificDefinition:
      'Misfolded proteins capable of transmitting their misfolded shape onto normal variants of the same protein. Associated with transmissible spongiform encephalopathies.',
    example: 'Prion diseases include Creutzfeldt-Jakob disease in humans.',
    appearsIn: ['Organisms', 'Safety'],
    relatedTerms: ['protein', 'pathogen'],
  },
  {
    id: 'compound',
    term: 'Compound',
    plainEnglish: 'A substance made of two or more different elements chemically bonded together.',
    scientificDefinition:
      'A pure chemical substance composed of two or more elements combined in fixed proportions with distinct chemical properties.',
    example: 'Water (H₂O) is a compound of hydrogen and oxygen.',
    appearsIn: ['Molecular Library', 'Virtual Lab', 'Experiment Builder'],
    relatedTerms: ['molecule', 'concentration', 'dose'],
  },
  {
    id: 'molecule',
    term: 'Molecule',
    plainEnglish: 'A group of atoms bonded together — the smallest unit of a chemical compound.',
    scientificDefinition:
      'An electrically neutral group of two or more atoms held together by chemical bonds. May be an element (O₂) or compound (H₂O).',
    example: 'A glucose molecule contains six carbon, twelve hydrogen, and six oxygen atoms.',
    appearsIn: ['Molecular Library', 'Molecular Modelling (future)'],
    relatedTerms: ['atom', 'compound', 'protein'],
  },
  {
    id: 'atom',
    term: 'Atom',
    plainEnglish: 'The smallest unit of an element — the basic building block of matter.',
    scientificDefinition:
      'The smallest unit of a chemical element retaining the properties of that element, composed of protons, neutrons, and electrons.',
    example: 'A carbon atom has 6 protons and typically 6 neutrons.',
    appearsIn: ['Molecular Modelling (future)', 'Glossary'],
    relatedTerms: ['molecule', 'compound'],
  },
  {
    id: 'inhibition',
    term: 'Inhibition',
    plainEnglish: 'When something slows down or stops a biological process or reaction.',
    scientificDefinition:
      'Reduction or prevention of a biological activity, enzyme function, or molecular interaction by an inhibitory agent or condition.',
    example: 'An antibiotic may inhibit bacterial cell wall synthesis.',
    appearsIn: ['Molecular Library', 'Virtual Lab', 'Molecular Modelling (future)'],
    relatedTerms: ['activation', 'compound', 'dose'],
  },
  {
    id: 'activation',
    term: 'Activation',
    plainEnglish: 'When something starts or speeds up a biological process or reaction.',
    scientificDefinition:
      'Initiation or enhancement of a biological activity, enzyme function, or signalling pathway by an activating agent or condition.',
    example: 'A transcription factor activates gene expression when it binds to DNA.',
    appearsIn: ['Molecular Library', 'Molecular Modelling (future)'],
    relatedTerms: ['inhibition', 'protein', 'compound'],
  },
  {
    id: 'dose',
    term: 'Dose',
    plainEnglish: 'The amount of a substance given or applied in an experiment or treatment.',
    scientificDefinition:
      'The quantity of an agent administered or applied, typically expressed as mass per unit body mass (mg/kg) or concentration over time.',
    unit: 'mg, μg, mol/L, etc.',
    example: 'A dose-response experiment tests multiple concentrations of a compound.',
    appearsIn: ['Experiment Builder', 'Molecular Library', 'Virtual Lab'],
    relatedTerms: ['concentration', 'exposure', 'compound'],
  },
  {
    id: 'exposure',
    term: 'Exposure',
    plainEnglish: 'Contact with a substance, condition, or agent — such as a chemical or radiation.',
    scientificDefinition:
      'The condition of being subjected to an external agent, environmental factor, or treatment for a defined duration and intensity.',
    example: 'UV radiation exposure can damage DNA in exposed cells.',
    appearsIn: ['Virtual Lab', 'Safety', 'Experiment Builder'],
    relatedTerms: ['dose', 'radiation', 'compound'],
  },
  {
    id: 'hypothesis',
    term: 'Hypothesis',
    plainEnglish: 'An educated guess or prediction about what you think will happen in an experiment.',
    scientificDefinition:
      'A testable, falsifiable statement predicting the expected relationship between variables based on prior knowledge or observation.',
    example: '"Increasing temperature above 42°C will reduce E. coli viability" is a hypothesis.',
    appearsIn: ['Experiment Builder', 'Research Notebook', 'Dashboard'],
    relatedTerms: ['observation', 'result', 'control'],
  },
  {
    id: 'observation',
    term: 'Observation',
    plainEnglish: 'Something you notice or record during an experiment using your senses or instruments.',
    scientificDefinition:
      'A recorded measurement, event, or qualitative note obtained during an experiment without necessarily implying causation.',
    example: 'Observing that colony size decreased after pH was lowered to 5.0.',
    appearsIn: ['Virtual Lab', 'Research Notebook', 'Results'],
    relatedTerms: ['hypothesis', 'result', 'variable'],
  },
  {
    id: 'result',
    term: 'Result',
    plainEnglish: 'The outcome or data produced by an experiment or simulation.',
    scientificDefinition:
      'Collected data, measurements, or derived outcomes from an experimental procedure. Must be distinguished from interpretation.',
    example: 'A result might show that viability dropped from 95% to 60% after treatment.',
    appearsIn: ['Results', 'Dashboard', 'Research Notebook'],
    relatedTerms: ['observation', 'hypothesis', 'simulation'],
  },
];

export function findGlossaryEntry(term: string): GlossaryEntry | undefined {
  const normalized = term.toLowerCase().trim();
  return glossaryEntries.find(
    (e) =>
      e.term.toLowerCase() === normalized ||
      e.id === normalized ||
      e.term.toLowerCase().replace(/\s+/g, '-') === normalized,
  );
}

export function searchGlossary(query: string): GlossaryEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return glossaryEntries;
  return glossaryEntries.filter(
    (e) =>
      e.term.toLowerCase().includes(q) ||
      e.plainEnglish.toLowerCase().includes(q) ||
      e.scientificDefinition.toLowerCase().includes(q) ||
      e.relatedTerms.some((t) => t.toLowerCase().includes(q)),
  );
}
