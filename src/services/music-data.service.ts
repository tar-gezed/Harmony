import { Observable } from 'rxjs';
import { RatedTrack } from '../app.component';

// --- Data Models ---

export interface Track {
  name: string;
  duration: number; // in seconds
}

export interface Album {
  artist: string;
  name: string;
  coverUrl: string;
  tracks: Track[];
}

export interface AlbumData {
  album: Album;
  artistImageUrl: string | null;
}

export interface RatedAlbum extends Album {
  tracks: RatedTrack[];
}


// --- Abstract Service Class ---

export abstract class MusicDataService {
  /**
   * Fetches album and artist information from a specific music data provider.
   * @param artist The name of the artist.
   * @param album The name of the album.
   * @returns An Observable that emits an AlbumData object containing album details and an artist image URL.
   */
  abstract getAlbumAndArtistInfo(artist: string, album: string): Observable<AlbumData>;
}
