import { useState } from 'react';
import './MostProfitableMovieWidget.css';

export interface MostProfitableMovie {
  /** Movie title. */
  title: string;
  /** Release year of the movie (null when unknown). */
  releaseYear?: number | null;
  /**
   * Pre-computed return on investment in percent (null when unknown).
   * Note: the exact ROI formula and budget/revenue eligibility rules must be
   * validated and documented before integrating real database values.
   */
  roiPercentage?: number | null;
  /** Poster image URL (null when unavailable). */
  posterUrl?: string | null;
}

export interface MostProfitableMovieWidgetProps {
  /** Highest-ROI eligible movie to display (null when no eligible movie exists). */
  movie?: MostProfitableMovie | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

const roiFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Displays the most profitable movie card with poster, title, year and ROI percentage.
 * Expects pre-computed eligibility and ROI results from the caller.
 */
export default function MostProfitableMovieWidget({
  movie = null,
  isLoading = false,
  error = null,
}: MostProfitableMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const posterUrl = movie?.posterUrl ?? null;
  const showPoster = posterUrl !== null && failedPosterUrl !== posterUrl;

  return (
    <article
      className="most-profitable-movie-widget"
      aria-label="Film le plus rentable"
      aria-busy={isLoading}
    >
      <h2 className="most-profitable-movie-widget-title">
        Film le plus rentable
      </h2>

      {isLoading ? (
        <p className="most-profitable-movie-widget-status">Chargement...</p>
      ) : error ? (
        <p className="most-profitable-movie-widget-error" role="alert">
          {error}
        </p>
      ) : movie === null ? (
        <p className="most-profitable-movie-widget-status">
          Aucun film éligible
        </p>
      ) : (
        <div className="most-profitable-movie-widget-body">
          {showPoster ? (
            <img
              className="most-profitable-movie-widget-poster"
              src={posterUrl}
              alt={`Affiche de ${movie.title}`}
              onError={() => setFailedPosterUrl(posterUrl)}
            />
          ) : (
            <div
              className="most-profitable-movie-widget-poster-placeholder"
              role="img"
              aria-label={`Affiche indisponible pour ${movie.title}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="most-profitable-movie-widget-info">
            <p className="most-profitable-movie-widget-movie-title">
              {movie.title}
            </p>
            <p className="most-profitable-movie-widget-meta">
              {movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="most-profitable-movie-widget-roi">
              {movie.roiPercentage == null
                ? 'ROI inconnu'
                : `${roiFormatter.format(movie.roiPercentage)} % ROI`}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
