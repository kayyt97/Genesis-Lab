import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { ExplainThis, ExplainLabel } from '../components/ui/ExplainThis';
import { AboutThisTool } from '../components/ui/AboutThisTool';
import { EXPLAIN } from '../content/explainers';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState, generateId, sendToVirtualLab } from '../store/AppContext';
import { searchPathwayExplorer } from '../services/pathwaySearch';
import { organismIndex } from '../catalogue/index';
import {
  THERAPEUTIC_INTENDED_OUTCOME_LABELS,
  type TherapeuticDesign,
  type TherapeuticTargetType,
  type DeliveryModelType,
  type PayloadEffectType,
  type TherapeuticIntendedOutcome,
} from '../types/scientific';

const SAFETY_NOTICE =
  'This module supports conceptual therapeutic modelling only. It does not output viable pathogen sequences, replication-competent designs, or wet-lab construction protocols.';

const PARAM_EXPLAIN: Record<string, { whatIsIt: string; whyItMatters: string; howUsed: string; whatItDoesNotMean: string }> = {
  targetingPreference: {
    whatIsIt: 'How strongly the conceptual design prefers the intended target over other molecules.',
    whyItMatters: 'Higher targeting preference models a more selective therapy idea.',
    howUsed: 'Increase it when exploring a selective-design concept; decrease it to discuss off-target risk.',
    whatItDoesNotMean: 'This slider is not a measured binding affinity from a real assay.',
  },
  uptake: {
    whatIsIt: 'How readily the conceptual delivery system is imagined to enter target cells.',
    whyItMatters: 'Poor uptake can limit effect even if the payload is good on paper.',
    howUsed: 'Raise uptake when discussing efficient delivery; lower it when discussing delivery barriers.',
    whatItDoesNotMean: 'Not a measured transfection or infection efficiency.',
  },
  therapeuticEffect: {
    whatIsIt: 'Conceptual strength of the desired biological effect.',
    whyItMatters: 'Helps you think about benefit vs other trade-offs on this page.',
    howUsed: 'Adjust to explore strong vs modest effect scenarios in discussion.',
    whatItDoesNotMean: 'Not clinical efficacy in humans.',
  },
  immuneResponse: {
    whatIsIt: 'How strongly the body might notice or react to the delivery concept.',
    whyItMatters: 'Immune recognition can clear a therapy or cause side effects.',
    howUsed: 'Higher values emphasise immune visibility as a design trade-off.',
    whatItDoesNotMean: 'Not a prediction of cytokine release or allergy risk.',
  },
  clearance: {
    whatIsIt: 'How quickly the conceptual therapy is removed from the system.',
    whyItMatters: 'Clearance affects how long an effect might last in a model.',
    howUsed: 'High clearance = short-lived concept; low clearance = longer presence in the teaching model.',
    whatItDoesNotMean: 'Not a pharmacokinetic half-life from patient data.',
  },
  offTargetEffect: {
    whatIsIt: 'Chance the design affects molecules or cells it was not aimed at.',
    whyItMatters: 'Off-target effects are a major safety consideration in real research.',
    howUsed: 'Increase to explore safety discussion; decrease for an idealised selective scenario.',
    whatItDoesNotMean: 'Not a genome-wide off-target map.',
  },
  resistance: {
    whatIsIt: 'How easily a biological system might adapt around the therapy idea.',
    whyItMatters: 'Resistance thinking matters for long-term strategy discussions.',
    howUsed: 'Use higher values when discussing escape or adaptation scenarios.',
    whatItDoesNotMean: 'Not a measured mutation or escape frequency.',
  },
  toxicityProxy: {
    whatIsIt: 'A teaching proxy for unwanted harm from the conceptual design.',
    whyItMatters: 'Forces attention on safety trade-offs alongside desired effect.',
    howUsed: 'Raise it when exploring safety-limiting scenarios.',
    whatItDoesNotMean: 'Not a toxicology study or LD50.',
  },
};

type GuidedStart = 'gene' | 'protein' | 'receptor' | 'disease-process' | 'biological-process' | 'desired-effect';

const GUIDED_OPTIONS: { id: GuidedStart; label: string; explanation: { simple: string; standard: string; technical: string } }[] = [
  {
    id: 'gene',
    label: 'Gene',
    explanation: {
      simple: 'Genes carry instructions for making proteins. Targeting a gene conceptually means trying to change how much protein is made or how it works.',
      standard: 'Gene-level targets involve expression modulation or functional restoration/suppression.',
      technical: 'Therapeutic gene targets may involve knockdown, splice correction, or expression restoration depending on disease mechanism.',
    },
  },
  {
    id: 'protein',
    label: 'Protein',
    explanation: {
      simple: 'Proteins do most of the work in cells. A therapy might aim to block, replace, or enhance a specific protein.',
      standard: 'Protein targets include enzymes, structural proteins, and signalling molecules.',
      technical: 'Direct protein modulation via inhibitors, chaperones, or replacement biologics.',
    },
  },
  {
    id: 'receptor',
    label: 'Receptor',
    explanation: {
      simple: 'Receptors are like antennae on cells that receive signals. Blocking or activating them can change cell behaviour.',
      standard: 'Cell-surface or nuclear receptors mediate signalling cascades.',
      technical: 'GPCR, RTK, or nuclear receptor targeting with agonist/antagonist strategies.',
    },
  },
  {
    id: 'disease-process',
    label: 'Disease process',
    explanation: {
      simple: 'Some diseases involve inflammation, uncontrolled growth, or cell death. Therapies may aim to slow or redirect these processes.',
      standard: 'Disease-process targeting addresses pathological mechanisms rather than single molecules.',
      technical: 'Process-level intervention may involve multiple pathway nodes; evidence varies by indication.',
    },
  },
  {
    id: 'biological-process',
    label: 'Biological process',
    explanation: {
      simple: 'Biological processes include things like cell division, DNA repair, or energy production.',
      standard: 'Process-oriented targets map to pathway categories such as DNA repair or cell cycle.',
      technical: 'Functional pathway annotation guides target selection; incomplete evidence limits precision.',
    },
  },
  {
    id: 'desired-effect',
    label: 'Desired biological effect',
    explanation: {
      simple: 'Start with what you want to happen — for example, reduce inflammation or help cells survive.',
      standard: 'Effect-first design works backward from phenotypic goals to candidate targets.',
      technical: 'Reverse pharmacology / target deconvolution approach; high uncertainty without validation data.',
    },
  },
];

const OUTCOME_OPTIONS: TherapeuticIntendedOutcome[] = [
  'reduce-movement',
  'growth-suppression',
  'cell-killing',
];

export function TherapeuticDesignPage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const languageLevel = useLanguage();
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedStart, setGuidedStart] = useState<GuidedStart | null>(null);
  const [guidedQuery, setGuidedQuery] = useState('');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<TherapeuticDesign>>({
    name: 'Conceptual therapeutic design',
    targetType: 'tumour-cell',
    targetDescription: '',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: 'suppress-target',
    intendedOutcome: 'growth-suppression',
    targetCellModelId: 'ORG-HELA',
    variables: {
      targetingPreference: 70,
      uptake: 50,
      therapeuticEffect: 60,
      immuneResponse: 30,
      clearance: 40,
      offTargetEffect: 15,
      resistance: 10,
      toxicityProxy: 20,
    },
    notes: '',
  });

  const tumourCellModels = useMemo(
    () => organismIndex.query({
      category: 'tumours-cancer',
      simulationReady: true,
      pageSize: 48,
    }).items.filter((e) => e.entryKind === 'tumour-cell-line'),
    [],
  );

  const guidedResults = guidedQuery.trim() ? searchPathwayExplorer(guidedQuery) : [];

  const save = () => {
    if (!form.targetDescription?.trim()) {
      setSaveFeedback('Add a target description before saving — even a short educational one.');
      return;
    }
    const design: TherapeuticDesign = {
      id: generateId('TD'),
      name: form.name ?? 'Untitled design',
      targetType: (form.targetType ?? 'pathway') as TherapeuticTargetType,
      targetDescription: form.targetDescription ?? '',
      deliveryModel: (form.deliveryModel ?? 'non-replicating-vector') as DeliveryModelType,
      payloadEffect: (form.payloadEffect ?? 'suppress-target') as PayloadEffectType,
      intendedOutcome: form.intendedOutcome ?? 'growth-suppression',
      targetCellModelId: form.targetType === 'tumour-cell' ? form.targetCellModelId : undefined,
      variables: form.variables!,
      notes: form.notes ?? '',
      createdAt: new Date().toISOString(),
      evidence: { level: 'speculative', note: 'Conceptual therapeutic model — not a real vector construct' },
    };
    dispatch({ type: 'ADD_THERAPEUTIC', payload: design });
    setSaveFeedback(
      `Saved conceptual design “${design.name}” (${THERAPEUTIC_INTENDED_OUTCOME_LABELS[design.intendedOutcome!]}). Educational model only — not a clinical therapy or real vector.`,
    );
  };

  const sendToLab = (design: TherapeuticDesign) => {
    sendToVirtualLab(dispatch, design.id, design.name, 'therapeutic');
    navigate('/virtual-lab');
  };

  const showWhyTargetMatters = (symbol: string) => {
    navigate(`/pathway-explorer?gene=${symbol}`);
  };

  const v = form.variables!;

  return (
    <div className="therapeutic-page">
      <PageHeader
        title="Gene & Therapeutic Vector Design"
        subtitle="Conceptual therapeutic intervention modelling"
        actions={
          <>
            <ExplainThis title="Therapeutic Design" content={EXPLAIN.therapeutic} />
            <EvidenceBadge level="speculative" />
          </>
        }
      />

      <div className="safety-notice" role="note">{SAFETY_NOTICE}</div>

      <AboutThisTool
        title="Understanding Therapeutic Design"
        whatIsThis="Researchers explore potential strategies for modifying, replacing, delivering, or regulating biological/genetic material to address a biological problem. This page is an educational simulation of that thinking — not a clinic or wet lab."
        whyUseIt="Practise choosing a target, a delivery concept (vector), and trade-off parameters so you understand how therapy ideas are framed before real experiments."
        whatCanILearn="What genes and vectors mean in this context, what each control represents, and why a simulated design is not a validated treatment."
        caveat="A simulated design is not automatically a validated treatment, clinical recommendation, or laboratory-ready therapeutic construct."
        defaultOpen
      >
        <div className="explain-legend">
          <ExplainLabel label="Gene" content={EXPLAIN.gene} />
          <ExplainLabel label="Vector" content={EXPLAIN.vector} />
          <ExplainLabel label="Therapeutic design" content={EXPLAIN.therapeutic} />
        </div>
        <dl className="detail-dl about-tx-dl">
          <dt>What am I designing?</dt>
          <dd>A conceptual model: target type, target description, delivery model, payload effect, intended outcome, and teaching sliders for selectivity, uptake, effect, immune noticeability, clearance, off-target risk, resistance, and toxicity proxy.</dd>
          <dt>What problem could this address?</dt>
          <dd>Any educational scenario you describe — for example reducing cell movement, suppressing growth, or exploring cell killing concepts — for discussion only.</dd>
          <dt>What does the result mean?</dt>
          <dd>A saved teaching artefact of your choices for Virtual Lab handoff and learning — not proof of safety or efficacy, and not a real vector construct.</dd>
        </dl>
      </AboutThisTool>

      <Card title="Target Selection">
        <Button variant={guidedMode ? 'primary' : 'secondary'} onClick={() => setGuidedMode(!guidedMode)}>
          I'm not sure which target/pathway
        </Button>
        {guidedMode && (
          <div className="guided-panel">
            <p className="text-muted">Choose a starting point. Genesis will suggest relevant pathway categories and explain uncertainty.</p>
            <div className="guided-options">
              {GUIDED_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`guided-opt ${guidedStart === opt.id ? 'active' : ''}`}
                  onClick={() => setGuidedStart(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {guidedStart && (
              <div className="guided-explanation">
                <p>{resolveTiered(GUIDED_OPTIONS.find((o) => o.id === guidedStart)!.explanation, languageLevel)}</p>
                <input
                  type="search"
                  className="search-input"
                  placeholder="Search a gene or process (e.g. HTT, DNA repair)…"
                  value={guidedQuery}
                  onChange={(e) => setGuidedQuery(e.target.value)}
                  aria-label="Search guided targets"
                />
                {guidedResults.length > 0 && (
                  <ul className="search-results">
                    {guidedResults.slice(0, 5).map((r) => (
                      <li key={`${r.type}-${r.id}`}>
                        <button
                          type="button"
                          className="search-result-btn"
                          onClick={() => {
                            setForm({ ...form, targetDescription: r.label, targetType: r.type === 'gene' ? 'gene-function' : 'pathway' });
                            setGuidedQuery('');
                          }}
                        >
                          Use {r.label} as target
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => showWhyTargetMatters(r.label)}>
                          Show me why this target matters
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {guidedQuery.trim() && guidedResults.length === 0 && (
                  <p className="text-muted">No reference matches. Pathway data is limited — fictional targets are not generated.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="therapeutic-layout">
        <Card title="Build Conceptual Design">
          <div className="form-section">
            <label>
              Name
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Design name" />
            </label>
            <label>
              Target type
              <select
                value={form.targetType}
                onChange={(e) => setForm({ ...form, targetType: e.target.value as TherapeuticTargetType })}
                aria-label="Target type"
              >
                <option value="tumour-cell">Tumour cell</option>
                <option value="infected-cell">Infected cell</option>
                <option value="receptor">Receptor</option>
                <option value="pathway">Pathway</option>
                <option value="gene-function">Gene / function</option>
              </select>
            </label>
            {form.targetType === 'tumour-cell' && (
              <label>
                Catalogue cell model
                <select
                  value={form.targetCellModelId ?? ''}
                  onChange={(e) => setForm({ ...form, targetCellModelId: e.target.value || undefined })}
                  aria-label="Catalogue tumour cell model"
                >
                  <option value="">Select a simulation-ready cell line…</option>
                  {tumourCellModels.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Target description
              <textarea
                value={form.targetDescription}
                onChange={(e) => setForm({ ...form, targetDescription: e.target.value })}
                rows={2}
                aria-label="Target description"
              />
            </label>
            <label>
              Intended outcome
              <select
                value={form.intendedOutcome ?? 'growth-suppression'}
                onChange={(e) => setForm({ ...form, intendedOutcome: e.target.value as TherapeuticIntendedOutcome })}
                aria-label="Intended educational outcome"
              >
                {OUTCOME_OPTIONS.map((o) => (
                  <option key={o} value={o}>{THERAPEUTIC_INTENDED_OUTCOME_LABELS[o]}</option>
                ))}
              </select>
            </label>
            <p className="text-muted" role="note">
              Growth suppression and cell killing remain separate from reduce cell movement. Virtual Lab reports each metric independently — a viability drop is never shown as proof of reduced movement.
            </p>
            <label>
              Delivery model{' '}
              <ExplainThis title="Delivery / vector" content={EXPLAIN.vector} />
              <select
                value={form.deliveryModel}
                onChange={(e) => setForm({ ...form, deliveryModel: e.target.value as DeliveryModelType })}
                aria-label="Delivery model"
              >
                <option value="non-replicating-vector">Non-replicating vector (conceptual)</option>
                <option value="lipid-carrier">Lipid carrier</option>
                <option value="nanoparticle">Nanoparticle</option>
                <option value="other">Other conceptual system</option>
              </select>
            </label>
            <label>
              Payload effect
              <select
                value={form.payloadEffect}
                onChange={(e) => setForm({ ...form, payloadEffect: e.target.value as PayloadEffectType })}
                aria-label="Payload effect"
              >
                <option value="suppress-target">Suppress target</option>
                <option value="restore-function">Restore function</option>
                <option value="alter-expression">Alter expression</option>
                <option value="conceptual-payload">Conceptual therapeutic payload</option>
              </select>
            </label>
            {(['targetingPreference', 'uptake', 'therapeuticEffect', 'immuneResponse', 'clearance', 'offTargetEffect', 'resistance', 'toxicityProxy'] as const).map((key) => (
              <label key={key}>
                <span className="env-label-row">
                  {key.replace(/([A-Z])/g, ' $1')}
                  <ExplainThis title={key} content={PARAM_EXPLAIN[key]} />
                </span>
                : {v[key]}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={v[key]}
                  onChange={(e) => setForm({ ...form, variables: { ...v, [key]: parseInt(e.target.value, 10) } })}
                  aria-label={key.replace(/([A-Z])/g, ' $1')}
                />
              </label>
            ))}
            <Button onClick={save}>Save design</Button>
            {saveFeedback && <p className="success-text action-feedback" role="status">{saveFeedback}</p>}
          </div>
        </Card>

        <Card title="Saved Designs">
          {state.therapeuticDesigns.length === 0 ? (
            <p className="text-muted">No saved designs yet.</p>
          ) : (
            <ul className="item-list">
              {state.therapeuticDesigns.map((d) => {
                const outcome = d.intendedOutcome ?? 'growth-suppression';
                const cell = d.targetCellModelId ? organismIndex.getById(d.targetCellModelId) : null;
                return (
                  <li key={d.id}>
                    <div className="item-meta-block">
                      <span className="item-name">{d.name}</span>
                      <span className="text-muted">
                        {THERAPEUTIC_INTENDED_OUTCOME_LABELS[outcome]}
                        {cell ? ` · ${cell.name}` : ''}
                      </span>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => sendToLab(d)} aria-label={`Send ${d.name} to Virtual Lab`}>
                      Send to Virtual Lab
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
