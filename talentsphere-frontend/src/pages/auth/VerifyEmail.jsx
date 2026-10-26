import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react';
import apiService from '../../services/api';
import { Button } from '../../components/ui/button';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address…');

  useEffect(() => {
    let active = true;
    if (!token) {
      setState('error');
      setMessage('This verification link is missing its security token.');
      return () => {
        active = false;
      };
    }

    apiService.post('/auth/verify-email', { token })
      .then((response) => {
        if (!active) return;
        setState('success');
        setMessage(response.message || 'Email verified successfully.');
      })
      .catch((error) => {
        if (!active) return;
        setState('error');
        setMessage(error.message || 'The verification link is invalid or has expired.');
      });

    return () => {
      active = false;
    };
  }, [token]);

  const icon = state === 'success'
    ? <CheckCircle2 className="w-12 h-12 text-emerald-600" />
    : state === 'error'
      ? <XCircle className="w-12 h-12 text-red-600" />
      : <LoaderCircle className="w-12 h-12 text-teal-600 animate-spin" />;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
        <div className="mb-5 flex justify-center">{icon}</div>
        <h1 className="text-2xl font-bold text-slate-900">
          {state === 'success' ? 'Email verified' : state === 'error' ? 'Verification failed' : 'Verifying email'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <div className="mt-7 flex flex-col gap-3">
          {state === 'success' && (
            <Button asChild>
              <Link to="/login">Continue to sign in</Link>
            </Button>
          )}
          <Button asChild variant={state === 'success' ? 'outline' : 'default'}>
            <Link to="/">Return to AfriTech Opportunities</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
