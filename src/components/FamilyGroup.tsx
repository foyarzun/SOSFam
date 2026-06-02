import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Plus, 
  MapPin, 
  LogOut, 
  Copy, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { 
  createFamilyGroup, 
  joinFamilyGroup, 
  leaveFamilyGroup,
  subscribeToFamilyMembers,
  subscribeToGroupDetails
} from '../firebase';
import type { UserDoc, GroupDoc } from '../firebase';

interface FamilyGroupProps {
  userDoc: UserDoc;
}

export const FamilyGroup = ({ userDoc }: FamilyGroupProps) => {
  // Estado para creación/unión
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupCodeInput, setGroupCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para cuando ya están en un grupo
  const [groupDetails, setGroupDetails] = useState<GroupDoc | null>(null);
  const [members, setMembers] = useState<UserDoc[]>([]);
  const [copied, setCopied] = useState(false);

  // Efecto para escuchar detalles del grupo y miembros
  useEffect(() => {
    if (!userDoc.groupId) {
      setGroupDetails(null);
      setMembers([]);
      return;
    }

    // Suscribirse a detalles del grupo
    const unsubGroup = subscribeToGroupDetails(userDoc.groupId, (group) => {
      setGroupDetails(group);
    });

    // Suscribirse a miembros de la familia
    const unsubMembers = subscribeToFamilyMembers(userDoc.groupId, (familyMembers) => {
      // Ordenar: primero los que necesitan ayuda ('help'), luego 'unknown', y al final 'safe'
      const sorted = [...familyMembers].sort((a, b) => {
        const order = { 'help': 0, 'unknown': 1, 'safe': 2 };
        return (order[a.lastStatus] || 2) - (order[b.lastStatus] || 2);
      });
      setMembers(sorted);
    });

    return () => {
      unsubGroup();
      unsubMembers();
    };
  }, [userDoc.groupId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupNameInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await createFamilyGroup(userDoc.uid, groupNameInput.trim());
      setGroupNameInput('');
    } catch (err: any) {
      console.error(err);
      setError('Error al crear el grupo. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupCodeInput.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await joinFamilyGroup(userDoc.uid, groupCodeInput.trim());
      setGroupCodeInput('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al unirte al grupo familiar.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('¿Seguro que deseas salir de este grupo familiar? Dejarás de compartir tu estado con ellos.')) {
      return;
    }
    try {
      await leaveFamilyGroup(userDoc.uid);
    } catch (err) {
      console.error("Error al salir del grupo:", err);
    }
  };

  const copyCode = () => {
    if (!groupDetails) return;
    navigator.clipboard.writeText(groupDetails.groupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Sin datos';
    const seconds = Math.floor((new Date().getTime() - timestamp.toDate().getTime()) / 1000);
    
    if (seconds < 60) return 'Hace un momento';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;
    return timestamp.toDate().toLocaleDateString();
  };

  // VISTA 1: El usuario NO pertenece a ningún grupo familiar
  if (!userDoc.groupId) {
    return (
      <div className="group-section animate-slide-up">
        <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
          <Users size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Grupo Familiar</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Crea una red familiar o únete a una existente para compartir estados y ubicaciones en tiempo real.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-help)',
            padding: '12px',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.85rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Formulario 1: Crear Grupo */}
        <div className="glass-panel group-setup-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Crear Nueva Red Familiar</h3>
          </div>
          <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              className="group-setup-input"
              placeholder="Ej: Familia Soto Valenzuela"
              value={groupNameInput}
              onChange={(e) => setGroupNameInput(e.target.value)}
              disabled={loading}
              required
            />
            <button className="btn-primary" type="submit" disabled={loading || !groupNameInput.trim()}>
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Crear y Crear Código'}
            </button>
          </form>
        </div>

        <div className="or-divider">o también</div>

        {/* Formulario 2: Unirse por Código */}
        <div className="glass-panel group-setup-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <UserPlus size={20} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Unirse a Red con Código</h3>
          </div>
          <form onSubmit={handleJoinGroup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              className="group-setup-input"
              placeholder="Ingresa código (Ej: X9J4B2)"
              value={groupCodeInput}
              onChange={(e) => setGroupCodeInput(e.target.value)}
              maxLength={10}
              disabled={loading}
              required
            />
            <button 
              className="btn-primary" 
              style={{ background: 'var(--color-warning-gradient)', boxShadow: '0 4px 20px var(--color-warning-glow)' }}
              type="submit" 
              disabled={loading || !groupCodeInput.trim()}
            >
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Unirme a la Familia'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // VISTA 2: El usuario SI pertenece a un grupo familiar
  return (
    <div className="group-section animate-slide-up">
      {/* Cabecera del Grupo */}
      <div className="family-header-details">
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>{groupDetails?.groupName || 'Cargando Familia...'}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>
            Miembros activos en la red
          </p>
        </div>
        <button onClick={handleLeaveGroup} title="Salir del grupo">
          <LogOut size={16} />
          <span>Salir</span>
        </button>
      </div>

      {/* Código de Compartir */}
      {groupDetails && (
        <div className="group-code-display">
          <div className="group-code-value">{groupDetails.groupCode}</div>
          <div className="group-code-sub">Comparte este código para agregar familiares</div>
          <button 
            onClick={copyCode}
            style={{
              position: 'absolute',
              right: '12px',
              bottom: '12px',
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
          >
            {copied ? <Check size={16} style={{ color: 'var(--color-safe)' }} /> : <Copy size={16} />}
          </button>
        </div>
      )}

      {/* Lista de Miembros en Tiempo Real */}
      <div className="members-list">
        {members.map((member) => {
          const isCurrentUser = member.uid === userDoc.uid;
          
          return (
            <div 
              key={member.uid} 
              className={`member-card status-${member.lastStatus} animate-fade-in`}
            >
              <div className="member-info">
                {member.photoURL ? (
                  <img src={member.photoURL} alt={member.name} className="member-avatar" />
                ) : (
                  <div className="member-avatar-placeholder">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="member-details">
                  <span className="member-name">
                    {member.name} {isCurrentUser && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(Tú)</span>}
                  </span>
                  
                  {member.statusComment ? (
                    <span className="member-status-comment">"{member.statusComment}"</span>
                  ) : (
                    member.lastStatus === 'help' && <span className="member-status-comment" style={{ color: 'var(--color-help)', fontWeight: 600 }}>Requiere ayuda inmediata</span>
                  )}
                  
                  <span className="member-updated-time">
                    Act: {getTimeAgo(member.lastUpdated)}
                  </span>
                </div>
              </div>

              <div className="member-status-badge-container">
                {member.lastStatus === 'safe' && <span className="badge safe">Bien</span>}
                {member.lastStatus === 'help' && (
                  <span className="badge help" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    Ayuda
                  </span>
                )}
                {member.lastStatus === 'unknown' && <span className="badge unknown">Pendiente</span>}

                {member.location && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${member.location.latitude},${member.location.longitude}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="gps-link"
                  >
                    <MapPin size={12} />
                    <span>Ver Mapa</span>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
