import { useNavigate } from 'react-router-dom';
import TeamFigmaApp from '../../../src/App.tsx';
import '../../../src/index.css';

export default function TeamFigmaLanding() {
  const navigate = useNavigate();
  return <TeamFigmaApp onLogin={() => navigate('/sign-in')} onSignup={() => navigate('/sign-up')} />;
}
