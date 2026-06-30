import { useState } from 'react';
import type { FoodItem } from '../types';
import foodsData from '../data/foods.json';

const foods = foodsData as FoodItem[];

interface FoodPickerProps {
  onSelect: (food: FoodItem) => void;
  selectedId?: string;
}

export default function FoodPicker({ onSelect, selectedId }: FoodPickerProps) {
  const [query, setQuery] = useState('');

  const filtered = foods.filter((food) =>
    food.nom.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="food-picker">
      <input
        className="form-input food-picker__search"
        type="text"
        placeholder="Rechercher un aliment..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="food-picker__list">
        {filtered.length === 0 && <div className="food-picker__item">Aucun aliment trouvé</div>}
        {filtered.map((food) => (
          <div
            key={food.id}
            className={`food-picker__item ${selectedId === food.id ? 'selected' : ''}`}
            onClick={() => onSelect(food)}
          >
            <span>{food.nom}</span>
            <span className="text-muted">{food.caloriesPour100g} kcal/100g</span>
          </div>
        ))}
      </div>
    </div>
  );
}
