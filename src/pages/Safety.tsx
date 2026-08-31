import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { safetyTopics } from '../data/demoData';

export function SafetyPage() {
  return (
    <div className="safety-page">
      <PageHeader
        title="Safety"
        subtitle="Educational laboratory safety information"
      />

      <div className="safety-notice">
        <strong>Important:</strong> This section provides general educational information about
        laboratory safety principles. It does <em>not</em> replace institutional laboratory training,
        risk assessments, biosafety procedures, chemical safety data sheets, or professional
        supervision. Always follow your institution&apos;s approved protocols for real laboratory work.
      </div>

      <div className="safety-grid">
        {safetyTopics.map((topic) => (
          <Card key={topic.id} title={topic.title}>
            <p>{topic.content}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
