/**
 * Avatar Presets - Predefined avatar options
 */

export interface AvatarPreset {
  id: string;
  name: string;
  emoji?: string;        // Emoji representation
  imageUrl?: string;     // Custom image URL
  backgroundColor: string;
  category: 'default' | 'animal' | 'fantasy' | 'robot' | 'nature' | 'food';
}

// Default avatar presets using emojis
export const AVATAR_PRESETS: AvatarPreset[] = [
  // Default
  { id: 'default', name: 'Default', emoji: '😊', backgroundColor: '#6366f1', category: 'default' },
  { id: 'smile', name: 'Smile', emoji: '😄', backgroundColor: '#f59e0b', category: 'default' },
  { id: 'cool', name: 'Cool', emoji: '😎', backgroundColor: '#3b82f6', category: 'default' },
  { id: 'star', name: 'Star', emoji: '⭐', backgroundColor: '#eab308', category: 'default' },
  { id: 'fire', name: 'Fire', emoji: '🔥', backgroundColor: '#ef4444', category: 'default' },
  { id: 'lightning', name: 'Lightning', emoji: '⚡', backgroundColor: '#f59e0b', category: 'default' },

  // Animals
  { id: 'cat', name: 'Cat', emoji: '🐱', backgroundColor: '#f97316', category: 'animal' },
  { id: 'dog', name: 'Dog', emoji: '🐕', backgroundColor: '#a16207', category: 'animal' },
  { id: 'fox', name: 'Fox', emoji: '🦊', backgroundColor: '#ea580c', category: 'animal' },
  { id: 'wolf', name: 'Wolf', emoji: '🐺', backgroundColor: '#64748b', category: 'animal' },
  { id: 'bear', name: 'Bear', emoji: '🐻', backgroundColor: '#78350f', category: 'animal' },
  { id: 'panda', name: 'Panda', emoji: '🐼', backgroundColor: '#1f2937', category: 'animal' },
  { id: 'lion', name: 'Lion', emoji: '🦁', backgroundColor: '#ca8a04', category: 'animal' },
  { id: 'tiger', name: 'Tiger', emoji: '🐯', backgroundColor: '#f97316', category: 'animal' },
  { id: 'rabbit', name: 'Rabbit', emoji: '🐰', backgroundColor: '#f9a8d4', category: 'animal' },
  { id: 'owl', name: 'Owl', emoji: '🦉', backgroundColor: '#78350f', category: 'animal' },
  { id: 'eagle', name: 'Eagle', emoji: '🦅', backgroundColor: '#78716c', category: 'animal' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', backgroundColor: '#16a34a', category: 'animal' },

  // Fantasy
  { id: 'wizard', name: 'Wizard', emoji: '🧙', backgroundColor: '#7c3aed', category: 'fantasy' },
  { id: 'knight', name: 'Knight', emoji: '🗡️', backgroundColor: '#71717a', category: 'fantasy' },
  { id: 'crown', name: 'Crown', emoji: '👑', backgroundColor: '#eab308', category: 'fantasy' },
  { id: 'ghost', name: 'Ghost', emoji: '👻', backgroundColor: '#e2e8f0', category: 'fantasy' },
  { id: 'alien', name: 'Alien', emoji: '👽', backgroundColor: '#22c55e', category: 'fantasy' },
  { id: 'ninja', name: 'Ninja', emoji: '🥷', backgroundColor: '#1f2937', category: 'fantasy' },
  { id: 'fairy', name: 'Fairy', emoji: '🧚', backgroundColor: '#ec4899', category: 'fantasy' },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', backgroundColor: '#d946ef', category: 'fantasy' },

  // Robots
  { id: 'robot', name: 'Robot', emoji: '🤖', backgroundColor: '#6b7280', category: 'robot' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', backgroundColor: '#f97316', category: 'robot' },
  { id: 'satellite', name: 'Satellite', emoji: '🛰️', backgroundColor: '#3b82f6', category: 'robot' },
  { id: 'ufo', name: 'UFO', emoji: '🛸', backgroundColor: '#8b5cf6', category: 'robot' },

  // Nature
  { id: 'sun', name: 'Sun', emoji: '☀️', backgroundColor: '#fbbf24', category: 'nature' },
  { id: 'moon', name: 'Moon', emoji: '🌙', backgroundColor: '#475569', category: 'nature' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', backgroundColor: '#ec4899', category: 'nature' },
  { id: 'cloud', name: 'Cloud', emoji: '☁️', backgroundColor: '#94a3b8', category: 'nature' },
  { id: 'tree', name: 'Tree', emoji: '🌳', backgroundColor: '#16a34a', category: 'nature' },
  { id: 'flower', name: 'Flower', emoji: '🌸', backgroundColor: '#f472b6', category: 'nature' },
  { id: 'mushroom', name: 'Mushroom', emoji: '🍄', backgroundColor: '#dc2626', category: 'nature' },

  // Food
  { id: 'pizza', name: 'Pizza', emoji: '🍕', backgroundColor: '#f97316', category: 'food' },
  { id: 'burger', name: 'Burger', emoji: '🍔', backgroundColor: '#ca8a04', category: 'food' },
  { id: 'icecream', name: 'Ice Cream', emoji: '🍦', backgroundColor: '#fde68a', category: 'food' },
  { id: 'cookie', name: 'Cookie', emoji: '🍪', backgroundColor: '#a16207', category: 'food' },
  { id: 'cake', name: 'Cake', emoji: '🎂', backgroundColor: '#f472b6', category: 'food' },
];

/**
 * Get avatar preset by ID
 */
export function getAvatarPreset(id: string): AvatarPreset | undefined {
  return AVATAR_PRESETS.find(a => a.id === id);
}

/**
 * Get avatars by category
 */
export function getAvatarsByCategory(category: AvatarPreset['category']): AvatarPreset[] {
  return AVATAR_PRESETS.filter(a => a.category === category);
}

/**
 * Get all avatar categories
 */
export function getAvatarCategories(): AvatarPreset['category'][] {
  return ['default', 'animal', 'fantasy', 'robot', 'nature', 'food'];
}

/**
 * Get random avatar
 */
export function getRandomAvatar(): AvatarPreset {
  return AVATAR_PRESETS[Math.floor(Math.random() * AVATAR_PRESETS.length)];
}

/**
 * Create custom avatar data URL from emoji
 */
export function createEmojiAvatar(emoji: string, backgroundColor: string, size: number = 64): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Draw background
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw emoji
  ctx.font = `${size * 0.6}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + 2);

  return canvas.toDataURL('image/png');
}

/**
 * Validate custom avatar URL
 */
export function isValidAvatarUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Allow data URLs and http(s) URLs
    return parsed.protocol === 'data:' ||
           parsed.protocol === 'http:' ||
           parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Get avatar display data (either preset or custom)
 */
export function getAvatarDisplay(presetId?: string, customUrl?: string): {
  type: 'preset' | 'custom';
  emoji?: string;
  imageUrl?: string;
  backgroundColor: string;
} {
  if (customUrl && isValidAvatarUrl(customUrl)) {
    return {
      type: 'custom',
      imageUrl: customUrl,
      backgroundColor: '#6366f1'
    };
  }

  const preset = presetId ? getAvatarPreset(presetId) : AVATAR_PRESETS[0];
  if (preset) {
    return {
      type: 'preset',
      emoji: preset.emoji,
      imageUrl: preset.imageUrl,
      backgroundColor: preset.backgroundColor
    };
  }

  // Fallback
  return {
    type: 'preset',
    emoji: '😊',
    backgroundColor: '#6366f1'
  };
}
