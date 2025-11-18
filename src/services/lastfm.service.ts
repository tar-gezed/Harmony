import { Injectable } from '@angular/core';
import { from, of, throwError, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { lastFmApiKey } from '../config';
import { MusicDataService, Album, AlbumData } from './music-data.service';

@Injectable({ providedIn: 'root' })
export class LastFmService extends MusicDataService {
  private readonly lastFmApiUrl = 'https://ws.audioscrobbler.com/2.0/';
  
  override getAlbumAndArtistInfo(artist: string, album: string): Observable<AlbumData> {
    return this.getRawAlbumInfoFromLastFm(artist, album).pipe(
      switchMap(albumData => 
        this.getArtistInfoFromMusicBrainz(albumData.artist).pipe(
          map(artistImageUrl => ({ album: albumData, artistImageUrl }))
        )
      )
    );
  }

  private findBestLastFmImage(images: any[]): string | null {
      if (!images || images.length === 0) return null;
      const mega = images.find(i => i.size === 'mega');
      if (mega && mega['#text']) return mega['#text'];
      const extralarge = images.find(i => i.size === 'extralarge');
      if (extralarge && extralarge['#text']) return extralarge['#text'];
      const largest = images[images.length - 1];
      return largest ? largest['#text'] : null;
  }

  private getRawAlbumInfoFromLastFm(artist: string, album: string): Observable<Album> {
    // FIX: Corrected the placeholder API key check to match the value in config.ts
    if (!lastFmApiKey || lastFmApiKey === 'YOUR_LAST_FM_API_KEY') {
      return throwError(() => new Error('Last.fm API Key is not configured. Please set it in src/config.ts'));
    }

    const url = `${this.lastFmApiUrl}?method=album.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&format=json`;

    return from(fetch(url)).pipe(
      switchMap(response => response.ok ? response.json() : throwError(() => new Error(`Network error: ${response.statusText}`))),
      map((data: any) => {
        if (data.error) throw new Error(`Last.fm API Error: ${data.message}`);
        if (!data.album) throw new Error('Album not found on Last.fm.');

        const albumData = data.album;
        const imageUrl = this.findBestLastFmImage(albumData.image) || `https://picsum.photos/seed/${encodeURIComponent(artist + album)}/1080/1080`;
        const tracks = (albumData.tracks?.track || []).map((t: any) => ({ name: t.name, duration: +t.duration }));
        
        if (tracks.length === 0) throw new Error('Last.fm album has no tracklist.');

        return { artist: albumData.artist, name: albumData.name, coverUrl: imageUrl, tracks };
      })
    );
  }
  
  private getArtistInfoFromMusicBrainz(artist: string): Observable<string | null> {
    // FIX: Corrected the placeholder API key check to match the value in config.ts
    if (!lastFmApiKey || lastFmApiKey === 'YOUR_LAST_FM_API_KEY') return of(null);

    const lastFmUrl = `${this.lastFmApiUrl}?method=artist.getinfo&api_key=${lastFmApiKey}&artist=${encodeURIComponent(artist)}&format=json`;

    return from(fetch(lastFmUrl)).pipe(
      switchMap(response => response.ok ? response.json() : of(null)),
      switchMap((lastFmData: any) => {
        if (!lastFmData?.artist?.mbid) return of(null);
        const musicBrainzUrl = `https://musicbrainz.org/ws/2/artist/${lastFmData.artist.mbid}?inc=url-rels&fmt=json`;
        
        return from(fetch(musicBrainzUrl)).pipe(
          switchMap(response => response.ok ? response.json() : of(null)),
          switchMap((musicBrainzData: any) => {
            const imageRelation = musicBrainzData?.relations?.find((r: any) => r.type === 'image');
            if (!imageRelation?.url?.resource) return of(null);
            
            const imageUrl = imageRelation.url.resource;
            if (imageUrl.startsWith('https://commons.wikimedia.org/wiki/File:')) {
              const filename = imageUrl.substring(imageUrl.indexOf('File:'));
              const wikimediaApiUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(filename)}&prop=imageinfo&iiprop=url&format=json&origin=*`;
              
              return from(fetch(wikimediaApiUrl)).pipe(
                switchMap(res => res.json()),
                map((wikiData: any) => {
                  const pages = wikiData?.query?.pages;
                  const pageId = pages ? Object.keys(pages)[0] : null;
                  return pageId ? pages[pageId]?.imageinfo?.[0]?.url : imageUrl;
                }),
                catchError(() => of(imageUrl))
              );
            }
            return of(imageUrl);
          }),
          catchError(() => of(null))
        );
      }),
      catchError(() => of(null))
    );
  }
}