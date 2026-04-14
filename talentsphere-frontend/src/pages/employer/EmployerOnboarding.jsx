import React from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerOnboardingHelper from '../../components/auth/EmployerOnboardingHelper';

const EmployerOnboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <EmployerOnboardingHelper onComplete={() => navigate('/employer/dashboard', { replace: true })} />
      </div>
    </div>
  );
};

export default EmployerOnboarding;
