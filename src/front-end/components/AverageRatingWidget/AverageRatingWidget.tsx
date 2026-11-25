import './AverageRatingWidget.css';

export interface AverageRatingWidgetProps {
  /** Simple unweighted average rating out of 10 across rated movies (null when no rating is available). */
  averageRating?: number | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Displays the simple average rating of movies in the catalog on a / 10 scale.
 */
export default function AverageRatingWidget({
  averageRating = null,
  isLoading = false,
  error = null,
}: AverageRatingWidgetProps) {
  return (
    <article
      className="average-rating-widget"
      aria-label="Note moyenne"
      aria-busy={isLoading}
    >
      <h2 className="average-rating-widget-title">Note moyenne</h2>

      {isLoading ? (
        <p className="average-rating-widget-status">Chargement...</p>
      ) : error ? (
        <p className="average-rating-widget-error" role="alert">
          {error}
        </p>
      ) : averageRating === null ? (
        <p className="average-rating-widget-status">Aucune note disponible</p>
      ) : (
        <div className="average-rating-widget-body">
          <p className="average-rating-widget-value">
            {`${ratingFormatter.format(averageRating)} / 10`}
          </p>
          <p className="average-rating-widget-caption">
            Moyenne simple des notes
          </p>
        </div>
      )}
    </article>
  );
}
