'use client';

import { FormEvent, useMemo, useState } from 'react';

type MealRecommendation = {
  name: string;
  mealTime: string;
  ingredients: string[];
  reason: string;
  cookingTip: string;
};

type MealPlanResponse = {
  ageLabel: string;
  summary: string;
  meals: MealRecommendation[];
  cautions: string[];
};

type MealPlanErrorResponse = {
  error?: string;
};

const ageOptions = [
  { month: 9, label: '9개월', detail: '후기 이유식' },
  { month: 10, label: '10개월', detail: '후기 이유식' },
  { month: 11, label: '11개월', detail: '완료기 이유식' },
  { month: 12, label: '12개월', detail: '완료기 이유식' },
];

const RECENT_MEALS_STORAGE_KEY = 'recent-baby-meals';

function parseIngredientText(value: string) {
  return value
    .split(/[,/\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitialRecentMealNames() {
  if (typeof window === 'undefined') {
    return [];
  }

  const stored = window.localStorage.getItem(RECENT_MEALS_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored) as unknown;

    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(RECENT_MEALS_STORAGE_KEY);
  }

  return [];
}

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState<number>(6);
  const [availableIngredients, setAvailableIngredients] = useState('');
  const [excludedIngredients, setExcludedIngredients] = useState('');
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentMealNames, setRecentMealNames] = useState<string[]>(
    getInitialRecentMealNames
  );

  const selectedAge = useMemo(
    () => ageOptions.find((option) => option.month === selectedMonth),
    [selectedMonth]
  );

  const availableIngredientList = useMemo(
    () => parseIngredientText(availableIngredients),
    [availableIngredients]
  );

  const excludedIngredientList = useMemo(
    () => parseIngredientText(excludedIngredients),
    [excludedIngredients]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          availableIngredients: availableIngredientList,
          excludedIngredients: excludedIngredientList,
          recentMealNames,
        }),
      });

      const data = (await response.json()) as
        | MealPlanResponse
        | MealPlanErrorResponse;

      if (!response.ok) {
        setMealPlan(null);
        setErrorMessage(
          'error' in data && data.error
            ? data.error
            : '식단 생성 중 오류가 발생했어요.'
        );
        return;
      }

      const nextPlan = data as MealPlanResponse;
      const nextRecentMealNames = Array.from(
        new Set([
          ...nextPlan.meals.map((meal) => meal.name),
          ...recentMealNames,
        ])
      ).slice(0, 12);

      setMealPlan(nextPlan);
      setRecentMealNames(nextRecentMealNames);
      window.localStorage.setItem(
        RECENT_MEALS_STORAGE_KEY,
        JSON.stringify(nextRecentMealNames)
      );
    } catch {
      setMealPlan(null);
      setErrorMessage('네트워크 오류로 식단을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearRecentMeals = () => {
    setRecentMealNames([]);
    window.localStorage.removeItem(RECENT_MEALS_STORAGE_KEY);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf0_0%,#fff5ef_45%,#fffdf8_100%)] px-4 py-10 text-stone-900">
      <section className="mx-auto max-w-5xl">
        <div className="mb-8 rounded-[2rem] border border-orange-200/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(245,158,11,0.12)] backdrop-blur">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
            Baby Meal Planner
          </p>
          <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div>
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-stone-900 md:text-4xl">
                안정우의 개월수와 재료 조건에 맞춰 이유식 식단을 추천
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
                최근에 추천받은 메뉴는 피하고, 집에 있는 재료와 제외하고 싶은
                재료까지 반영해서 더 실용적인 식단을 받아보기
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[1.75rem] bg-orange-50 p-5 shadow-inner"
            >
              <label
                htmlFor="month"
                className="mb-3 block text-sm font-semibold text-stone-700"
              >
                아기 개월수 선택
              </label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="mb-4 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base font-medium text-stone-900 outline-none transition focus:border-orange-400"
              >
                {ageOptions.map((option) => (
                  <option key={option.month} value={option.month}>
                    {option.label} · {option.detail}
                  </option>
                ))}
              </select>

              <label
                htmlFor="availableIngredients"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                보유 재료
              </label>
              <textarea
                id="availableIngredients"
                value={availableIngredients}
                onChange={(event) => setAvailableIngredients(event.target.value)}
                placeholder="예: 쌀, 애호박, 소고기, 당근"
                className="mb-4 min-h-24 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400"
              />

              <label
                htmlFor="excludedIngredients"
                className="mb-2 block text-sm font-semibold text-stone-700"
              >
                제외 재료
              </label>
              <textarea
                id="excludedIngredients"
                value={excludedIngredients}
                onChange={(event) => setExcludedIngredients(event.target.value)}
                placeholder="예: 달걀, 우유, 새우"
                className="mb-4 min-h-24 w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-orange-400"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              >
                {isLoading ? '식단 생성 중...' : '식단 생성'}
              </button>
            </form>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-orange-500">
                현재 선택
              </p>
              <h2 className="mb-1 text-2xl font-bold text-stone-900">
                {selectedAge?.label}
              </h2>
              <p className="mb-6 text-sm text-stone-600">{selectedAge?.detail}</p>

              <div className="space-y-3 text-sm leading-6 text-stone-600">
                <p>
                  식단은 개월수에 맞는 식감, 이유식 진행 단계, 보유 재료와 제외
                  재료를 함께 반영해 생성됩니다.
                </p>
                <p>
                  알레르기, 특별 식이, 병원 지시사항이 있다면 추천 결과를 그대로
                  따르기보다 전문가와 함께 확인해 주세요.
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-orange-500">
                    최근 추천 제외
                  </p>
                  <h3 className="text-lg font-bold text-stone-900">
                    반복 추천 줄이기
                  </h3>
                </div>
                {recentMealNames.length > 0 && (
                  <button
                    type="button"
                    onClick={clearRecentMeals}
                    className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-200"
                  >
                    기록 초기화
                  </button>
                )}
              </div>

              {recentMealNames.length === 0 ? (
                <p className="text-sm leading-6 text-stone-600">
                  아직 제외할 최근 메뉴가 없어요. 식단을 한 번 생성하면 다음 추천부터
                  이 목록을 참고해 다른 메뉴를 우선 제안합니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {recentMealNames.map((mealName) => (
                    <span
                      key={mealName}
                      className="rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white"
                    >
                      {mealName}
                    </span>
                  ))}
                </div>
              )}
            </section>
          </aside>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            {!mealPlan && !errorMessage && (
              <div className="flex min-h-[320px] flex-col justify-center rounded-[1.5rem] bg-stone-50 px-6 py-10 text-center">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-stone-400">
                  Ready
                </p>
                <h2 className="mb-3 text-2xl font-bold text-stone-900">
                  조건을 넣고 식단 생성을 눌러보세요
                </h2>
                <p className="text-sm leading-6 text-stone-600">
                  Gemini가 최근 추천 메뉴와 겹치지 않도록 조정하면서, 보유 재료와
                  제외 재료를 반영한 식단을 한국어로 정리해드립니다.
                </p>
              </div>
            )}

            {errorMessage && (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {mealPlan && (
              <div>
                <div className="mb-6 rounded-[1.5rem] bg-orange-50 p-5">
                  <p className="mb-2 text-sm font-semibold text-orange-500">
                    추천 요약
                  </p>
                  <h2 className="mb-2 text-2xl font-bold text-stone-900">
                    {mealPlan.ageLabel} 식단
                  </h2>
                  <p className="text-sm leading-6 text-stone-700">
                    {mealPlan.summary}
                  </p>
                </div>

                <div className="space-y-4">
                  {mealPlan.meals.map((meal) => (
                    <article
                      key={`${meal.mealTime}-${meal.name}`}
                      className="rounded-[1.5rem] border border-stone-200 p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                          {meal.mealTime}
                        </span>
                        <h3 className="text-lg font-bold text-stone-900">
                          {meal.name}
                        </h3>
                      </div>
                      <p className="mb-3 text-sm text-stone-600">
                        재료: {meal.ingredients.join(', ')}
                      </p>
                      <p className="mb-2 text-sm leading-6 text-stone-700">
                        {meal.reason}
                      </p>
                      <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
                        조리 팁: {meal.cookingTip}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
                  <p className="mb-3 text-sm font-semibold text-stone-700">
                    확인해 주세요
                  </p>
                  <ul className="space-y-2 text-sm leading-6 text-stone-600">
                    {mealPlan.cautions.map((caution) => (
                      <li key={caution}>- {caution}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
