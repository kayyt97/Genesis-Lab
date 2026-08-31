import type { TieredText } from '../types/language';

export const PARAM_HELP: Record<string, TieredText> = {
  temperature: {
    simple: 'Temperature — how warm the sample is. Many cells grow best near body temperature (about 37°C). Too hot or too cold can slow growth or kill cells.',
    standard: 'Temperature affects molecular motion and enzyme activity. Optimal range depends on the organism.',
    technical: 'Thermal energy influences reaction kinetics and protein stability. Mesophilic models assume optima near 30–37°C.',
  },
  ph: {
    simple: 'pH — how acidic or basic the environment is (0–14). Neutral is 7. Extreme pH can damage cells.',
    standard: 'pH affects ionisation of biomolecules and membrane integrity.',
    technical: 'Hydrogen ion activity modulates enzyme active sites and transporter function.',
  },
  oxygen: {
    simple: 'Oxygen level (%). Some organisms need oxygen; others grow without it.',
    standard: 'Oxygen availability influences aerobic respiration and redox balance.',
    technical: 'Partial pressure of O₂ affects electron transport chain flux in aerobic models.',
  },
  carbonDioxide: {
    simple: 'CO₂ level (%). Mammalian cell cultures often use about 5% CO₂ to maintain pH in media.',
    standard: 'CO₂ helps buffer pH in bicarbonate-based media.',
    technical: 'Dissolved CO₂/bicarbonate equilibrium maintains physiological pH in cell culture models.',
  },
  humidity: {
    simple: 'Humidity — moisture in the air (%). Important for preventing evaporation in open cultures.',
    standard: 'Relative humidity reduces evaporation from culture vessels.',
    technical: 'Water vapour partial pressure affects osmotic drift in uncovered cultures.',
  },
  pressure: {
    simple: 'Atmospheric pressure (kPa). Standard air pressure is about 101 kPa.',
    standard: 'Pressure can influence gas solubility in culture media.',
    technical: 'Barometric pressure modulates dissolved gas concentrations per Henry\'s law (simplified).',
  },
  salinity: {
    simple: 'Salinity — dissolved salt (ppt). Freshwater and marine organisms differ in tolerance.',
    standard: 'Osmolarity and ionic strength affect cell volume regulation.',
    technical: 'Salt concentration shifts osmotic balance; halotolerance encoded in prototype stress function.',
  },
  nutrientAvailability: {
    simple: 'Nutrients (% available). Cells need food sources like sugars and amino acids to grow.',
    standard: 'Nutrient availability limits growth rate in resource-limited models.',
    technical: 'Monod-type simplification: growth scales with nutrientAvailability/100.',
  },
  radiationExposure: {
    simple: 'Radiation exposure (teaching scale). High radiation can damage DNA and reduce viability.',
    standard: 'Ionising radiation increases mutation indicator and stress in the prototype model.',
    technical: 'Radiation term adds stress and mutationIndicator increments per tick (educational proxy).',
  },
};

export const TIMELINE_MARKS = [0, 6, 12, 24, 48, 72, 168];
