import { useState } from 'react';
import './MostPopularMovieWidget.css';

export interface MostPopularMovie {
  /** Movie title. */
  title: string;
  /** Release year of the movie (null when unknown). */
  releaseYear?: number | null;
  /** TMDB popularity index (not a / 10 rating or vote count; null when unknown). */
  popularity?: number | null;
  /** Poster image URL (null when unavailable). */
  posterUrl?: string | null;
}

export interface MostPopularMovieWidgetProps {
  /** Most popular movie to display (null when unavailable). */
  movie?: MostPopularMovie | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

const popularityFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Displays the most popular movie card with poster, title, year and popularity index.
 */
export default function MostPopularMovieWidget({
  movie = null,
  isLoading = false,
  error = null,
}: MostPopularMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const posterUrl = movie?.posterUrl ?? null;
  const showPoster = posterUrl !== null && failedPosterUrl !== posterUrl;

  return (
    <article
      className="most-popular-movie-widget"
      aria-label="Film le plus populaire"
      aria-busy={isLoading}
    >
      <h2 className="most-popular-movie-widget-title">
        Film le plus populaire
      </h2>

      {isLoading ? (
        <p className="most-popular-movie-widget-status">Chargement...</p>
      ) : error ? (
        <p className="most-popular-movie-widget-error" role="alert">
          {error}
        </p>
      ) : movie === null ? (
        <p className="most-popular-movie-widget-status">
          Aucun film disponible
        </p>
      ) : (
        <div className="most-popular-movie-widget-body">
          {showPoster ? (
            <img
              className="most-popular-movie-widget-poster"
              src={posterUrl}
              alt={`Affiche de ${movie.title}`}
              onError={() => setFailedPosterUrl(posterUrl)}
            />
          ) : (
            <div
              className="most-popular-movie-widget-poster-placeholder"
              role="img"
              aria-label={`Affiche indisponible pour ${movie.title}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="most-popular-movie-widget-info">
            <p className="most-popular-movie-widget-movie-title">
              {movie.title}
            </p>
            <p className="most-popular-movie-widget-meta">
              {movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="most-popular-movie-widget-popularity">
              {movie.popularity == null
                ? 'Popularité inconnue'
                : `${popularityFormatter.format(movie.popularity)} popularité`}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
