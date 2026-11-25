import './TopCountryWidget.css';

export interface TopCountryWidgetProps {
  /** Name of the most represented production country (null when unknown). */
  countryName?: string | null;
  /** Number of distinct movies associated with this country (pre-computed). */
  moviesCount?: number | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

/**
 * Displays the most represented production country and its movie count.
 */
export default function TopCountryWidget({
  countryName = null,
  moviesCount = null,
  isLoading = false,
  error = null,
}: TopCountryWidgetProps) {
  return (
    <article
      className="top-country-widget"
      aria-label="Pays le plus représenté"
      aria-busy={isLoading}
    >
      <h2 className="top-country-widget-title">Pays le plus représenté</h2>

      {isLoading ? (
        <p className="top-country-widget-status">Chargement...</p>
      ) : error ? (
        <p className="top-country-widget-error" role="alert">
          {error}
        </p>
      ) : !countryName || moviesCount === null ? (
        <p className="top-country-widget-status">Aucun pays connu</p>
      ) : (
        <div className="top-country-widget-body">
          <p className="top-country-widget-value">{countryName}</p>
          <p className="top-country-widget-caption">
            {`${moviesCount.toLocaleString('fr-FR')} ${moviesCount === 1 ? 'film' : 'films'}`}
          </p>
        </div>
      )}
    </article>
  );
}
