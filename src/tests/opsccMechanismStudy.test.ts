import {describe,expect,test} from 'bun:test';
import {OPSCC_MECHANISMS,runOpsccMechanismStudy,formatOpsccMechanismReport} from '../services/opsccMechanismStudy';
describe('OPSCC mechanism-dissection educational study',()=>{
test('runs isolated mechanism arms and combined arm in both HPV scenarios',()=>{const r=runOpsccMechanismStudy({baseSeed:123456,replicateCount:100});expect(r.scenarios).toHaveLength(2);for(const s of r.scenarios){expect(s.arms).toHaveLength(OPSCC_MECHANISMS.length+3);expect(s.arms.find(a=>a.id==='baseline')).toBeDefined();expect(s.arms.find(a=>a.id==='sham')).toBeDefined();expect(s.arms.find(a=>a.id==='combined-v001')).toBeDefined();for(const m of OPSCC_MECHANISMS)expect(s.arms.find(a=>a.id===m.id)).toBeDefined();}});
test('is deterministic for a fixed seed and keeps HPV scenarios separate',()=>{const a=runOpsccMechanismStudy({baseSeed:123456,replicateCount:20});const b=runOpsccMechanismStudy({baseSeed:123456,replicateCount:20});expect(a.scenarios[0].arms[0].summaries).toEqual(b.scenarios[0].arms[0].summaries);expect(a.scenarios[0].title).not.toEqual(a.scenarios[1].title);});
test('exports purpose and evidence boundaries',()=>{const t=formatOpsccMechanismReport(runOpsccMechanismStudy({baseSeed:123456,replicateCount:10}));expect(t).toContain('PERSONAL PURPOSE');expect(t).toContain('not biological evidence');expect(t).toContain('lung');});
});
