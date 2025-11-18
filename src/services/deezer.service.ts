import { Injectable } from '@angular/core';
import { forkJoin, from, of, throwError, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { MusicDataService, Album, Track, AlbumData } from './music-data.service';

@Injectable({ providedIn: 'root' })
export class DeezerService extends MusicDataService {
  private readonly deezerApiUrl = 'https://api.deezer.com';

  override getAlbumAndArtistInfo(artist: string, album: string): Observable<AlbumData> {
    // Correctly combine artist and album for a better search query
    const query = `${artist} ${album}`;
    const searchUrl = `${this.deezerApiUrl}/search/album?q=${encodeURIComponent(query)}`;

    return from(this.jsonpFetch(searchUrl)).pipe(
      switchMap((searchData: any) => {
        if (searchData.error) {
            return throwError(() => new Error(`Deezer API Error: ${searchData.error.message}`));
        }
        if (!searchData.data || searchData.data.length === 0) {
          return throwError(() => new Error('Album not found on Deezer'));
        }
        // Assume the first result is the best match
        const deezerAlbum = searchData.data[0];

        // Fetch full tracklist and artist details in parallel
        const tracks$ = from(this.jsonpFetch(deezerAlbum.tracklist));
        const artistImage$ = from(this.jsonpFetch(`${this.deezerApiUrl}/artist/${deezerAlbum.artist.id}`)).pipe(
            map((artistData: any) => this.findBestDeezerImage(artistData, 'picture')),
            catchError(() => of(null)) // If artist image fails, continue without it
        );

        return forkJoin({tracks: tracks$, artistImage: artistImage$}).pipe(
          map(({tracks, artistImage}) => {
              const albumTracks: Track[] = (tracks.data || []).map((t: any) => ({
                  name: t.title,
                  duration: +t.duration
              }));

              if (albumTracks.length === 0) {
                  throw new Error('Deezer album found, but has no tracklist.');
              }

              const resultAlbum: Album = {
                  artist: deezerAlbum.artist.name,
                  name: deezerAlbum.title,
                  coverUrl: this.findBestDeezerImage(deezerAlbum, 'cover') || `https://picsum.photos/seed/${encodeURIComponent(artist + album)}/1080/1080`,
                  tracks: albumTracks,
              };

              return { album: resultAlbum, artistImageUrl: artistImage };
          })
        );
      })
    );
  }

  /**
   * Performs a JSONP request to bypass CORS issues with the Deezer API from the browser.
   */
  private jsonpFetch(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      
      const script = document.createElement('script');
      const separator = url.includes('?') ? '&' : '?';
      script.src = `${url}${separator}output=jsonp&callback=${callbackName}`;

      (window as any)[callbackName] = (data: any) => {
        delete (window as any)[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };

      script.onerror = () => {
        delete (window as any)[callbackName];
        document.body.removeChild(script);
        reject(new Error(`JSONP request to ${url} failed`));
      };
      
      document.body.appendChild(script);
    });
  }
  
  /**
   * Finds the best available image URL from a Deezer API object.
   * Prefers larger images ('xl', 'big') over smaller ones.
   */
  private findBestDeezerImage(imageOwner: any, baseName: 'cover' | 'picture'): string | null {
    if (!imageOwner) return null;
    return imageOwner[`${baseName}_xl`] || imageOwner[`${baseName}_big`] || imageOwner[`${baseName}_medium`] || imageOwner[`${baseName}_small`] || imageOwner[baseName] || null;
  }
}
