import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, CheckCircle2, Loader2, RefreshCw, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { careerAgentService } from '../../services/careerAgentService';
import { useCareerStudio } from './CareerStudioProvider';
import { cn, formatDateShort } from './studioData';
import { Banner, SectionLabel } from './ui';

function UsageMeter({ free }) {
  const included = Number(free?.included) || 0;
  const used = Number(free?.used) || 0;
  const reserved = Number(free?.reserved) || 0;
  const remaining = Number(free?.remaining) || 0;
  const usedPercent = included > 0 ? Math.min(100, Math.round(((used + reserved) / included) * 100)) : 0;
  return (
    <div className="cs-usage-meter">
      <div className="cs-usage-figures">
        <div><strong>{remaining}</strong><span>remaining</span></div>
        <div><strong>{used}</strong><span>used</span></div>
        <div><strong>{reserved}</strong><span>reserved</span></div>
        <div><strong>{included}</strong><span>included</span></div>
      </div>
      <div className="cs-meter cs-meter--usage" aria-label={`${usedPercent}% of included packages used`}>
        <span style={{ width: `${usedPercent}%` }} />
      </div>
      <p className="cs-muted">Reservations cover packages that are still running. Completed packages count as used.</p>
    </div>
  );
}

export function PlanUsage() {
  const { usage, subscription: cachedSubscription, refreshUsage, refreshSubscription } = useCareerStudio();
  const [localSubscription, setLocalSubscription] = useState(null);
  const [busyPlan, setBusyPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const subscription = localSubscription || cachedSubscription;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usageData, subscriptionData] = await Promise.all([
        refreshUsage(),
        refreshSubscription(),
      ]);
      if (subscriptionData) setLocalSubscription(subscriptionData);
      if (!usageData && !subscriptionData) {
        setError('Plan details are temporarily unavailable.');
      }
    } catch (loadError) {
      setError(loadError.message || 'Plan details are temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [refreshUsage, refreshSubscription]);

  useEffect(() => {
    load();
  }, [load]);

  const subscribe = async (planCode) => {
    if (busyPlan) return;
    setBusyPlan(planCode);
    setError(null);
    try {
      const checkout = await careerAgentService.startCheckout(planCode);
      if (checkout.provider_reference) {
        sessionStorage.setItem('career-agent-payment-reference', checkout.provider_reference);
      }
      if (checkout.checkout_url) {
        window.location.href = checkout.checkout_url;
        return;
      }
      if (checkout.transaction?.status === 'COMPLETED') {
        toast.success('Your plan is active.');
        await load();
      } else {
        setError('Your checkout is already pending. Complete it with the payment provider.');
      }
    } catch (checkoutError) {
      setError(checkoutError.message || 'Could not start checkout.');
    } finally {
      setBusyPlan(null);
    }
  };

  const plans = subscription?.plans || [];
  const active = usage?.active_subscription || subscription?.active_subscription;
  const free = usage?.free_package || subscription?.free_package || {};
  const canGenerate = usage?.can_generate_new_package ?? subscription?.can_generate_new_package;
  const paidPlans = plans.filter((plan) => !plan.is_free);
  const freePlan = plans.find((plan) => plan.is_free);

  return (
    <div className="cs-page">
      <header className="cs-page-head">
        <div>
          <SectionLabel>Plan &amp; usage</SectionLabel>
          <h1>Your allowance</h1>
          <p>The server decides what you can generate. Editing and exporting saved documents stays free.</p>
        </div>
        <div className="cs-page-head-actions">
          <button type="button" className="cs-btn cs-btn--quiet" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'cs-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      {error && <Banner kind="error" onDismiss={() => setError(null)}>{error}</Banner>}
      {usage?.reason && canGenerate === false && (
        <Banner kind="warn">{usage.reason}</Banner>
      )}

      {loading && !subscription ? (
        <div className="cs-skeleton" role="status" aria-live="polite">Loading your plan…</div>
      ) : (
        <div className="cs-plan-layout">
          <section className="cs-card" aria-labelledby="current-plan">
            <div className="cs-card-head">
              <div>
                <SectionLabel>Current plan</SectionLabel>
                <h2 id="current-plan">
                  {active
                    ? (active.plan?.name || active.plan_code || 'Subscription')
                    : (freePlan?.name || 'Free plan')}
                </h2>
                <p className="cs-sub">
                  {active
                    ? <>
                      {String(active.status || '').toLowerCase()}
                      {active.ends_at ? ` · renews ${formatDateShort(active.ends_at)}` : ''}
                      {active.is_active === false ? ' · not active right now' : ''}
                    </>
                    : 'No active subscription'}
                </p>
              </div>
              <span className={cn('cs-tag', active && 'cs-tag--teal')}>
                {active ? 'Active' : 'Free'}
              </span>
            </div>

            <UsageMeter free={free} />

            {active?.plan && (
              <ul className="cs-allowance">
                <li><span>Package limit</span><strong>{active.plan.generation_package_limit}</strong></li>
                <li><span>Duration</span><strong>{active.plan.duration_days} days</strong></li>
                <li><span>Packages used on this subscription</span><strong>{usage?.subscription_usage ?? '—'}</strong></li>
              </ul>
            )}

            <div className="cs-card-actions">
              <Link className="cs-btn cs-btn--quiet" to="/jobseeker/career-agent">Back to studio</Link>
              {canGenerate === false && <Link className="cs-btn cs-btn--primary" to="/jobseeker/career-agent/new">Try a new package <ArrowRight size={15} /></Link>}
            </div>
          </section>

          <section className="cs-card" aria-labelledby="plans-title">
            <div className="cs-card-head">
              <div>
                <SectionLabel>Plans</SectionLabel>
                <h2 id="plans-title">Unlock another package</h2>
                <p className="cs-sub">Payment is verified server-side before a package unlocks.</p>
              </div>
            </div>

            <div className="cs-plan-grid cs-plan-grid--full">
              {paidPlans.map((plan) => (
                <article key={plan.code} className="cs-plan-card">
                  <span className="cs-plan-name">{plan.name}</span>
                  <strong className="cs-plan-price">{Number(plan.price_rwf).toLocaleString()} <small>RWF</small></strong>
                  <span className="cs-plan-duration">{plan.duration_days} days · {plan.generation_package_limit} packages</span>
                  <p>{plan.description}</p>
                  <button type="button" className="cs-btn cs-btn--primary" disabled={Boolean(busyPlan)} onClick={() => subscribe(plan.code)}>
                    {busyPlan === plan.code ? <Loader2 className="cs-spin" size={15} /> : <Sparkles size={15} />}
                    {busyPlan === plan.code ? 'Redirecting…' : 'Choose plan'}
                  </button>
                </article>
              ))}
              {!paidPlans.length && (
                <div className="cs-plan-card cs-plan-card--loading"><Loader2 className="cs-spin" size={16} /> Loading plans…</div>
              )}
            </div>

            <p className="cs-note cs-note--warn">
              <AlertTriangle size={15} />
              <span>Saved documents can always be edited and exported for free. A plan is only needed to prepare a new package.</span>
            </p>
          </section>
        </div>
      )}

      {canGenerate && (
        <div className="cs-notice-strip cs-notice-strip--teal">
          <CheckCircle2 size={16} />
          <span>You can start a new package right now.</span>
        </div>
      )}
    </div>
  );
}

export default PlanUsage;
