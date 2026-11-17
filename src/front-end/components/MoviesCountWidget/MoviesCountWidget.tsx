import './MoviesCountWidget.css';

export interface MoviesCountWidgetProps {
  /** Number of movies currently stored in the database. */
  count?: number | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

/**
 * Displays the total number of movies stored in the database.
 */
export default function MoviesCountWidget({
  count = null,
  isLoading = false,
  error = null,
}: MoviesCountWidgetProps) {
  return (
    <article
      className="movies-count-widget"
      aria-label="Films en base"
      aria-busy={isLoading}
    >
      <h2 className="movies-count-widget-title">Films en base</h2>

      {isLoading ? (
        <p className="movies-count-widget-status">Chargement...</p>
      ) : error ? (
        <p className="movies-count-widget-error" role="alert">
          {error}
        </p>
      ) : count === null ? (
        <p className="movies-count-widget-status">Donnée indisponible</p>
      ) : (
        <div className="movies-count-widget-body">
          <p className="movies-count-widget-value">
            {count.toLocaleString('fr-FR')}
          </p>
          <p className="movies-count-widget-caption">
            {count === 0
              ? 'Aucun film en base'
              : count === 1
                ? 'film enregistré'
                : 'films enregistrés'}
          </p>
        </div>
      )}
    </article>
  );
}
