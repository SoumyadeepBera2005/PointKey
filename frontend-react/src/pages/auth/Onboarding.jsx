import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem('prent_onboarding_done', '1');
    const token = localStorage.getItem('prent_token');
    if (token && user) {
      if (user.role === 'OWNER') navigate('/owner', { replace: true });
      else if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else navigate('/tenant', { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  return null;
}
