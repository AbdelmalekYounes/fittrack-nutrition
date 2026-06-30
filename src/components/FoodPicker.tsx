import { useState } from 'react';
import type { FoodItem } from '../types';
import foodsData from '../data/foods.json';
import { getFoodEmoji } from '../utils/foodIcons';

const foods = foodsData as FoodItem[];

interface FoodPickerProps {
  onSelect: (food: FoodItem) => void;
  selectedId?: string;
  favorites?: string[];
  onToggleFavorite?: (foodId: string) => void;
}

export default function FoodPicker({ onSelect, selectedId, favorites = [], onToggleFavorite }: FoodPickerProps) {
  const [query, setQuery] = useState('');
  const [favorisOnly, setFavorisOnly] = useState(false);

  const filtered = foods
    .filter((food) => food.nom.toLowerCase().includes(query.toLowerCase()))
    .filter((food) => !favorisOnly || favorites.includes(food.id))
    // Les favoris remontent en tête de liste pour un accès plus rapide.
    .sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));

  return (
    <div className="food-picker">
      <div className="food-picker__toolbar">
        <input
          className="form-input food-picker__search"
          type="text"
          placeholder="Rechercher un aliment..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {onToggleFavorite && (
          <button
            type="button"
            className={`btn btn-sm ${favorisOnly ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFavorisOnly((v) => !v)}
          >
            ★ Favoris
          </button>
        )}
      </div>
      <div className="food-picker__list">
        {filtered.length === 0 && <div className="food-picker__item">Aucun aliment trouvé</div>}
        {filtered.map((food) => {
          const isFavorite = favorites.includes(food.id);
          return (
            <div
              key={food.id}
              className={`food-picker__item ${selectedId === food.id ? 'selected' : ''}`}
              onClick={() => onSelect(food)}
            >
              <span className="food-picker__name">
                <span className="food-emoji" aria-hidden="true">{getFoodEmoji(food)}</span>
                {food.nom}
              </span>
              <span className="food-picker__meta">
                <span className="text-muted">{food.caloriesPour100g} kcal/100g</span>
                {onToggleFavorite && (
                  <button
                    type="button"
                    className={`food-picker__fav ${isFavorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(food.id);
                    }}
                    aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
