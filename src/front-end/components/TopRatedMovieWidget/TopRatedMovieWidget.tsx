import { useState } from 'react';
import './TopRatedMovieWidget.css';

export interface TopRatedMovie {
  /** Movie title. */
  title: string;
  /** Release year of the movie (null when unknown). */
  releaseYear?: number | null;
  /** Average rating out of 10. */
  rating: number;
  /** Poster image URL (null when unavailable). */
  posterUrl?: string | null;
}

export interface TopRatedMovieWidgetProps {
  /** Highest-rated movie to display (null when no rated movie exists). */
  movie?: TopRatedMovie | null;
  /** Whether the widget data is currently loading. */
  isLoading?: boolean;
  /** Optional error message to display if loading failed. */
  error?: string | null;
}

const ratingFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Displays the highest-rated movie card with poster, title, year and rating.
 */
export default function TopRatedMovieWidget({
  movie = null,
  isLoading = false,
  error = null,
}: TopRatedMovieWidgetProps) {
  const [failedPosterUrl, setFailedPosterUrl] = useState<string | null>(null);

  const posterUrl = movie?.posterUrl ?? null;
  const showPoster = posterUrl !== null && failedPosterUrl !== posterUrl;

  return (
    <article
      className="top-rated-movie-widget"
      aria-label="Film le mieux noté"
      aria-busy={isLoading}
    >
      <h2 className="top-rated-movie-widget-title">Film le mieux noté</h2>

      {isLoading ? (
        <p className="top-rated-movie-widget-status">Chargement...</p>
      ) : error ? (
        <p className="top-rated-movie-widget-error" role="alert">
          {error}
        </p>
      ) : movie === null ? (
        <p className="top-rated-movie-widget-status">Aucun film noté</p>
      ) : (
        <div className="top-rated-movie-widget-body">
          {showPoster ? (
            <img
              className="top-rated-movie-widget-poster"
              src={posterUrl}
              alt={`Affiche de ${movie.title}`}
              onError={() => setFailedPosterUrl(posterUrl)}
            />
          ) : (
            <div
              className="top-rated-movie-widget-poster-placeholder"
              role="img"
              aria-label={`Affiche indisponible pour ${movie.title}`}
            >
              Affiche indisponible
            </div>
          )}

          <div className="top-rated-movie-widget-info">
            <p className="top-rated-movie-widget-movie-title">{movie.title}</p>
            <p className="top-rated-movie-widget-meta">
              {movie.releaseYear ?? 'Année inconnue'}
            </p>
            <p className="top-rated-movie-widget-rating">
              {`${ratingFormatter.format(movie.rating)} / 10`}
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
