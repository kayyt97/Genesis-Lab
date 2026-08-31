import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EvidenceBadge } from '../components/ui/EvidenceBadge';
import { useAppState, generateId, sendToVirtualLab } from '../store/AppContext';
import type { TherapeuticDesign, TherapeuticTargetType, DeliveryModelType, PayloadEffectType } from '../types/scientific';

const SAFETY_NOTICE =
  'This module supports conceptual therapeutic modelling only. It does not output viable pathogen sequences, replication-competent designs, or wet-lab construction protocols.';

export function TherapeuticDesignPage() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
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

  const v = form.variables!;

  return (
    <div className="therapeutic-page">
      <PageHeader
        title="Gene & Therapeutic Vector Design"
        subtitle="Conceptual therapeutic intervention modelling"
        actions={<EvidenceBadge level="speculative" />}
      />

      <div className="safety-notice">{SAFETY_NOTICE}</div>

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
