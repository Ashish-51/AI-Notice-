import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import ForgotPassword from './ForgotPassword';

type View = 'login' | 'signup' | 'forgot' | 'complete-profile';

export default function AuthPage({ initialView = 'login' }: { initialView?: View }) {
  const [currentView, setCurrentView] = useState<View>(initialView);

  return (
    <>
      {currentView === 'login' && (
        <Login 
          onSwitchToSignup={() => setCurrentView('signup')} 
          onSwitchToForgot={() => setCurrentView('forgot')} 
        />
      )}
      {currentView === 'signup' && (
        <Signup 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}
      {currentView === 'forgot' && (
        <ForgotPassword 
          onBack={() => setCurrentView('login')} 
        />
      )}
      {currentView === 'complete-profile' && (
        <Signup 
          onSwitchToLogin={() => setCurrentView('login')} 
        />
      )}
    </>
  );
}
