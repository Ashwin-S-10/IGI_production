export type StorySegment = {
  id: string;
  label: string;
  body: string;
};

export const CONTEST_STORY = {
  title: "I’M GOING INN — THE COMPLETE STORY",
  subtitle: "Classified Mission Chronicle",
  segments: [
    {
      id: "briefing",
      label: "Briefing",
      body: `I’M GOING INN — THE COMPLETE STORY
For over a decade, the world has been haunted by a single name whispered across borders — The Ghost.
A faceless terrorist whose strikes are precise, unpredictable, and devastating.
Fifty nations have issued warrants.
A hundred intelligence agencies have failed to corner him.
Every lead has gone cold.
Every informant has vanished.
Until one encrypted transmission changed everything.
Deep within the dark web, a fragment of classified intel was discovered — a reference to a sealed data vault hidden somewhere inside hostile territory.
Rumor says this vault contains the exact coordinates of The Ghost’s safehouse — a location so secret that even his own inner circle doesn’t know it completely.
The vault is real.
The location is verified.
The problem: reaching it is nearly impossible.
Enemy forces are high.
Civilians are intermixed.
Sleeper cells are suspected everywhere.
One wrong move, and the entire mission collapses.
The Commander-in-Chief calls for an emergency assembly of all specialized squads.
Hundreds of teams respond.
But only 20 squads can be allowed to enter the operation zone.
To choose the elite twenty, the commander initiates a classified mission-evaluation protocol known as:
“I’M GOING INN.”
A series of three intense trials—each mirroring a real threat they will face on the field.
The strongest will enter.
The weakest will be left behind.
The traitors will be exposed.
No one is safe.`,
    },
    {
      id: "phase1",
      label: "Phase 1 — Algorithm Challenge",
      body: `🟦 PHASE 1 — ALGORITHM CHALLENGE: “I’LL GO”
Before entering enemy territory, a squad must demonstrate their ability to think under pressure, plan with precision, and break through complex patterns.
The commander releases the first challenge:
A set of algorithmic problems designed to simulate battlefield strategy and mission planning.
Teams are given 10 problems, different for Squad FOSS-1 and Squad FOSS-2.
They must solve them quickly, clearly, and efficiently—every second matters.
The top 10 from each group — the fastest, sharpest, and most accurate — earn their clearance.
As they qualify, each squad receives a mission password, the digital key opening the gates to the next phase.
Twenty squads remain.
Their real journey begins.`,
    },
    {
      id: "phase2",
      label: "Phase 2 — Capture the Hostile",
      body: `🟩 THE SILENT DISTRICT
The qualified teams are deployed to the border region near the suspected vault.
The area is strangely quiet.
Fog hangs low, muffling footsteps and swallowing shadows.
Every street feels watched.
Every civilian feels suspicious.
On their second night, a secure transmission arrives:
“New intelligence confirmed.
Hostiles are moving disguised among the civilians.
Identify them.
Do NOT engage.”
Just like spotting bugs hidden inside normal code — the danger is there, invisible unless you know where to look.
The second phase begins.

🟥 PHASE 2 — CAPTURE THE HOSTILE (BUG IDENTIFICATION)
Each team receives 10 code snippets.
At first glance, they appear normal — they compile, they run, they seem harmless.
But beneath the surface, hidden between lines and symbols, lie logical landmines.
Each contestant must:
Identify the bug
Describe what the bug actually is
Mention exactly where the fault lies
They must do this without modifying the code — just like identifying a hidden hostile without triggering an attack.
The first 8 squads who correctly identify the highest number of disguised threats advance.
The rest are reassigned to extraction duty:
Transporting the identified hostiles back to base.
Their mission ends here.
But for those who remain… the real nightmare begins.`,
    },
    {
      id: "phase3",
      label: "Phase 3 — 1v1 Face-Off",
      body: `🌫️ THE VAULT BETRAYAL
The 8 surviving squads push deeper through enemy territory and finally uncover the underground vault.
Layers of encryption guard the digital lock.
It takes time, teamwork, and absolute concentration to break through.
When the final layer collapses, the coordinates flash on the screen—
and every soldier freezes.
The location of The Ghost…
is their own headquarters.
A cold silence follows.
Then the Commander’s voice crackles through:
“Everybody stop.
The mission has been compromised.
We have a leak.
Sleeper cells… are inside your squads.”
Shock spreads across the teams.
The enemy isn’t out there.
The enemy is among them.
To find the traitors and neutralize them, there is only one way.

🟪 PHASE 3 — 1v1 FACE-OFF: “ELIMINATE THE SLEEPER CELL”
The final trial begins — a direct combat of minds.
Each match is a 1v1 battle, a knockout duel of logic, speed, and precision.
Two squads enter.
Only one walks out.
Each duel:
Both receive the same question
Both race to solve
Correctness and speed decide the victor
Loser is eliminated as a potential sleeper cell
Round after round, the battlefield narrows.
Alliances vanish.
Friendship dissolves into survival.
It is no longer about the contest.
It is about proving loyalty.
It is about proving intelligence.
It is about proving worth.
Finally, only one squad remains.
The Commander steps forward:
“You have survived betrayal, deception, logic traps, and combat.
You have proven your loyalty to the mission.
You alone are cleared…
to go inn.”
The mission continues with the ultimate elite squad.
The contest ends —
but the hunt for The Ghost is just beginning.`,
    },
  ] satisfies StorySegment[],
};
