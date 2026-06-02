import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { loginWithGoogle } from '../firebase';

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Error completo de autenticación:", err);
      const errorCodeMsg = err.code ? ` [Código: ${err.code}]` : '';
      const detailedMessage = err.message || 'Error desconocido';
      setError(`Error al iniciar sesión con Google: ${detailedMessage}${errorCodeMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-hero-icon">
        <AlertTriangle size={48} />
      </div>
      
      <h1 className="auth-title">SOSFam</h1>
      <p className="auth-subtitle">
        Red de Bienestar Familiar para Emergencias.
        Confirma que estás a salvo y mantente al tanto del estado de tu familia durante desastres naturales.
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: 'var(--color-help)',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '20px',
          width: '100%',
          textAlign: 'center'
        }}>
          {error}
        </div>
      )}

      <button 
        className="btn-primary btn-google" 
        onClick={handleGoogleLogin}
        disabled={loading}
      >
        {loading ? (
          <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
        ) : (
          <>
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
            />
            <span>Ingresar con Google</span>
          </>
        )}
      </button>
    </div>
  );
};
