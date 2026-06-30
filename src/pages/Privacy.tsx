import { Link } from 'react-router-dom';

/** Page statique d'information sur la confidentialité et le stockage des données. */
export default function Privacy() {
  return (
    <div>
      <div className="page-header">
        <h1>Confidentialité</h1>
        <p className="text-muted">Comment vos données sont stockées et utilisées dans FitTrack Nutrition.</p>
      </div>

      <div className="card section">
        <h3>Quelles données sont stockées ?</h3>
        <p>
          FitTrack Nutrition enregistre uniquement les informations que vous saisissez vous-même :
          votre profil (prénom, sexe, âge, taille, poids, objectif, préférences alimentaires,
          allergies), vos repas, vos séances d'activité, vos pesées, votre programme
          d'entraînement, votre plan alimentaire et vos aliments favoris. Aucune autre donnée
          n'est collectée.
        </p>
      </div>

      <div className="card section">
        <h3>Où sont stockées ces données ?</h3>
        <p>
          Toutes vos données sont enregistrées exclusivement dans le <strong>localStorage</strong> de
          votre navigateur, c'est-à-dire directement sur votre appareil (ordinateur, téléphone,
          tablette). Elles ne sont <strong>jamais envoyées à un serveur</strong>, ni partagées avec
          un tiers, ni utilisées à des fins commerciales ou publicitaires. FitTrack Nutrition
          fonctionne entièrement hors ligne après son premier chargement.
        </p>
        <p className="text-muted">
          Concrètement, cela signifie aussi que vos données restent propres à cet appareil et à ce
          navigateur : si vous changez d'appareil, videz le cache de votre navigateur, ou utilisez
          la navigation privée, vos données ne vous suivront pas automatiquement — pensez à les
          exporter au préalable (voir ci-dessous).
        </p>
      </div>

      <div className="card section">
        <h3>Exporter, importer ou supprimer vos données</h3>
        <p>
          Vous gardez un contrôle total sur vos données depuis la page <Link to="/parametres">Paramètres</Link> :
        </p>
        <ul style={{ listStyle: 'disc', paddingLeft: 'var(--space-5)' }}>
          <li><strong>Exporter</strong> : téléchargez un fichier JSON complet de toutes vos données, pour les conserver ou les transférer sur un autre appareil.</li>
          <li><strong>Importer</strong> : restaurez vos données à partir d'un fichier exporté précédemment (le fichier est vérifié avant d'être appliqué, pour éviter toute donnée corrompue).</li>
          <li><strong>Supprimer</strong> : la « Zone de danger » permet de réinitialiser définitivement toutes vos données stockées sur cet appareil.</li>
        </ul>
        <Link to="/parametres" className="btn btn-primary">Aller aux Paramètres</Link>
      </div>

      <div className="card section">
        <h3>Avertissement médical</h3>
        <p>
          FitTrack Nutrition propose des estimations automatiques (besoins caloriques, macros,
          calories brûlées, ajustements, alertes de sécurité) à titre indicatif uniquement. Ces
          calculs ne constituent en aucun cas un diagnostic, un avis médical ou un suivi
          diététique professionnel. Consultez toujours un médecin, un diététicien ou un coach
          sportif diplômé avant de modifier significativement votre alimentation ou votre activité
          physique, en particulier en cas de doute, de pathologie existante ou de signal d'alerte
          affiché dans l'application.
        </p>
      </div>
    </div>
  );
}
