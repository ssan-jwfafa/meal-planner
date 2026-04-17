import { create } from 'zustand';

interface Meal {
  name: string;
  ingredients: string[];
  matchedCount: number;
}

interface State {
  ingredients: string[];
  meals: Meal[];
  statusMessage: string;
  addIngredient: (item: string) => void;
  generateMeals: () => void;
}

export const useStore = create<State>((set, get) => ({
  ingredients: [],
  meals: [],
  statusMessage: '재료를 추가한 뒤 식단을 생성해 보세요.',

  addIngredient: (item) => {
    const normalizedItem = item.trim();

    if (!normalizedItem) {
      set({ statusMessage: '재료를 먼저 입력해 주세요.' });
      return;
    }

    set((state) => {
      if (state.ingredients.includes(normalizedItem)) {
        return {
          statusMessage: '이미 추가된 재료예요.',
        };
      }

      return {
        ingredients: [...state.ingredients, normalizedItem],
        statusMessage: `"${normalizedItem}" 재료를 추가했어요.`,
      };
    });
  },

  generateMeals: () => {
    const { ingredients } = get();

    if (ingredients.length === 0) {
      set({
        meals: [],
        statusMessage: '재료를 1개 이상 추가해야 식단을 추천할 수 있어요.',
      });
      return;
    }

    const recipes = [
      {
        name: '소고기 애호박 죽',
        ingredients: ['소고기', '애호박', '쌀'],
      },
      {
        name: '닭고기 당근 리조또',
        ingredients: ['닭고기', '당근', '쌀'],
      },
      {
        name: '브로콜리 감자 죽',
        ingredients: ['브로콜리', '감자', '쌀'],
      },
      {
        name: '고구마 사과 퓨레',
        ingredients: ['고구마', '사과'],
      },
    ];

    const normalizedIngredients = ingredients.map((ingredient) =>
      ingredient.trim()
    );

    const rankedRecipes = recipes
      .map((recipe) => ({
        ...recipe,
        matchedCount: recipe.ingredients.filter((ingredient) =>
          normalizedIngredients.includes(ingredient)
        ).length,
      }))
      .filter((recipe) => recipe.matchedCount > 0)
      .sort((a, b) => b.matchedCount - a.matchedCount);

    if (rankedRecipes.length === 0) {
      set({
        meals: [],
        statusMessage: '입력한 재료와 맞는 식단이 아직 없어요. 다른 재료를 추가해 보세요.',
      });
      return;
    }

    set({
      meals: rankedRecipes,
      statusMessage: `${rankedRecipes.length}개의 추천 식단을 찾았어요.`,
    });
  },
}));
