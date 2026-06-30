// Service dédié à l'intégration OpenFoodFacts (API publique, gratuite, sans clé requise).
// Toute la logique réseau et de normalisation des données est isolée ici : les composants
// ne connaissent que `lookupProductByBarcode` et son résultat typé (jamais de fetch direct
// dans l'UI), ce qui facilite les tests et un éventuel remplacement de fournisseur de données.
import type { FoodItem } from '../types';

const API_BASE = 'https://world.openfoodfacts.org/api/v2/product';
const REQUEST_TIMEOUT_MS = 8000;
const FIELDS = [
  'product_name',
  'nutriments',
  'nutriscore_grade',
  'allergens_tags',
  'ingredients_text_fr',
  'ingredients_text',
].join(',');

export type ProductLookupResult =
  | { status: 'ok'; food: FoodItem }
  | { status: 'not_found' }
  | { status: 'incomplete'; food: FoodItem; missing: string[] }
  | { status: 'network_error' }
  | { status: 'invalid_barcode' };

interface OpenFoodFactsNutriments {
  ['energy-kcal_100g']?: number;
  ['proteins_100g']?: number;
  ['carbohydrates_100g']?: number;
  ['fat_100g']?: number;
  ['fiber_100g']?: number;
  ['salt_100g']?: number;
}

interface OpenFoodFactsProduct {
  product_name?: string;
  nutriments?: OpenFoodFactsNutriments;
  nutriscore_grade?: string;
  allergens_tags?: string[];
  ingredients_text_fr?: string;
  ingredients_text?: string;
}

interface OpenFoodFactsResponse {
  status: number; // 1 = trouvé, 0 = non trouvé
  product?: OpenFoodFactsProduct;
}

function normalizeAllergenes(tags: string[] | undefined): string[] | undefined {
  if (!tags || tags.length === 0) return undefined;
  // Les tags OFF sont préfixés par la langue, ex. "fr:gluten" -> on garde juste "gluten".
  return tags.map((t) => t.split(':').pop() ?? t).filter(Boolean);
}

/** Interroge OpenFoodFacts pour un code-barres donné et normalise la réponse en FoodItem.
 * Ne lève jamais d'exception : tous les cas d'échec (réseau, produit introuvable, code
 * invalide, données nutritionnelles incomplètes) sont représentés par le type de retour. */
export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  const cleaned = barcode.trim();
  if (!/^\d{6,14}$/.test(cleaned)) {
    return { status: 'invalid_barcode' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/${cleaned}.json?fields=${FIELDS}`, { signal: controller.signal });
    if (!res.ok) {
      return { status: 'network_error' };
    }
    const data = (await res.json()) as OpenFoodFactsResponse;
    if (data.status !== 1 || !data.product) {
      return { status: 'not_found' };
    }

    const p = data.product;
    const n = p.nutriments ?? {};
    const missing: string[] = [];
    if (n['energy-kcal_100g'] === undefined) missing.push('calories');
    if (n['proteins_100g'] === undefined) missing.push('protéines');
    if (n['carbohydrates_100g'] === undefined) missing.push('glucides');
    if (n['fat_100g'] === undefined) missing.push('lipides');

    const food: FoodItem = {
      id: `off-${cleaned}`,
      nom: p.product_name?.trim() || `Produit ${cleaned}`,
      caloriesPour100g: n['energy-kcal_100g'] ?? 0,
      proteinesPour100g: n['proteins_100g'] ?? 0,
      glucidesPour100g: n['carbohydrates_100g'] ?? 0,
      lipidesPour100g: n['fat_100g'] ?? 0,
      fibresPour100g: n['fiber_100g'] ?? 0,
      selPour100g: n['salt_100g'],
      nutriScore: p.nutriscore_grade,
      allergenes: normalizeAllergenes(p.allergens_tags),
      ingredientsTexte: p.ingredients_text_fr || p.ingredients_text,
      source: 'openfoodfacts',
      codeBarres: cleaned,
    };

    // Les calories sont indispensables pour un ajout fiable au journal alimentaire ;
    // les autres champs manquants sont signalés mais n'empêchent pas l'utilisation.
    if (missing.length > 0) {
      return { status: 'incomplete', food, missing };
    }
    return { status: 'ok', food };
  } catch {
    // Timeout (AbortError) ou erreur réseau générique : on ne distingue pas finement,
    // l'UI propose dans tous les cas la saisie manuelle en repli.
    return { status: 'network_error' };
  } finally {
    clearTimeout(timeout);
  }
}
