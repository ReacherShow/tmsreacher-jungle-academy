import { accuracy, getHistory, getSubjectRange, subjectAccuracy } from '../math/adaptiveEngine.js';

const subjects = ['addition', 'subtraction', 'multiplication', 'fractions', 'decimals'];
const labels = { addition: 'Addition', subtraction: 'Subtraction', multiplication: 'Multiplication', fractions: 'Fractions', decimals: 'Decimals' };

export default function Dashboard({ profile }) {
  const weakFacts = profile.weakFacts?.length ? profile.weakFacts : ['Play a round to discover focus facts'];
  const weekly = getHistory(profile, 7);
  const monthly = getHistory(profile, 30);
  const yearly = getHistory(profile, 365);
  const weekTotal = weekly.reduce((sum, d) => sum + (d.total || 0), 0);
  const monthTotal = monthly.reduce((sum, d) => sum + (d.total || 0), 0);
  const yearTotal = yearly.reduce((sum, d) => sum + (d.total || 0), 0);
  const bestDay = monthly.reduce((best, d) => (d.total || 0) > (best.total || 0) ? d : best, { total: 0 });

  return (
    <section id="dashboard" className="panel dashboard">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Dad Mode</p>
          <h2>Progress Dashboard</h2>
        </div>
        <span className="badge">🔥 Daily streak {profile.dailyLoginStreak || 1} · Best {profile.bestLoginStreak || 1}</span>
      </div>
      <div className="dashboard-grid">
        <div className="metric"><strong>{accuracy(profile)}%</strong><span>All-time accuracy</span></div>
        <div className="metric"><strong>{profile.total}</strong><span>All-time problems</span></div>
        <div className="metric"><strong>{weekTotal}</strong><span>This week</span></div>
        <div className="metric"><strong>{monthTotal}</strong><span>This month</span></div>
      </div>

      <div className="progress-section">
        <h3>Subject Growth</h3>
        <div className="subject-progress">
          {subjects.map((subject) => {
            const skill = profile.skills?.[subject] || { level: 1, total: 0, correct: 0 };
            const range = getSubjectRange(subject, skill);
            return (
              <article key={subject} className="skill-card">
                <strong>{labels[subject]}</strong>
                <span>Level {skill.level} · {range.label}</span>
                <div className="progress-bar"><i style={{ width: `${Math.min(100, subjectAccuracy(profile, subject))}%` }}></i></div>
                <small>{subjectAccuracy(profile, subject)}% accuracy · {skill.total} reps · review {(skill.reviewQueue || []).length}</small>
              </article>
            );
          })}
        </div>
      </div>

      <div className="progress-section">
        <h3>Week View</h3>
        <div className="history-bars">
          {weekly.map((day) => <div key={day.date}><i style={{ height: `${Math.min(100, (day.total || 0) * 7)}%` }}></i><span>{day.date.slice(5)}</span></div>)}
        </div>
        <p className="subtle">Month total: {monthTotal} · Year total: {yearTotal} · Best day this month: {bestDay.total || 0} problems.</p>
      </div>

      <div className="focus-box">
        <h3>Focus facts and review queue</h3>
        <p>The app flexes down when recent accuracy drops and flexes up when Reacher shows confidence. Missed items go into review and flashcards instead of simply revealing the answer.</p>
        <div className="chips">
          {weakFacts.map((fact) => <span key={fact}>{fact}</span>)}
        </div>
      </div>
    </section>
  );
}
