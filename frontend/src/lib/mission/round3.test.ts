import { describe, expect, it } from 'vitest';

import type { Round3Question } from '@/lib/firestore/models';
import { buildInitialBracket, FINAL_ID, SEMIFINAL_IDS } from './round3';

describe('buildInitialBracket', () => {
  const questions: Round3Question[] = [
    {
      id: 'r3q-1',
      title: 'Secure Hash Showdown',
      prompt: 'Explain why collision resistance matters.',
      expectedAnswer: 'Because collisions undermine cryptographic guarantees.',
      timeLimitMinutes: 10,
      tags: ['crypto'],
    },
    {
      id: 'r3q-2',
      title: 'Binary Fuse',
      prompt: 'Return true if any pair XOR equals target.',
      expectedAnswer: 'Use a hash set to track complements.',
      timeLimitMinutes: 8,
      tags: ['bitwise'],
    },
    {
      id: 'r3q-3',
      title: 'Cache Eviction',
      prompt: 'Design an LFU cache.',
      expectedAnswer: 'Linked lists + map.',
      timeLimitMinutes: 12,
      tags: ['design'],
    },
  ];

  const teams = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  it('pairs seeds correctly and assigns downstream slots', () => {
    const plan = buildInitialBracket(teams, questions);

    expect(plan.firstRound).toHaveLength(4);
    const [match1, match2, match3, match4] = plan.firstRound;
    expect(match1.teamA).toBe('A');
    expect(match1.teamB).toBe('H');
    expect(match1.nextDuelId).toBe(SEMIFINAL_IDS[0]);
    expect(match1.nextSlot).toBe('A');

    expect(match2.teamA).toBe('B');
    expect(match2.teamB).toBe('G');
    expect(match2.nextDuelId).toBe(SEMIFINAL_IDS[0]);
    expect(match2.nextSlot).toBe('B');

    expect(match3.teamA).toBe('C');
    expect(match3.teamB).toBe('F');
    expect(match3.nextDuelId).toBe(SEMIFINAL_IDS[1]);
    expect(match3.nextSlot).toBe('A');

    expect(match4.teamA).toBe('D');
    expect(match4.teamB).toBe('E');
    expect(match4.nextDuelId).toBe(SEMIFINAL_IDS[1]);
    expect(match4.nextSlot).toBe('B');
  });

  it('rotates questions through quarterfinals, semifinals, and final', () => {
    const plan = buildInitialBracket(teams, questions);
    const usedQuestionIds = [
      ...plan.firstRound.map((duel) => duel.question.id),
      ...plan.semifinals.map((duel) => duel.question.id),
      plan.final.question.id,
    ];
    expect(usedQuestionIds).toEqual(['r3q-1', 'r3q-2', 'r3q-3', 'r3q-1', 'r3q-2', 'r3q-3', 'r3q-1']);
  });

  it('creates semifinal placeholders pointing at the final', () => {
    const plan = buildInitialBracket(teams, questions);
    expect(plan.semifinals).toHaveLength(2);
    plan.semifinals.forEach((duel, index) => {
      expect(duel.id).toBe(SEMIFINAL_IDS[index]);
      expect(duel.nextDuelId).toBe(FINAL_ID);
      expect(duel.nextSlot).toBe(index === 0 ? 'A' : 'B');
    });
    expect(plan.final.id).toBe(FINAL_ID);
  });

  it('requires eight teams to seed the bracket', () => {
    expect(() => buildInitialBracket(teams.slice(0, 6), questions)).toThrow(/Top eight teams/);
  });
});
