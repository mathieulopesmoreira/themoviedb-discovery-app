import './DashboardPage.css';

export default function DashboardPage() {
  return (
    <main className="app-shell dashboard-page">
      <header className="dashboard-hero">
        <p className="dashboard-eyebrow">TMDB Discovery</p>
        <h1>Tableau de bord des films</h1>
        <p className="dashboard-intro">
          Visualisez les indicateurs clés, les genres et les pays de production
          des films du catalogue.
        </p>
      </header>

      <section
        className="dashboard-content"
        aria-labelledby="dashboard-content-title"
      >
        <h2 id="dashboard-content-title" className="visually-hidden">
          Widgets du tableau de bord
        </h2>
        <div className="dashboard-empty-state">
          <p>Aucun widget n'est encore configuré.</p>
        </div>
      </section>
    </main>
  );
}
