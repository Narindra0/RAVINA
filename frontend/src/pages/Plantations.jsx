import { useEffect, useState } from 'react';
import { api } from '../lib/axios';
import Sidebar from './Sidebar';
import '../styles/Plantations.styles.css';

export default function Plantations() {
  const [plantations, setPlantations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlantations() {
      try {
        const response = await api.get('/plantations', {
          headers: {
            Accept: 'application/ld+json',
          },
        });
        const payload = response.data;

        const plantationsList = Array.isArray(payload)
          ? payload
          : payload?.['hydra:member'] ?? payload?.member ?? payload ?? [];

        setPlantations(Array.isArray(plantationsList) ? plantationsList : []);
      } catch (err) {
        setError("Impossible de charger vos plantations.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlantations();
  }, []);

  return (
    <div className="plantations-page">
      <Sidebar />
      <main className="plantations-content">
        <header className="plantations-header">
          <h1>Mes Plantations</h1>
        </header>

        {loading && <p>Chargement…</p>}
        {error && <p className="error-message">{error}</p>}

        <section className="plantations-list">
          {plantations.map((plantation) => {
            const template = plantation.plantTemplate;
            const snapshot = plantation.suiviSnapshots?.[0];

            return (
              <article
                key={plantation['@id'] ?? plantation.id ?? Math.random()}
                className="plantation-card"
              >
                <h2>{template?.name ?? 'Plantation'}</h2>
                <p className="plantation-meta">
                  <strong>Type :</strong> {template?.type ?? 'N/A'}
                </p>
                <p className="plantation-meta">
                  <strong>Localisation :</strong> {plantation.localisation}
                </p>
                <p className="plantation-meta">
                  <strong>Statut :</strong> {plantation.etatActuel}
                </p>

                {snapshot && (
                  <div className="plantation-snapshot">
                    <p>
                      <strong>Progression :</strong> {snapshot.progressionPourcentage}% ({snapshot.stadeActuel})
                    </p>
                    <p>
                      <strong>Prochain arrosage :</strong>{' '}
                      {new Date(snapshot.arrosageRecoDate).toLocaleDateString()} — {snapshot.arrosageRecoQuantiteMl} ml
                    </p>
                  </div>
                )}
              </article>
            );
          })}

          {plantations.length === 0 && !loading && !error && (
            <p>Vous n'avez pas encore créé de plantation.</p>
          )}
        </section>
      </main>
    </div>
  );
}
