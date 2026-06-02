import React from 'react';
import { Phone, BookOpen, AlertOctagon, ShieldCheck } from 'lucide-react';

export const EmergencyInfo: React.FC = () => {
  const emergencyPhones = [
    { number: '133', label: 'Carabineros (Policía)', desc: 'Emergencias de seguridad pública' },
    { number: '132', label: 'Bomberos', desc: 'Rescates e incendios' },
    { number: '131', label: 'SAMU (Ambulancia)', desc: 'Urgencias médicas' },
    { number: '137', label: 'Rescate Marítimo', desc: 'Emergencias en costas o lagos' },
  ];

  return (
    <div className="emergency-section animate-slide-up">
      {/* Teléfonos de Emergencia */}
      <div style={{ marginBottom: '10px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Phone size={20} style={{ color: 'var(--color-help)' }} />
          Llamada Rápida de Emergencia
        </h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
          Toca cualquier número para iniciar la llamada directamente en tu celular.
        </p>
      </div>

      <div className="emergency-numbers-grid">
        {emergencyPhones.map((phone) => (
          <a key={phone.number} href={`tel:${phone.number}`} className="emergency-phone-card">
            <div className="emergency-phone-number">{phone.number}</div>
            <div className="emergency-phone-label">{phone.label}</div>
          </a>
        ))}
      </div>

      <hr style={{ border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)', margin: '10px 0' }} />

      {/* Consejos ante Desastres */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <BookOpen size={20} style={{ color: 'var(--color-warning)' }} />
          ¿Qué hacer durante una catástrofe?
        </h2>
        
        <div className="tips-container">
          {/* Mochila de Emergencia */}
          <div className="tip-card">
            <div className="tip-title">
              <ShieldCheck size={16} />
              Kit de Emergencia Esencial
            </div>
            <div className="tip-content">
              Prepara un bolso con:
              <ul>
                <li>Agua embotellada (2 litros por persona al día)</li>
                <li>Comida enlatada o barras energéticas</li>
                <li>Linterna con pilas de repuesto y silbato</li>
                <li>Radio portátil FM/AM</li>
                <li>Botiquín de primeros auxilios y medicamentos básicos</li>
              </ul>
            </div>
          </div>

          {/* Sismos */}
          <div className="tip-card">
            <div className="tip-title">
              <AlertOctagon size={16} />
              Sismos y Terremotos
            </div>
            <div className="tip-content">
              <ul>
                <li><strong>Conserva la calma</strong> y ubícate en un Lugar de Protección Sísmica (debajo de vigas o mesas resistentes).</li>
                <li><strong>Aléjate de ventanas</strong>, espejos y objetos colgantes que puedan caer.</li>
                <li><strong>Si estás al aire libre</strong>, aléjate de edificios, cables eléctricos y postes.</li>
                <li>Si estás en zona costera y el sismo dificulta mantenerse en pie, evacua de inmediato hacia zonas altas (cota 30).</li>
              </ul>
            </div>
          </div>

          {/* Inundaciones */}
          <div className="tip-card">
            <div className="tip-title">
              <AlertOctagon size={16} />
              Inundaciones y Aluviones
            </div>
            <div className="tip-content">
              <ul>
                <li><strong>Corta los suministros</strong> de energía eléctrica y gas antes de evacuar.</li>
                <li><strong>Evacua hacia zonas de altura</strong> preestablecidas por las autoridades.</li>
                <li><strong>No camines ni conduzcas</strong> por calles inundadas o cauces de ríos (pueden tener corrientes traicioneras).</li>
                <li>Mantente informado únicamente por canales oficiales y radios portátiles.</li>
              </ul>
            </div>
          </div>

          {/* Incendios */}
          <div className="tip-card">
            <div className="tip-title">
              <AlertOctagon size={16} />
              Incendios Forestales
            </div>
            <div className="tip-content">
              <ul>
                <li><strong>Evacua de inmediato</strong> si la autoridad lo indica. No te quedes a proteger cosas materiales.</li>
                <li><strong>Cúbrete la boca y la nariz</strong> con un paño húmedo para no respirar humo tóxico.</li>
                <li>Si evacuas en auto, conduce con luces encendidas y a velocidad prudente debido a la visibilidad reducida por el humo.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
