import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './styles/auth_view.css';

export default function AuthView() {
  const [isLogin, setIsLogin] = useState(true);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const auth = useAuth();
  const navigate = useNavigate();

  const handleStandardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const data = await apiFetch('/api/user/login', {
              method: 'POST',
              body: JSON.stringify({ login, password })
            });

            const decoded: any = jwtDecode(data.token);

            console.log("Decoded JWT:", decoded);

            auth.login(data.token, {
              username: decoded.username || decoded.login || login,
              role: decoded.role
            });

            if (decoded.role === 'admin') {
              navigate('/admin/stations');
            } else {
              navigate('/map');
            }
      } else {
        await apiFetch('/api/user/register', {
          method: 'POST',
          body: JSON.stringify({ login, password, username })
        });
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd podczas autentykacji.');
    }
  };

const handleOAuthSuccess = async (credentialResponse: CredentialResponse) => {
      try {
        const data = await apiFetch('/api/user/oauth', {
          method: 'POST',
          body: JSON.stringify({ credential: credentialResponse.credential })
        });

        const decoded: any = jwtDecode(data.token);
        auth.login(data.token, {
          username: decoded.username,
          role: decoded.role
        });
        navigate('/');
      } catch (err: any) {
        setError('Błąd autoryzacji Google.');
      }
    };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Logowanie' : 'Rejestracja'}</h1>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleStandardSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nazwa użytkownika"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          )}
          <input
            type="text"
            placeholder="Login"
            value={login}
            onChange={e => setLogin(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="btn-primary">
            {isLogin ? 'Zaloguj' : 'Zarejestruj się'}
          </button>
        </form>

        <div className="auth-divider">
          <span>LUB</span>
        </div>

        <div className="oauth-container">
          <GoogleLogin
            onSuccess={handleOAuthSuccess}
            onError={() => setError('Logowanie Google nie powiodło się')}
            useOneTap
          />
        </div>

        <button className="btn-link" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Nie masz konta? Zarejestruj się' : 'Masz już konto? Zaloguj się'}
        </button>
      </div>
    </div>
  );
}