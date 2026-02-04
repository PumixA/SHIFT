/**
 * Audio Manager - Handles game sound effects and music
 */

export type SoundEffect =
  | 'dice_roll'
  | 'dice_land'
  | 'move'
  | 'teleport'
  | 'bonus'
  | 'trap'
  | 'victory'
  | 'defeat'
  | 'turn_start'
  | 'power_up'
  | 'shield'
  | 'effect_applied'
  | 'effect_expired'
  | 'chat_message'
  | 'notification'
  | 'button_click'
  | 'error';

interface AudioManagerState {
  isMuted: boolean;
  volume: number;
  musicVolume: number;
  sfxVolume: number;
}

export type MusicTrack = 'menu' | 'game' | 'victory' | 'tension';

class AudioManager {
  private sounds: Map<SoundEffect, HTMLAudioElement> = new Map();
  private music: Map<MusicTrack, HTMLAudioElement> = new Map();
  private currentMusic: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private state: AudioManagerState = {
    isMuted: false,
    volume: 0.7,
    musicVolume: 0.5,
    sfxVolume: 0.8
  };
  private initialized = false;
  private audioContext: AudioContext | null = null;

  // Sound file paths
  private soundPaths: Record<SoundEffect, string> = {
    dice_roll: '/sounds/dice-roll.mp3',
    dice_land: '/sounds/dice-land.mp3',
    move: '/sounds/move.mp3',
    teleport: '/sounds/teleport.mp3',
    bonus: '/sounds/bonus.mp3',
    trap: '/sounds/trap.mp3',
    victory: '/sounds/victory.mp3',
    defeat: '/sounds/defeat.mp3',
    turn_start: '/sounds/turn-start.mp3',
    power_up: '/sounds/power-up.mp3',
    shield: '/sounds/shield.mp3',
    effect_applied: '/sounds/effect-applied.mp3',
    effect_expired: '/sounds/effect-expired.mp3',
    chat_message: '/sounds/chat.mp3',
    notification: '/sounds/notification.mp3',
    button_click: '/sounds/click.mp3',
    error: '/sounds/error.mp3'
  };

  // Music file paths
  private musicPaths: Record<MusicTrack, string> = {
    menu: '/music/menu-theme.mp3',
    game: '/music/game-theme.mp3',
    victory: '/music/victory-theme.mp3',
    tension: '/music/tension-theme.mp3'
  };

  /**
   * Initialize audio manager (call after user interaction)
   */
  init(): void {
    if (this.initialized || typeof window === 'undefined') return;

    // Create AudioContext for better audio handling
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }

    // Preload sounds and music
    this.preloadSounds();
    this.preloadMusic();

    // Load saved preferences
    this.loadPreferences();

    this.initialized = true;
    console.log('[AudioManager] Initialized');
  }

  /**
   * Preload all sound effects
   */
  private preloadSounds(): void {
    Object.entries(this.soundPaths).forEach(([key, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;

      // Handle loading errors gracefully
      audio.onerror = () => {
        console.warn(`[AudioManager] Failed to load: ${path}`);
      };

      this.sounds.set(key as SoundEffect, audio);
    });
  }

  /**
   * Preload all music tracks
   */
  private preloadMusic(): void {
    Object.entries(this.musicPaths).forEach(([key, path]) => {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = path;
      audio.loop = true; // Music loops by default

      // Handle loading errors gracefully
      audio.onerror = () => {
        console.warn(`[AudioManager] Failed to load music: ${path}`);
      };

      this.music.set(key as MusicTrack, audio);
    });
  }

  /**
   * Play background music
   */
  playMusic(track: MusicTrack, fadeIn = true): void {
    if (this.state.isMuted || !this.initialized) return;
    if (this.currentTrack === track) return; // Already playing

    const audio = this.music.get(track);
    if (!audio) {
      console.warn(`[AudioManager] Music not found: ${track}`);
      return;
    }

    // Stop current music
    if (this.currentMusic) {
      this.stopMusic(true);
    }

    try {
      audio.volume = fadeIn ? 0 : this.state.musicVolume * this.state.volume;
      audio.currentTime = 0;

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay was prevented
        });
      }

      this.currentMusic = audio;
      this.currentTrack = track;

      // Fade in
      if (fadeIn) {
        this.fadeIn(audio, this.state.musicVolume * this.state.volume, 1000);
      }
    } catch (e) {
      console.warn(`[AudioManager] Error playing music: ${track}`);
    }
  }

  /**
   * Stop background music
   */
  stopMusic(fadeOut = true): void {
    if (!this.currentMusic) return;

    if (fadeOut) {
      this.fadeOut(this.currentMusic, 500, () => {
        this.currentMusic?.pause();
        if (this.currentMusic) this.currentMusic.currentTime = 0;
        this.currentMusic = null;
        this.currentTrack = null;
      });
    } else {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
      this.currentMusic = null;
      this.currentTrack = null;
    }
  }

  /**
   * Pause background music
   */
  pauseMusic(): void {
    this.currentMusic?.pause();
  }

  /**
   * Resume background music
   */
  resumeMusic(): void {
    if (this.currentMusic && !this.state.isMuted) {
      this.currentMusic.play().catch(() => {});
    }
  }

  /**
   * Fade in audio
   */
  private fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number): void {
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = targetVolume / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.min(volumeStep * currentStep, targetVolume);

      if (currentStep >= steps) {
        clearInterval(interval);
      }
    }, stepTime);
  }

  /**
   * Fade out audio
   */
  private fadeOut(audio: HTMLAudioElement, duration: number, callback?: () => void): void {
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = audio.volume / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      audio.volume = Math.max(audio.volume - volumeStep, 0);

      if (currentStep >= steps) {
        clearInterval(interval);
        callback?.();
      }
    }, stepTime);
  }

  /**
   * Play a sound effect
   */
  play(sound: SoundEffect, volume?: number): void {
    if (this.state.isMuted || !this.initialized) return;

    const audio = this.sounds.get(sound);
    if (!audio) {
      console.warn(`[AudioManager] Sound not found: ${sound}`);
      return;
    }

    try {
      // Clone audio for overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = (volume ?? this.state.sfxVolume) * this.state.volume;

      const playPromise = clone.play();
      if (playPromise) {
        playPromise.catch(() => {
          // Autoplay was prevented, ignore
        });
      }
    } catch (e) {
      console.warn(`[AudioManager] Error playing: ${sound}`);
    }
  }

  /**
   * Play dice roll sequence
   */
  playDiceRoll(): void {
    this.play('dice_roll');
    setTimeout(() => this.play('dice_land'), 500);
  }

  /**
   * Play effect based on game action
   */
  playGameAction(action: string, value?: number): void {
    switch (action) {
      case 'MOVE_RELATIVE':
        this.play(value && value > 0 ? 'bonus' : 'trap');
        break;
      case 'TELEPORT':
      case 'MOVE_TO_TILE':
        this.play('teleport');
        break;
      case 'BACK_TO_START':
        this.play('trap');
        break;
      case 'MODIFY_SCORE':
        this.play(value && value > 0 ? 'bonus' : 'trap');
        break;
      case 'APPLY_SHIELD':
      case 'APPLY_INVISIBILITY':
        this.play('shield');
        break;
      case 'APPLY_DOUBLE_DICE':
      case 'APPLY_SPEED_BOOST':
      case 'EXTRA_TURN':
        this.play('power_up');
        break;
      case 'SKIP_TURN':
      case 'APPLY_SLOW':
        this.play('trap');
        break;
      default:
        this.play('effect_applied');
    }
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    this.savePreferences();
    return this.state.isMuted;
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean): void {
    this.state.isMuted = muted;
    if (muted) {
      this.pauseMusic();
    } else {
      this.resumeMusic();
    }
    this.savePreferences();
  }

  /**
   * Get mute state
   */
  isMuted(): boolean {
    return this.state.isMuted;
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  /**
   * Set SFX volume (0-1)
   */
  setSfxVolume(volume: number): void {
    this.state.sfxVolume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  /**
   * Set music volume (0-1)
   */
  setMusicVolume(volume: number): void {
    this.state.musicVolume = Math.max(0, Math.min(1, volume));
    // Update current music volume
    if (this.currentMusic) {
      this.currentMusic.volume = this.state.musicVolume * this.state.volume;
    }
    this.savePreferences();
  }

  /**
   * Get current music track
   */
  getCurrentTrack(): MusicTrack | null {
    return this.currentTrack;
  }

  /**
   * Get current state
   */
  getState(): AudioManagerState {
    return { ...this.state };
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('shift_audio_prefs', JSON.stringify(this.state));
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const saved = localStorage.getItem('shift_audio_prefs');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.state = { ...this.state, ...prefs };
      }
    } catch (e) {
      // Ignore errors
    }
  }

  /**
   * Unlock audio context (call after user interaction)
   */
  unlock(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Singleton instance
export const audioManager = new AudioManager();
export default audioManager;
