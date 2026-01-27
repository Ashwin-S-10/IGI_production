import { describe, expect, it } from 'vitest';

import type { Round2Prompt } from '@/lib/firestore/models';
import { normalizeRound2Answers, selectPromptsForLanguage, type Round2AnswerInput } from './round2';

describe('selectPromptsForLanguage', () => {
  const samplePrompts: Round2Prompt[] = Array.from({ length: 12 }, (_, index) => ({
    id: `ts-${index + 1}`,
    title: `Prompt ${index + 1}`,
    language: index % 2 === 0 ? 'TypeScript' : 'Python',
    difficulty: 'medium',
    snippet: 'code',
    answer: {
      summary: 'bug',
      keywords: ['bug'],
      line: 1,
    },
  }));

  it('returns the first ten prompts matching the requested language', () => {
    const result = selectPromptsForLanguage(samplePrompts, 'TypeScript');
    expect(result).toHaveLength(6); // only 6 TypeScript prompts exist in fixture
    expect(result.every((prompt) => prompt.language === 'TypeScript')).toBe(true);

    const paddedPrompts = samplePrompts.map((prompt, index) => ({
      ...prompt,
      language: 'TypeScript',
      id: `ts-${index + 1}`,
    }));
    const capped = selectPromptsForLanguage(paddedPrompts, 'TypeScript');
    expect(capped).toHaveLength(10);
    expect(capped[0]?.id).toBe('ts-1');
    expect(capped[9]?.id).toBe('ts-10');
  });

  it('is case insensitive and trims language names', () => {
    const result = selectPromptsForLanguage(samplePrompts, '  python  ');
    expect(result).toHaveLength(6);
    expect(result.every((prompt) => prompt.language === 'Python')).toBe(true);
  });

  it('returns an empty list when the language is unknown or blank', () => {
    expect(selectPromptsForLanguage(samplePrompts, 'Rust')).toHaveLength(0);
    expect(selectPromptsForLanguage(samplePrompts, '   ')).toHaveLength(0);
  });
});

describe('normalizeRound2Answers', () => {
  const prompts: Round2Prompt[] = [
    {
      id: 'ts-1',
      title: 'Prompt 1',
      language: 'TypeScript',
      difficulty: 'medium',
      snippet: 'code',
      answer: {
        summary: 'bug',
        keywords: ['bug'],
        line: 12,
      },
    },
    {
      id: 'ts-2',
      title: 'Prompt 2',
      language: 'TypeScript',
      difficulty: 'medium',
      snippet: 'code',
      answer: {
        summary: 'bug',
        keywords: ['bug'],
        line: 3,
      },
    },
  ];

  it('preserves descriptions for prompts with answers and fills gaps when missing', () => {
    const answers: Round2AnswerInput[] = [
      { promptId: 'ts-1', description: 'Null check missing', line: 12 },
    ];

    const normalized = normalizeRound2Answers(prompts, answers);
    expect(normalized).toHaveLength(2);
    expect(normalized[0]).toEqual({ promptId: 'ts-1', description: 'Null check missing', line: 12 });
    expect(normalized[1]?.promptId).toBe('ts-2');
    expect(normalized[1]?.description).toBe('');
    expect(Number.isNaN(normalized[1]?.line ?? 0)).toBe(true);
  });

  it('coerces non-numeric line numbers to NaN', () => {
    const answers: Round2AnswerInput[] = [
      // @ts-expect-error Intentionally provide a string to simulate malformed input
      { promptId: 'ts-2', description: 'Something odd', line: 'abc' },
    ];

    const normalized = normalizeRound2Answers(prompts, answers);
    const entry = normalized.find((item) => item.promptId === 'ts-2');
    expect(entry).toBeDefined();
    expect(Number.isNaN(entry?.line ?? 0)).toBe(true);
  });
});
