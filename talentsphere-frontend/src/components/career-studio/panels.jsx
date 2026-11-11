import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Target, Upload, X } from 'lucide-react';
import { careerAgentService } from '../../services/careerAgentService';
import { IconButton, SectionLabel } from './ui';
import { cn } from './studioData';

/** Extracted sections are arrays, scalars or small objects (contact details).
 *  Never render an object directly — String({}) reads "[object Object]". */
function describeExtracted(value) {
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
  if (value && typeof value === 'object') {
    const parts = Object.entries(value)
      .filter(([, item]) => typeof item === 'string' || typeof item === 'number')
      .map(([label, item]) => `${label.replace(/_/g, ' ')}: ${item}`);
    return (parts.join(' · ') || 'Details').slice(0, 120);
  }
  return String(value).slice(0, 120);
}

/** Upload an existing CV, review what was extracted, then confirm it into
 *  profile evidence. Nothing is written until the user confirms. */
export function ImportDrawer({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await careerAgentService.importDocument(file);
      setResult(data);
      setSelected(Object.fromEntries(Object.keys(data.extracted_data || {}).map((key) => [key, true])));
    } catch (uploadError) {
      setError(uploadError.message || 'We could not read this document.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await careerAgentService.confirmImport(result.id, Object.keys(selected).filter((key) => selected[key]));
      onImported?.();
    } catch (confirmError) {
      setError(confirmError.message || 'We could not save the imported information.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cs-drawer-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <aside className="cs-drawer" role="dialog" aria-modal="true" aria-labelledby="import-title">
        <div className="cs-drawer-head">
          <div>
            <SectionLabel>Profile evidence</SectionLabel>
            <h2 id="import-title">Import an existing CV</h2>
          </div>
          <IconButton label="Close import panel" disabled={busy} onClick={onClose}><X size={18} /></IconButton>
        </div>
        <p className="cs-drawer-intro">
          Bring in a CV you already trust. Review the extracted sections before anything is added to your career profile.
        </p>

        <div className="cs-upload-zone">
          <Upload size={22} />
          <strong>{file ? file.name : 'Choose a document to import'}</strong>
          <span>PDF, DOCX, TXT, RTF, ODT, Markdown or image · up to 10 MB</span>
          <label className="cs-btn cs-btn--quiet cs-file-label">
            Choose file
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.rtf,.odt,.md,.markdown,.png,.jpg,.jpeg,.webp"
              disabled={busy}
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        {!result && (
          <button type="button" className="cs-btn cs-btn--primary cs-btn--block" disabled={!file || busy} onClick={upload}>
            {busy ? <Loader2 className="cs-spin" size={16} /> : <Upload size={16} />}
            {busy ? 'Reading document…' : 'Upload and extract'}
          </button>
        )}

        {error && <div className="cs-error"><AlertTriangle size={16} /> {error}</div>}

        {result && (
          <div className="cs-import-review">
            <div className="cs-review-head">
              <CheckCircle2 size={18} />
              <div>
                <strong>Review extracted information</strong>
                <span>Your profile is not overwritten.</span>
              </div>
            </div>
            {(result.conflicts || []).map((conflict, index) => (
              <div key={index} className="cs-conflict">
                <AlertTriangle size={15} />
                <span>Potential inconsistency for <strong>{conflict.label}</strong>. Both remain separate evidence.</span>
              </div>
            ))}
            <div className="cs-import-fields">
              {Object.entries(result.extracted_data || {})
                .filter(([, value]) => (Array.isArray(value) ? value.length : Boolean(value)))
                .map(([key, value]) => (
                  <label key={key} className={cn('cs-import-field', selected[key] === false && 'cs-import-field--off')}>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[key])}
                      onChange={(event) => setSelected((previous) => ({ ...previous, [key]: event.target.checked }))}
                    />
                    <span>
                      <strong>{key.replace(/_/g, ' ')}</strong>
                      <small>{describeExtracted(value)}</small>
                    </span>
                  </label>
                ))}
            </div>
            <div className="cs-drawer-actions">
              <button type="button" className="cs-btn cs-btn--quiet" disabled={busy} onClick={() => setResult(null)}>Start over</button>
              <button type="button" className="cs-btn cs-btn--primary" disabled={busy} onClick={confirm}>
                {busy ? <Loader2 className="cs-spin" size={15} /> : <CheckCircle2 size={15} />}
                {busy ? 'Saving…' : 'Add selected to profile'}
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

/** Entitlement gate: shows the real allowance reason and the plans the server
 *  offers. Checkout is verified server-side before anything unlocks. */
export function Paywall({ reason, onCheckoutStart }) {
  const [plans, setPlans] = useState([]);
  const [busyPlan, setBusyPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    careerAgentService.getSubscription()
      .then((data) => { if (active) setPlans(data.plans || []); })
      .catch(() => { if (active) setError('Plans are unavailable right now.'); });
    return () => { active = false; };
  }, []);

  const subscribe = async (planCode) => {
    setBusyPlan(planCode);
    setError(null);
    try {
      const checkout = await careerAgentService.startCheckout(planCode);
      onCheckoutStart?.(checkout);
      if (checkout.provider_reference) {
        sessionStorage.setItem('career-agent-payment-reference', checkout.provider_reference);
      }
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
      } else if (checkout.transaction?.status !== 'COMPLETED') {
        setError('Your checkout is already pending. Complete it with the payment provider.');
      }
    } catch (checkoutError) {
      setError(checkoutError.message || 'Could not start checkout.');
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <section className="cs-paywall" aria-labelledby="paywall-title">
      <div className="cs-paywall-copy">
        <SectionLabel>Plan required</SectionLabel>
        <h2 id="paywall-title">Ready for another tailored package?</h2>
        <p>
          {reason || 'Your saved documents stay editable and exportable. Choose a plan when you want to prepare another role-specific package.'}
        </p>
        <div className="cs-paywall-facts">
          <span><CheckCircle2 size={15} /> Edit and export saved documents <strong>Free</strong></span>
          <span><Target size={15} /> New CV + cover letter package <strong>Plan required</strong></span>
        </div>
      </div>
      <div className="cs-plan-grid">
        {plans.filter((plan) => !plan.is_free).map((plan) => (
          <article key={plan.code} className="cs-plan-card">
            <span className="cs-plan-name">{plan.name}</span>
            <strong className="cs-plan-price">{Number(plan.price_rwf).toLocaleString()} <small>RWF</small></strong>
            <span className="cs-plan-duration">{plan.duration_days} days · {plan.generation_package_limit} packages</span>
            <p>{plan.description}</p>
            <button type="button" className="cs-btn cs-btn--primary" disabled={Boolean(busyPlan)} onClick={() => subscribe(plan.code)}>
              {busyPlan === plan.code ? <Loader2 className="cs-spin" size={15} /> : 'Choose plan'}
            </button>
          </article>
        ))}
        {!plans.filter((plan) => !plan.is_free).length && !error && (
          <div className="cs-plan-card cs-plan-card--loading"><Loader2 className="cs-spin" size={16} /> Loading plans…</div>
        )}
      </div>
      {error && <div className="cs-error"><AlertTriangle size={16} /> {error}</div>}
      <p className="cs-paywall-note">Payment is verified server-side before a new package is unlocked.</p>
    </section>
  );
}
