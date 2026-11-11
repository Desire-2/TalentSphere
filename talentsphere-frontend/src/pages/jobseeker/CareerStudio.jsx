import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bell, CheckCircle2, FileText, FolderOpen, LayoutGrid, Loader2,
  Sparkles, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { careerAgentService } from '../../services/careerAgentService';
import { useNotificationContext } from '../../components/notifications/NotificationProviderReal';
import CareerStudioProvider, { useCareerStudio } from '../../components/career-studio/CareerStudioProvider';
import {
  STAGE_SEQUENCE, cn, generationStatus, relativeTime,
} from '../../components/career-studio/studioData';
import '../../styles/career-studio.css';

const SECTIONS = [
  { to: '/jobseeker/career-agent', label: 'Studio', icon: LayoutGrid, end: true },
  { to: '/jobseeker/career-agent/documents', label: 'Documents', icon: FileText },
  { to: '/jobseeker/career-agent/templates', label: 'Templates', icon: FolderOpen },
  { to: '/jobseeker/career-agent/plan', label: 'Plan & usage', icon: Wallet },
];

function NotificationBell() {
  const { unreadCount, notifications, markAllAsRead } = useNotificationContext();
  const [open, setOpen] = useState(false);
  const recent = (notifications || []).slice(0, 6);

  return (
    <div className="cs-bell">
      <button
        type="button" className="cs-icon-btn cs-bell-btn" aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={17} />
        {unreadCount > 0 && <span className="cs-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <>
          <button type="button" className="cs-bell-scrim" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="cs-bell-panel" role="dialog" aria-label="Notifications">
            <div className="cs-bell-head">
              <strong>Notifications</strong>
              {unreadCount > 0 && (
                <button type="button" className="cs-btn cs-btn--text" onClick={() => markAllAsRead?.()}>Mark all read</button>
              )}
            </div>
            {!recent.length && <p className="cs-muted cs-bell-empty">Nothing new yet.</p>}
            {recent.map((item) => (
              <div key={item.id} className={cn('cs-bell-item', !item.is_read && 'cs-bell-item--unread')}>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{relativeTime(item.created_at)}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function UsageChip() {
  const { usage } = useCareerStudio();
  const free = usage?.free_package || {};
  const subscription = usage?.active_subscription;
  const label = subscription
    ? (subscription.plan?.name || subscription.plan_code || 'Subscription')
    : free.remaining != null
      ? `${free.remaining} package${free.remaining === 1 ? '' : 's'} left`
      : 'Checking allowance';
  return (
    <span className={cn('cs-usage-chip', usage?.can_generate_new_package === false && 'cs-usage-chip--warn')}>
      <Sparkles size={13} /> {label}
    </span>
  );
}

/** Sticky, compact view of the in-flight background task so it stays visible
 *  on every section of the studio. */
function TaskBar() {
  const { generating } = useCareerStudio();
  const location = useLocation();
  if (!generating) return null;
  const status = generationStatus(generating.status);
  if (status === 'COMPLETED') return null;

  const stages = generating.stages || [];
  const completed = stages.filter((stage) => generationStatus(stage.status) === 'SUCCESS').length;
  const active = stages.find((stage) => generationStatus(stage.status) === 'PROCESSING');
  const onDashboard = location.pathname === '/jobseeker/career-agent';
  const label = status === 'FAILED'
    ? (generating.error_message || 'Generation stopped')
    : active?.display_name || (status === 'PENDING' ? 'Waiting for the background worker' : 'Preparing your documents');

  return (
    <NavLink to="/jobseeker/career-agent" className={cn('cs-taskbar', status === 'FAILED' && 'cs-taskbar--failed')}>
      <span className="cs-taskbar-mark">
        {status === 'FAILED' ? <CheckCircle2 size={15} /> : <Loader2 size={15} className="cs-spin" />}
      </span>
      <span className="cs-taskbar-copy">
        <strong>{label}</strong>
        <small>{completed} of {STAGE_SEQUENCE.length} steps complete{onDashboard ? '' : ' · open the studio to watch'}</small>
      </span>
      {status !== 'FAILED' && (
        <span className="cs-taskbar-bar" aria-hidden="true">
          <span style={{ width: `${Math.round((completed / Math.max(stages.length || STAGE_SEQUENCE.length, 1)) * 100)}%` }} />
        </span>
      )}
    </NavLink>
  );
}

function StudioChrome() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const {
    loading, error, dismissError, refreshUsage, refreshSubscription, focusPackage,
  } = useCareerStudio();
  const [paymentNote, setPaymentNote] = useState(null);
  const focusedRef = useRef(null);

  // Payment return lands on /jobseeker/career-agent?checkout_reference=… —
  // verify server-side before the plan unlocks.
  useEffect(() => {
    const queryReference = params.get('provider_reference') || params.get('checkout_reference');
    const storedReference = sessionStorage.getItem('career-agent-payment-reference');
    const reference = queryReference || storedReference;
    if (!reference) return undefined;
    let active = true;
    careerAgentService.verifyPayment(reference)
      .then(async () => {
        sessionStorage.removeItem('career-agent-payment-reference');
        if (!active) return;
        const next = new URLSearchParams(params);
        next.delete('provider_reference');
        next.delete('checkout_reference');
        setParams(next, { replace: true });
        await Promise.all([refreshUsage(), refreshSubscription()]);
        setPaymentNote(null);
        toast.success('Payment verified — your plan is active.');
      })
      .catch((verifyError) => {
        sessionStorage.removeItem('career-agent-payment-reference');
        if (active) setPaymentNote(verifyError.message || 'Payment could not be verified yet.');
      });
    return () => { active = false; };
  }, [params, setParams, refreshUsage, refreshSubscription]);

  // ?package_id=… deep link (notifications and emails) opens that package.
  useEffect(() => {
    const packageId = params.get('package_id');
    if (!packageId || focusedRef.current === packageId) return;
    focusedRef.current = packageId;
    focusPackage(packageId);
  }, [params, focusPackage]);

  const navItems = useMemo(() => SECTIONS, []);

  return (
    <div className="cs-studio">
      <header className="cs-studio-head">
        <div className="cs-studio-head-inner">
          <div className="cs-brand">
            <span className="cs-brand-mark" aria-hidden="true">AB</span>
            <div>
              <strong>AfriTech Bridge</strong>
              <span>Career Studio</span>
            </div>
          </div>

          <nav className="cs-section-nav" aria-label="Career Studio sections">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to} to={item.to} end={item.end}
                  className={({ isActive }) => cn('cs-section-link', isActive && 'cs-section-link--active')}
                >
                  <Icon size={15} /> {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="cs-head-actions">
            <UsageChip />
            <NotificationBell />
            <button type="button" className="cs-btn cs-btn--primary" onClick={() => navigate('/jobseeker/career-agent/new')}>
              <Sparkles size={15} /> New document
            </button>
          </div>
        </div>
      </header>

      <TaskBar />

      {(error || paymentNote) && (
        <div className="cs-studio-notices">
          {error && (
            <div className="cs-banner cs-banner--error" role="alert">
              <span>{error}</span>
              <button type="button" className="cs-btn cs-btn--text" onClick={dismissError}>Dismiss</button>
            </div>
          )}
          {paymentNote && (
            <div className="cs-banner cs-banner--warn" role="status">
              <span>{paymentNote}</span>
              <button type="button" className="cs-btn cs-btn--text" onClick={() => setPaymentNote(null)}>Dismiss</button>
            </div>
          )}
        </div>
      )}

      <main className="cs-studio-main">
        {loading ? (
          <div className="cs-skeleton" role="status" aria-live="polite">Loading your studio…</div>
        ) : (
          <Suspense fallback={<div className="cs-skeleton" role="status" aria-live="polite">Loading section…</div>}>
            <Outlet />
          </Suspense>
        )}
      </main>
    </div>
  );
}

export default function CareerStudio() {
  return (
    <CareerStudioProvider>
      <StudioChrome />
    </CareerStudioProvider>
  );
}
