import { useState, useEffect } from 'react';
import { ShieldCheck, HeartHandshake, MapPin, Loader, AlertTriangle } from 'lucide-react';
import { updateUserStatus } from '../firebase';
import type { UserDoc } from '../firebase';

interface StatusReporterProps {
  userDoc: UserDoc;
}

export const StatusReporter = ({ userDoc }: StatusReporterProps) => {
  const [comment, setComment] = useState(userDoc.statusComment || '');
  const [shareGps, setShareGps] = useState(true);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState<'safe' | 'help' | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Sincronizar el comentario inicial si cambia el usuario o el documento
  useEffect(() => {
    setComment(userDoc.statusComment || '');
  }, [userDoc.statusComment]);

  const handleReportStatus = async (status: 'safe' | 'help') => {
    setLoading(status);
    setMessage(null);
    setGpsStatus('idle');

    let location: { latitude: number; longitude: number; accuracy?: number } | undefined = undefined;

    if (shareGps && navigator.geolocation) {
      setGpsStatus('fetching');
      try {
        location = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setGpsStatus('success');
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy
              });
            },
            (error) => {
              console.warn("Error de geolocalización:", error);
              setGpsStatus('error');
              resolve(undefined); // Continuar sin ubicación
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      } catch (err) {
        setGpsStatus('error');
      }
    }

    try {
      await updateUserStatus(userDoc.uid, status, comment, location);
      setMessage({
        type: 'success',
        text: `Estado reportado con éxito: "${status === 'safe' ? 'Estoy Bien' : 'Necesito Ayuda'}"`
      });
      // Limpiar mensaje después de unos segundos
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'error',
        text: 'Error al actualizar el estado. Inténtalo de nuevo.'
      });
    } finally {
      setLoading(null);
    }
  };

  const getStatusText = (status: 'safe' | 'help' | 'unknown') => {
    switch (status) {
      case 'safe': return 'A salvo / Bien';
      case 'help': return 'Necesita Ayuda';
      default: return 'Sin Reportar / Desconocido';
    }
  };

  const getStatusClass = (status: 'safe' | 'help' | 'unknown') => {
    switch (status) {
      case 'safe': return 'status-safe';
      case 'help': return 'status-help';
      default: return 'status-unknown';
    }
  };

  return (
    <div className="status-section animate-slide-up">
      {/* Resumen del perfil actual */}
      <div className={`user-profile-summary ${getStatusClass(userDoc.lastStatus)}`}>
        {userDoc.photoURL ? (
          <img src={userDoc.photoURL} alt={userDoc.name} className="avatar" />
        ) : (
          <div className="avatar-placeholder">
            {userDoc.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="user-meta">
          <h3>{userDoc.name}</h3>
          <p>Tu estado actual: <strong>{getStatusText(userDoc.lastStatus)}</strong></p>
          {userDoc.lastUpdated && (
            <p style={{ fontSize: '0.75rem', marginTop: '2px' }}>
              Última actualización: {userDoc.lastUpdated.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      </div>

      {/* Botones de reporte de estado */}
      <div className="status-buttons-container">
        {/* BOTÓN ESTOY BIEN */}
        <button 
          className="status-action-card safe"
          onClick={() => handleReportStatus('safe')}
          disabled={loading !== null}
        >
          {userDoc.lastStatus === 'safe' && (
            <div className="status-active-badge safe-badge">Activo</div>
          )}
          <div className="status-card-header">
            <div className="status-card-title">Estoy Bien</div>
            <div className="status-card-icon">
              {loading === 'safe' ? (
                <Loader className="spinner" style={{ animationDuration: '1s' }} />
              ) : (
                <ShieldCheck size={28} />
              )}
            </div>
          </div>
          <div className="status-card-desc">
            Haz clic aquí para confirmar que te encuentras a salvo y fuera de peligro inmediato.
          </div>
        </button>

        {/* BOTÓN NECESITO AYUDA */}
        <button 
          className="status-action-card help"
          onClick={() => handleReportStatus('help')}
          disabled={loading !== null}
        >
          {userDoc.lastStatus === 'help' && (
            <div className="status-active-badge help-badge">Alerta Activa</div>
          )}
          <div className="status-card-header">
            <div className="status-card-title">Necesito Ayuda</div>
            <div className="status-card-icon">
              {loading === 'help' ? (
                <Loader className="spinner" style={{ animationDuration: '1s' }} />
              ) : (
                <HeartHandshake size={28} />
              )}
            </div>
          </div>
          <div className="status-card-desc">
            Alerta a tus seres queridos si requieres asistencia urgente, rescate, o insumos.
          </div>
        </button>
      </div>

      {/* Opciones y detalles */}
      <div className="comment-input-area">
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          Mensaje o Estado Corto (Opcional)
        </label>
        <textarea
          className="comment-textarea"
          placeholder="Ej: Estoy en el refugio central, no hay luz pero tengo agua."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="gps-toggle" onClick={() => setShareGps(!shareGps)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="checkbox" 
              checked={shareGps}
              onChange={() => {}} // Manejado por el click en el div contenedor
              style={{ cursor: 'pointer' }}
            />
            Compartir mi ubicación GPS exacta al reportar
          </span>

          <div className={`gps-status ${gpsStatus}`}>
            {gpsStatus === 'fetching' && (
              <>
                <Loader size={14} className="spinner" style={{ animationDuration: '1s' }} />
                <span>Buscando...</span>
              </>
            )}
            {gpsStatus === 'success' && (
              <>
                <MapPin size={14} />
                <span>GPS Listo</span>
              </>
            )}
            {gpsStatus === 'error' && (
              <>
                <AlertTriangle size={14} />
                <span>GPS Error</span>
              </>
            )}
          </div>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          color: message.type === 'success' ? 'var(--color-safe)' : 'var(--color-help)',
          padding: '12px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '0.85rem',
          textAlign: 'center',
          animation: 'fade-in 0.3s ease'
        }}>
          {message.text}
        </div>
      )}
    </div>
  );
};
