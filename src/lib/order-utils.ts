/**
 * @fileOverview Logistics Utility Engine for Green Horizon.
 * Contains shared logic for product visualization and mapping.
 */

export const PRODUCT_EMOJIS: Record<string, string> = {
    'milk': '🥛',
    'egg': '🥚',
    'bread': '🍞',
    'carrot': '🥕',
    'tomato': '🍅',
    'lettuce': '🥬',
    'potato': '🥔',
    'wheat': '🌾',
    'meat': '🥩',
    'chicken': '🍗',
    'beef': '🥩',
    'pork': '🥓',
    'seed': '🌱',
    'flower': '🌸',
    'water': '💧',
    'fertilizer': '🧪',
    'logistics': '🚚',
    'delivery': '📦',
    'hay': '🌾',
    'orange': '🍊',
    'lemon': '🍋',
    'honey': '🍯',
};

/**
 * Maps a product name to its associated visual identity (emoji).
 * @param name The product name to map.
 * @returns An emoji string or a default package icon.
 */
export function getProductEmoji(name: string) {
    const n = name.toLowerCase();
    for (const [key, emoji] of Object.entries(PRODUCT_EMOJIS)) {
        if (n.includes(key)) return emoji;
    }
    return '📦';
}
