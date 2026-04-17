import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const mealPlanSchema = {
  type: 'object',
  properties: {
    ageLabel: { type: 'string' },
    summary: { type: 'string' },
    meals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mealTime: { type: 'string' },
          ingredients: {
            type: 'array',
            items: { type: 'string' },
          },
          reason: { type: 'string' },
          cookingTip: { type: 'string' },
        },
        required: ['name', 'mealTime', 'ingredients', 'reason', 'cookingTip'],
        additionalProperties: false,
      },
      minItems: 3,
      maxItems: 4,
    },
    cautions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 4,
    },
  },
  required: ['ageLabel', 'summary', 'meals', 'cautions'],
  additionalProperties: false,
} as const;

type MealPlanPayload = {
  ageLabel: string;
  summary: string;
  meals: Array<{
    name: string;
    mealTime: string;
    ingredients: string[];
    reason: string;
    cookingTip: string;
  }>;
  cautions: string[];
};

type GeminiErrorLike = {
  status?: number;
  message?: string;
};

type GeminiMealPlanSchema = typeof mealPlanSchema & {
  propertyOrdering?: string[];
};

type MealPlanRequestBody = {
  month?: unknown;
  availableIngredients?: unknown;
  excludedIngredients?: unknown;
  recentMealNames?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isMealPlanPayload(value: unknown): value is MealPlanPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const data = value as Record<string, unknown>;

  return (
    typeof data.ageLabel === 'string' &&
    typeof data.summary === 'string' &&
    Array.isArray(data.cautions) &&
    data.cautions.every((item) => typeof item === 'string') &&
    Array.isArray(data.meals) &&
    data.meals.every((meal) => {
      if (!meal || typeof meal !== 'object') {
        return false;
      }

      const item = meal as Record<string, unknown>;

      return (
        typeof item.name === 'string' &&
        typeof item.mealTime === 'string' &&
        typeof item.reason === 'string' &&
        typeof item.cookingTip === 'string' &&
        Array.isArray(item.ingredients) &&
        item.ingredients.every((ingredient) => typeof ingredient === 'string')
      );
    })
  );
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error:
          'GEMINI_API_KEY가 설정되지 않았어요. `.env.local`에 API 키를 추가해 주세요.',
      },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as MealPlanRequestBody;
    const month = Number(body.month);

    if (!Number.isInteger(month) || month < 4 || month > 12) {
      return NextResponse.json(
        { error: '개월수는 4개월부터 12개월 사이로 선택해 주세요.' },
        { status: 400 }
      );
    }

    const availableIngredients = isStringArray(body.availableIngredients)
      ? body.availableIngredients.slice(0, 20)
      : [];
    const excludedIngredients = isStringArray(body.excludedIngredients)
      ? body.excludedIngredients.slice(0, 20)
      : [];
    const recentMealNames = isStringArray(body.recentMealNames)
      ? body.recentMealNames.slice(0, 12)
      : [];

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const pantryLine =
      availableIngredients.length > 0
        ? `보유 재료: ${availableIngredients.join(', ')}`
        : '보유 재료: 특별히 지정하지 않음';
    const excludedLine =
      excludedIngredients.length > 0
        ? `제외 재료: ${excludedIngredients.join(', ')}`
        : '제외 재료: 특별히 지정하지 않음';
    const recentMealsLine =
      recentMealNames.length > 0
        ? `최근 추천받아 이번에는 피하고 싶은 메뉴: ${recentMealNames.join(', ')}`
        : '최근 추천받아 피할 메뉴: 없음';

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        `${month}개월 아기를 위한 하루 이유식 식단을 추천해 주세요.`,
        pantryLine,
        excludedLine,
        recentMealsLine,
        '요청 조건:',
        '- 최근 추천 메뉴와 같은 이름의 메뉴는 되도록 다시 추천하지 말 것',
        '- 제외 재료는 식단에서 빼고, 보유 재료가 있으면 가능한 한 우선 활용할 것',
        '- 끼니별 이름, 주요 재료, 추천 이유, 조리 팁, 주의사항을 알려 줄 것',
        '- 쌀, 채소, 단백질 식재료의 균형을 고려할 것',
        '- 지나치게 어려운 재료나 자극적인 재료는 피할 것',
      ].join('\n'),
      config: {
        systemInstruction:
          '당신은 한국 이유식 식단을 제안하는 도우미입니다. 반드시 한국어로 답하고, 개월수에 맞는 식감과 재료를 반영하세요. 의료 진단은 하지 말고 일반적인 식단 예시만 제안하세요. 최근 추천 메뉴와 겹치지 않는 다양성을 우선하세요.',
        responseMimeType: 'application/json',
        responseJsonSchema: {
          ...mealPlanSchema,
          propertyOrdering: ['ageLabel', 'summary', 'meals', 'cautions'],
        } satisfies GeminiMealPlanSchema,
      },
    });

    if (!response.text) {
      return NextResponse.json(
        { error: 'Gemini 응답이 비어 있어요. 잠시 후 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(response.text);

    if (!isMealPlanPayload(parsed)) {
      return NextResponse.json(
        { error: '식단 결과 형식을 해석하지 못했어요. 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('meal-plan generation failed', error);

    const geminiError = error as GeminiErrorLike;

    if (geminiError.status === 401) {
      return NextResponse.json(
        { error: 'Gemini API 키가 유효하지 않아요. `.env.local`의 키를 다시 확인해 주세요.' },
        { status: 401 }
      );
    }

    if (geminiError.status === 429) {
      return NextResponse.json(
        {
          error:
            'Gemini API 무료 한도 또는 호출 제한에 도달했어요. 잠시 후 다시 시도하거나 Google AI Studio의 사용량을 확인해 주세요.',
        },
        { status: 429 }
      );
    }

    if (geminiError.status === 400) {
      return NextResponse.json(
        {
          error:
            geminiError.message ??
            'Gemini 요청 형식이 올바르지 않아요. 입력값과 설정을 다시 확인해 주세요.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Gemini 식단 생성 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
