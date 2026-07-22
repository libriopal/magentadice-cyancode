import { useMemo, useState } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import 'survey-core/defaultV2.min.css';
import { store, getUserId } from '../labStore';
import { makeEarnRecord, SPARKS } from '../../sparks/wallet';
import { EXPERIMENT_ID } from '../../experiments/one-roll/oneRoll';

// Opt-in rewarded survey + free-text reflection (SurveyJS, MIT). The bonus is FLAT for
// completion — never scaled by the content of answers (anti-circularity: we do not grade
// the human, and we NEVER derive skill_score / was_optimal). Fully skippable.
const surveyJson = {
  showQuestionNumbers: 'off',
  completeText: 'Submit & earn Sparks',
  elements: [
    {
      type: 'rating',
      name: 'engagement',
      title: 'How engaged did that decision feel?',
      rateMin: 1,
      rateMax: 5,
      isRequired: false,
    },
    {
      type: 'radiogroup',
      name: 'again',
      title: 'Would you play another round?',
      choices: ['Yes', 'Maybe', 'No'],
      isRequired: false,
    },
    {
      type: 'comment',
      name: 'reflection',
      title: 'In your own words — why did you pick the number of dice you did?',
      isRequired: false,
    },
  ],
};

export function SurveyView({ sessionId, onDone }: { sessionId: string; onDone: () => void }) {
  const [state, setState] = useState<'offer' | 'open' | 'done' | 'skipped'>('offer');

  const model = useMemo(() => {
    const m = new Model(surveyJson);
    m.onComplete.add((sender) => {
      const uid = getUserId();
      const data = sender.data as Record<string, unknown>;
      const reflection = typeof data.reflection === 'string' ? data.reflection : '';
      const now = new Date().toISOString();
      store.addSurvey({
        id: crypto.randomUUID(),
        session_id: sessionId,
        user_id: uid,
        experiment_id: EXPERIMENT_ID,
        answers_json: JSON.stringify(data),
        reflection_text: reflection,
        sparks_bonus: SPARKS.SURVEY_COMPLETION,
        created_at: now,
        // no skill_score / was_optimal — C7.
      });
      store.addSparks(makeEarnRecord(uid, SPARKS.SURVEY_COMPLETION, 'survey:completion', sessionId, now));
      setState('done');
      onDone();
    });
    return m;
  }, [sessionId, onDone]);

  if (state === 'offer') {
    return (
      <div className="panel warnbox">
        <h2>Optional reflection survey <span className="pill">+{SPARKS.SURVEY_COMPLETION} Sparks</span></h2>
        <p className="muted">Totally optional and skippable. The bonus is the same regardless of what you answer.</p>
        <div className="row">
          <button className="btn primary" onClick={() => setState('open')}>Take the survey</button>
          <button className="btn" onClick={() => setState('skipped')}>Skip</button>
        </div>
      </div>
    );
  }
  if (state === 'open') {
    return (
      <div className="panel">
        <Survey model={model} />
      </div>
    );
  }
  if (state === 'done') {
    return <p className="ok">Thanks — reflection captured. +{SPARKS.SURVEY_COMPLETION} Sparks.</p>;
  }
  return <p className="muted">Survey skipped. No Sparks bonus, no problem.</p>;
}
