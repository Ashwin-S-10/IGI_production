import type { Round2Prompt } from "@/lib/firestore/models";

export type Round2AnswerInput = {
  promptId: string;
  description: string;
  line: number;
};

export function selectPromptsForLanguage(prompts: Round2Prompt[], language: string, limit = 10): Round2Prompt[] {
  const normalizedLanguage = language.trim().toLowerCase();
  if (!normalizedLanguage) {
    return [];
  }
  return prompts
    .filter((prompt) => prompt.language?.toLowerCase() === normalizedLanguage)
    .slice(0, Math.max(0, limit));
}

export function normalizeRound2Answers(activePrompts: Round2Prompt[], answers: Round2AnswerInput[]): Round2AnswerInput[] {
  const answerMap = new Map(answers.map((answer) => [answer.promptId, answer]));
  return activePrompts.map((prompt) => {
    const existing = answerMap.get(prompt.id);
    const parsedLine = existing != null ? Number(existing.line) : Number.NaN;
    const normalizedLine = Number.isFinite(parsedLine) ? parsedLine : Number.NaN;
    return {
      promptId: prompt.id,
      description: existing?.description ?? "",
      line: normalizedLine,
    };
  });
}
