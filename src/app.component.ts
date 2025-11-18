import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild, FactoryProvider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicDataService, Album, Track, RatedAlbum } from './services/music-data.service';
import { DeezerService } from './services/deezer.service';
import { LastFmService } from './services/lastfm.service';
import { activeProvider } from './config';
import * as htmlToImage from 'html-to-image';

export interface RatedTrack extends Track {
  rating: number | null;
}

export interface InfographicData {
  album: RatedAlbum;
  bestSong: RatedTrack;
  worstSong: RatedTrack;
  overallScore: number;
  backgroundUrl: string;
}



// Factory function to provide the correct music service based on config
export function musicDataServiceFactory(): MusicDataService {
  if (activeProvider === 'deezer') {
    return new DeezerService();
  } else {
    return new LastFmService();
  }
}

const MusicDataServiceProvider: FactoryProvider = {
  provide: MusicDataService,
  useFactory: musicDataServiceFactory
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [MusicDataServiceProvider]
})
export class AppComponent {
  private musicDataService = inject(MusicDataService);

  appState = signal<'search' | 'loading' | 'rating' | 'generating' | 'infographic'>('search');
  errorMessage = signal<string | null>(null);

  searchQuery = signal({ artist: '', album: '' });
  album = signal<RatedAlbum | null>(null);
  infographicBgUrl = signal<string>('');

  isRatingComplete = computed(() => {
    const currentAlbum = this.album();
    if (!currentAlbum) return false;
    return currentAlbum.tracks.every(track => track.rating !== null && track.rating >= 0 && track.rating <= 10);
  });

  infographicData = computed<InfographicData | null>(() => {
    const ratedAlbum = this.album();
    if (!this.isRatingComplete() || !ratedAlbum) return null;

    let bestSong: RatedTrack = ratedAlbum.tracks[0];
    let worstSong: RatedTrack = ratedAlbum.tracks[0];
    let totalScore = 0;

    for (const track of ratedAlbum.tracks) {
      if (track.rating! > bestSong.rating!) {
        bestSong = track;
      }
      if (track.rating! < worstSong.rating!) {
        worstSong = track;
      }
      totalScore += track.rating!;
    }

    const overallScore = parseFloat(((totalScore / ratedAlbum.tracks.length)).toFixed(1));

    return { album: ratedAlbum, bestSong, worstSong, overallScore, backgroundUrl: this.infographicBgUrl() };
  });

  trackListFontSize = computed(() => {
    const count = this.album()?.tracks.length || 0;
    if (count > 16) return 'text-[10px] leading-tight';
    if (count > 12) return 'text-xs leading-tight';
    return 'text-sm leading-normal';
  });

  infographicElement = viewChild<ElementRef>('infographic');

  ratingScale = [
    { score: 10, label: 'Perfect', color: 'bg-fuchsia-500' },
    { score: 9, label: 'Amazing', color: 'bg-purple-500' },
    { score: 8, label: 'Great', color: 'bg-blue-500' },
    { score: 7, label: 'Good', color: 'bg-green-500' },
    { score: 6, label: 'Decent', color: 'bg-lime-500' },
    { score: 5, label: 'Mediocre', color: 'bg-yellow-500' },
    { score: 4, label: 'Meh', color: 'bg-amber-500' },
    { score: 3, label: 'Bad', color: 'bg-orange-500' },
    { score: 2, label: 'Terrible', color: 'bg-red-500' },
    { score: 1, label: 'Dreadful', color: 'bg-rose-700' },
    { score: 0, label: 'Unrated', color: 'bg-gray-500' }
  ];

  getRatingInfo(score: number | null): { label: string, color: string } {
    if (score === null) score = 0;
    const roundedScore = Math.round(score);
    const info = this.ratingScale.find(s => s.score === roundedScore);
    return info || { label: 'Unrated', color: 'bg-gray-500' };
  }

  searchAlbum() {
    if (!this.searchQuery().artist || !this.searchQuery().album) return;
    this.errorMessage.set(null);
    this.appState.set('loading');

    this.musicDataService.getAlbumAndArtistInfo(this.searchQuery().artist, this.searchQuery().album)
      .subscribe({
        next: ({ album, artistImageUrl }) => {
          const ratedAlbum: RatedAlbum = {
            ...album,
            tracks: album.tracks.map(track => ({ ...track, rating: null }))
          };
          this.album.set(ratedAlbum);
          this.infographicBgUrl.set(artistImageUrl || album.coverUrl); // Fallback to album cover
          this.appState.set('rating');
        },
        error: err => {
          console.error(err);
          this.errorMessage.set(err.message || 'An unknown error occurred.');
          this.appState.set('search');
        }
      });
  }

  updateSearchQuery(field: 'artist' | 'album', value: string) {
    this.searchQuery.update(q => ({ ...q, [field]: value }));
  }

  updateTrackRating(trackIndex: number, event: Event) {
    const rating = (event.target as HTMLInputElement).value;
    this.album.update(currentAlbum => {
      if (!currentAlbum) return null;
      const newTracks = [...currentAlbum.tracks];
      const ratingValue = parseInt(rating, 10);
      newTracks[trackIndex] = {
        ...newTracks[trackIndex],
        rating: isNaN(ratingValue) ? null : Math.max(0, Math.min(10, ratingValue))
      };
      return { ...currentAlbum, tracks: newTracks };
    });
  }

  generateInfographic() {
    if (!this.isRatingComplete()) return;
    this.appState.set('infographic');
  }

  downloadInfographic() {
    const element = this.infographicElement()?.nativeElement;
    if (!element) return;

    this.appState.set('generating');

    htmlToImage.toPng(element, { pixelRatio: 4 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        const albumName = this.album()?.name.replace(/ /g, '_');
        const artistName = this.album()?.artist.replace(/ /g, '_');
        link.download = `${artistName}-${albumName}-rating.png`;
        link.href = dataUrl;
        link.click();
        this.appState.set('infographic');
      })
      .catch((err) => {
        console.error('Image generation failed:', err);
        this.appState.set('infographic');
      });
  }

  startOver() {
    this.appState.set('search');
    this.album.set(null);
    this.infographicBgUrl.set('');
    this.searchQuery.set({ artist: '', album: '' });
    this.errorMessage.set(null);
  }
}
