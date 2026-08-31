import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { resolveTiered } from '../content/language';
import { useLanguage } from '../components/ui/LanguageControl';
import { useAppState, generateId, sendToVirtualLab } from '../store/AppContext';
import { searchPathwayExplorer } from '../services/pathwaySearch';
import type { TherapeuticDesign, TherapeuticTargetType, DeliveryModelType, PayloadEffectType } from '../types/scientific';

const SAFETY_NOTICE =
  'This module supports conceptual therapeutic modelling only. It does not output viable pathogen sequences, replication-competent designs, or wet-lab construction protocols.';

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

export function TherapeuticDesignPage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const languageLevel = useLanguage();
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedStart, setGuidedStart] = useState<GuidedStart | null>(null);
  const [guidedQuery, setGuidedQuery] = useState('');
  const [form, setForm] = useState<Partial<TherapeuticDesign>>({
    name: 'Conceptual therapeutic design',
    targetType: 'pathway',
    targetDescription: '',
    deliveryModel: 'non-replicating-vector',
    payloadEffect: 'suppress-target',
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

  const guidedResults = guidedQuery.trim() ? searchPathwayExplorer(guidedQuery) : [];

  const save = () => {
    const design: TherapeuticDesign = {
      id: generateId('TD'),
      name: form.name ?? 'Untitled design',
      targetType: (form.targetType ?? 'pathway') as TherapeuticTargetType,
      targetDescription: form.targetDescription ?? '',
      deliveryModel: (form.deliveryModel ?? 'non-replicating-vector') as DeliveryModelType,
      payloadEffect: (form.payloadEffect ?? 'suppress-target') as PayloadEffectType,
      variables: form.variables!,
      notes: form.notes ?? '',
      createdAt: new Date().toISOString(),
      evidence: { level: 'speculative', note: 'Conceptual therapeutic model' },
    };
    dispatch({ type: 'ADD_THERAPEUTIC', payload: design });
  };

  const sendToLab = (id: string, name: string) => {
    sendToVirtualLab(dispatch, id, name, 'therapeutic');
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
        actions={<EvidenceBadge level="speculative" />}
      />

      <div className="safety-notice">{SAFETY_NOTICE}</div>

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
            <label>Name<input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label>
              Target type
              <select value={form.targetType} onChange={(e) => setForm({ ...form, targetType: e.target.value as TherapeuticTargetType })}>
                <option value="tumour-cell">Tumour cell</option>
                <option value="infected-cell">Infected cell</option>
                <option value="receptor">Receptor</option>
                <option value="pathway">Pathway</option>
                <option value="gene-function">Gene / function</option>
              </select>
            </label>
            <label>Target description<textarea value={form.targetDescription} onChange={(e) => setForm({ ...form, targetDescription: e.target.value })} rows={2} /></label>
            <label>
              Delivery model
              <select value={form.deliveryModel} onChange={(e) => setForm({ ...form, deliveryModel: e.target.value as DeliveryModelType })}>
                <option value="non-replicating-vector">Non-replicating vector (conceptual)</option>
                <option value="lipid-carrier">Lipid carrier</option>
                <option value="nanoparticle">Nanoparticle</option>
                <option value="other">Other conceptual system</option>
              </select>
            </label>
            <label>
              Payload effect
              <select value={form.payloadEffect} onChange={(e) => setForm({ ...form, payloadEffect: e.target.value as PayloadEffectType })}>
                <option value="suppress-target">Suppress target</option>
                <option value="restore-function">Restore function</option>
                <option value="alter-expression">Alter expression</option>
                <option value="conceptual-payload">Conceptual therapeutic payload</option>
              </select>
            </label>
            {(['targetingPreference', 'uptake', 'therapeuticEffect', 'immuneResponse', 'clearance', 'offTargetEffect', 'resistance', 'toxicityProxy'] as const).map((key) => (
              <label key={key}>
                {key.replace(/([A-Z])/g, ' $1')}: {v[key]}
                <input type="range" min={0} max={100} value={v[key]} onChange={(e) => setForm({ ...form, variables: { ...v, [key]: parseInt(e.target.value, 10) } })} />
              </label>
            ))}
            <Button onClick={save}>Save design</Button>
          </div>
        </Card>

        <Card title="Saved Designs">
          {state.therapeuticDesigns.length === 0 ? (
            <p className="text-muted">No saved designs yet.</p>
          ) : (
            <ul className="item-list">
              {state.therapeuticDesigns.map((d) => (
                <li key={d.id}>
                  <span className="item-name">{d.name}</span>
                  <Button size="sm" variant="secondary" onClick={() => sendToLab(d.id, d.name)}>
                    Send to Virtual Lab
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
