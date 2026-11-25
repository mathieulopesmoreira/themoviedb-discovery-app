import './AverageRuntimeWidget.css';

export interface AverageRuntimeWidgetProps {
  /** Average runtime in minutes, computed across movies with a valid runtime (null when unavailable). */
  averageRuntime?: number | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

/**
 * Displays the average runtime of movies in the catalog.
 */
export default function AverageRuntimeWidget({
  averageRuntime = null,
  isLoading = false,
  error = null,
}: AverageRuntimeWidgetProps) {
  return (
    <article
      className="average-runtime-widget"
      aria-label="Durée moyenne"
      aria-busy={isLoading}
    >
      <h2 className="average-runtime-widget-title">Durée moyenne</h2>

      {isLoading ? (
        <p className="average-runtime-widget-status">Chargement...</p>
      ) : error ? (
        <p className="average-runtime-widget-error" role="alert">
          {error}
        </p>
      ) : averageRuntime === null ? (
        <p className="average-runtime-widget-status">Donnée indisponible</p>
      ) : (
        <div className="average-runtime-widget-body">
          <p className="average-runtime-widget-value">
            {`${Math.round(averageRuntime).toLocaleString('fr-FR')} min`}
          </p>
          <p className="average-runtime-widget-caption">
            Sur les films avec durée renseignée
          </p>
        </div>
      )}
    </article>
  );
}
