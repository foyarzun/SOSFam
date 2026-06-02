import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { 
  Heart, 
  Users, 
  Info, 
  LogOut, 
  AlertOctagon, 
  Loader2 
} from 'lucide-react';
import { 
  auth, 
  logout, 
  subscribeToUserData,
  ensureUserDoc
} from './firebase';
import type { UserDoc } from './firebase';
import { Auth } from './components/Auth';
import { StatusReporter } from './components/StatusReporter';
import { FamilyGroup } from './components/FamilyGroup';
import { EmergencyInfo } from './components/EmergencyInfo';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'family' | 'info'>('status');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setAuthLoading(true);
      } else {
        setUserDoc(null);
        setAuthLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Suscribirse a los datos de Firestore en tiempo real cuando el usuario está logueado
  useEffect(() => {
    if (!user) {
      setFirestoreError(null);
      return;
    }

    const unsubscribeUserDoc = subscribeToUserData(
      user.uid, 
      async (data) => {
        if (!data) {
          // El documento no existe todavía en Firestore (por ejemplo, en un inicio de sesión persistente anterior)
          try {
            await ensureUserDoc(user);
          } catch (err: any) {
            console.error("Error al auto-crear usuario en Firestore:", err);
            setFirestoreError(err.message || String(err));
            setAuthLoading(false);
          }
        } else {
          setUserDoc(data);
          setFirestoreError(null);
          setAuthLoading(false);
        }
      },
      (err) => {
        console.error("Error al suscribirse al documento del usuario:", err);
        setFirestoreError(err.message || String(err));
        setAuthLoading(false);
      }
    );

    return () => unsubscribeUserDoc();
  }, [user]);

  const handleLogout = async () => {
    if (window.confirm('¿Deseas cerrar sesión?')) {
      setAuthLoading(true);
      try {
        await logout();
      } catch (err) {
        console.error("Error al cerrar sesión:", err);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Pantalla de carga inicial
  if (authLoading) {
    return (
      <div className="app-viewport animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="loading-viewport">
          <Loader2 className="spinner" size={40} style={{ animationDuration: '1s', color: 'var(--color-accent)' }} />
          <span className="loading-text">Cargando SOSFam...</span>
        </div>
      </div>
    );
  }

  // Si hay un error de conexión con la base de datos Firestore
  if (user && firestoreError) {
    return (
      <div className="app-viewport animate-fade-in" style={{ padding: '40px 24px', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div className="auth-hero-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
          <AlertOctagon size={48} style={{ color: 'var(--color-help)' }} />
        </div>
        <h1 className="auth-title" style={{ fontSize: '1.6rem' }}>Error de Base de Datos</h1>
        <p className="auth-subtitle" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
          Hemos iniciado sesión con tu cuenta de Google (<strong>{user.email}</strong>), pero no pudimos conectar con la base de datos de Firestore.
        </p>
        
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '16px',
          color: 'var(--color-help)',
          fontSize: '0.85rem',
          textAlign: 'left',
          fontFamily: 'monospace',
          wordBreak: 'break-all',
          marginBottom: '24px',
          width: '100%'
        }}>
          {firestoreError}
        </div>

        <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '30px', lineHeight: '1.5' }}>
          <p style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)' }}>Posibles soluciones:</p>
          <ol style={{ paddingLeft: '20px' }}>
            <li>Asegúrate de haber creado la base de datos **Cloud Firestore** en tu consola de Firebase.</li>
            <li>Verifica que las reglas de seguridad estén publicadas y permitan el acceso (puedes usar el archivo `firestore.rules`).</li>
            <li>Recarga la aplicación después de realizar los ajustes.</li>
          </ol>
        </div>

        <button className="btn-primary" onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', boxShadow: 'none' }}>
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    );
  }

  // Si no hay sesión iniciada, mostrar pantalla de autenticación
  if (!user || !userDoc) {
    return (
      <div className="app-viewport">
        <Auth />
      </div>
    );
  }

  return (
    <div className="app-viewport">
      {/* Cabecera */}
      <header className="app-header">
        <div className="app-logo">
          <span>SOS</span>Fam
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {userDoc.photoURL ? (
            <img 
              src={userDoc.photoURL} 
              alt={userDoc.name} 
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          ) : (
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'var(--color-accent-gradient)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}
            >
              {userDoc.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '50%',
              transition: 'var(--transition-smooth)'
            }}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Navegación por pestañas (Tabs) */}
      <nav className="app-tabs">
        <button 
          className={`tab-btn ${activeTab === 'status' ? 'active' : ''}`}
          onClick={() => setActiveTab('status')}
        >
          <Heart size={16} />
          <span>Reportar</span>
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'family' ? 'active' : ''}`}
          onClick={() => setActiveTab('family')}
        >
          <Users size={16} />
          <span>Mi Familia</span>
        </button>
        
        <button 
          className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <Info size={16} />
          <span>Guía SOS</span>
        </button>
      </nav>

      {/* Contenido Principal según Pestaña Activa */}
      <main style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'status' && <StatusReporter userDoc={userDoc} />}
        {activeTab === 'family' && <FamilyGroup userDoc={userDoc} />}
        {activeTab === 'info' && <EmergencyInfo />}
      </main>

      {/* Footer minimalista indicando estado global */}
      {userDoc.lastStatus === 'help' && (
        <div style={{
          background: 'var(--color-help-gradient)',
          color: '#fff',
          padding: '10px',
          textAlign: 'center',
          fontSize: '0.8rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 -4px 15px var(--color-help-glow)',
          animation: 'pulse-help 2s infinite'
        }}>
          <AlertOctagon size={14} />
          <span>Tienes una alerta de ayuda activa</span>
        </div>
      )}
    </div>
  );
}
