import type { Round3Question } from "@/lib/firestore/models";

export const SEMIFINAL_IDS = ["round3-r2-1", "round3-r2-2"] as const;
export const FINAL_ID = "round3-r3-1" as const;

export interface BracketPlan {
  firstRound: Array<{
    id: string;
    seedA: number;
    seedB: number;
    teamA: string;
    teamB: string;
    question: Round3Question;
    nextDuelId: string;
    nextSlot: "A" | "B";
  }>;
  semifinals: Array<{
    id: string;
    question: Round3Question;
    nextDuelId: string;
    nextSlot: "A" | "B";
  }>;
  final: {
    id: string;
    question: Round3Question;
  };
}

function pickQuestion(questions: Round3Question[], index: number): Round3Question {
  if (!questions.length) {
    throw new Error("At least one Round 3 question is required to build the bracket.");
  }
  return questions[index % questions.length];
}

export function buildInitialBracket(topEightTeamIds: string[], questions: Round3Question[]): BracketPlan {
  if (topEightTeamIds.length < 8) {
    throw new Error("Top eight teams are required to seed Round 3.");
  }

  const pairings = [
    { seedA: 1, seedB: 8, teamAIndex: 0, teamBIndex: 7, semifinalIndex: 0, slot: "A" as const },
    { seedA: 2, seedB: 7, teamAIndex: 1, teamBIndex: 6, semifinalIndex: 0, slot: "B" as const },
    { seedA: 3, seedB: 6, teamAIndex: 2, teamBIndex: 5, semifinalIndex: 1, slot: "A" as const },
    { seedA: 4, seedB: 5, teamAIndex: 3, teamBIndex: 4, semifinalIndex: 1, slot: "B" as const },
  ];

  const firstRound = pairings.map((pair, index) => ({
    id: `round3-r1-${pair.seedA}-vs-${pair.seedB}`,
    seedA: pair.seedA,
    seedB: pair.seedB,
    teamA: topEightTeamIds[pair.teamAIndex],
    teamB: topEightTeamIds[pair.teamBIndex],
    question: pickQuestion(questions, index),
    nextDuelId: SEMIFINAL_IDS[pair.semifinalIndex],
    nextSlot: pair.slot as 'A' | 'B',
  }));

  const semifinals = SEMIFINAL_IDS.map((id, index) => ({
    id,
    question: pickQuestion(questions, index + firstRound.length),
    nextDuelId: FINAL_ID,
    nextSlot: (index === 0 ? "A" : "B") as "A" | "B",
  }));

  const final = {
    id: FINAL_ID,
    question: pickQuestion(questions, firstRound.length + semifinals.length),
  };

  return { firstRound, semifinals, final };
}
