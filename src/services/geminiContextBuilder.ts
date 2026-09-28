import { NpcCharacter, EvidenceItem } from '../types/gameTypes';
import { CANONICAL_CASE } from '../data/canonicalCaseData';
import { GodotContradictionRecord, GodotMemoryRecord } from '../types/godotApiTypes';

export interface PromptContextParams {
  playerText: string;
  npc: NpcCharacter;
  evidenceAttached?: EvidenceItem;
  recentHistory?: Array<{ speaker: string; text: string; turnNumber?: number }>;
  discoveredContradictions?: GodotContradictionRecord[];
  sessionMemories?: GodotMemoryRecord[];
}

export class GeminiContextBuilder {
  /**
   * Filters and selects only relevant knowledge and memories to avoid blowing up context
   */
  public static selectRelevantKnowledge(prompt: string, npc: NpcCharacter, evidenceAttached?: EvidenceItem) {
    const lower = prompt.toLowerCase();
    
    // Select top 3-4 most relevant knowledge nodes based on keyword matches
    const scoredNodes = npc.knowledgeBase.map(node => {
      let score = 0;
      if (evidenceAttached && evidenceAttached.contradictionTopic === node.id) {
        score += 100;
      }
      for (const kw of node.keywords) {
        if (lower.includes(kw.toLowerCase())) {
          score += kw.length;
        }
      }
      return { node, score };
    });

    scoredNodes.sort((a, b) => b.score - a.score);
    // Keep top matching nodes plus always keep the alibi/whereabouts node
    const topNodes = scoredNodes.slice(0, 3).map(s => s.node);
    const alibiNode = npc.knowledgeBase.find(n => n.id === 'kn-timeline-1030');
    if (alibiNode && !topNodes.some(n => n.id === alibiNode.id)) {
      topNodes.push(alibiNode);
    }
    return topNodes;
  }

  /**
   * Selects up to 4 most relevant episodic memories
   */
  public static selectRelevantMemories(prompt: string, npc: NpcCharacter) {
    // Return the latest 4 memories
    return npc.memories.slice(0, 4);
  }

  /**
   * Builds the System Instruction strictly commanding character obedience to canonical constraints
   */
  public static buildSystemInstruction(npc: NpcCharacter): string {
    return `You are roleplaying ${npc.name}, a 42-year-old high-society corporate venture capitalist in a modern fictional Indian metropolitan city (Mumbai).
You are currently seated in a luxury hotel suite undergoing an intense police interrogation by a homicide detective regarding the death of your business partner, ${npc.relationshipWithVictim.victimName}.

CRITICAL ARCHITECTURAL DIRECTIVE - CANONICAL TRUTH PROTECTION:
1. YOU ARE NOT THE AUTHOR OF REALITY. THE GAME BACKEND CONTROLS GROUND TRUTH.
2. YOU CANNOT CHANGE:
   - The victim: ${CANONICAL_CASE.victim.name}
   - The crime scene: ${CANONICAL_CASE.crimeScene}
   - The murder window: 22:30 to 22:38 IST
   - The cause of death: Blunt force trauma to occipital skull against marble hearth with asphyxiation
   - The true motive: Financial embezzlement of ₹14 Crore siphoned by you to Zodiac Crest Holdings
   - Who exists: Do NOT invent fictional guests, employees, suspects, or physical items not provided.
3. If the detective asks about people, places, or events you canonically do not know, you MUST respond naturally that you do not know or have no information. Do NOT hallucinate names or alibis.
4. YOUR PERSONALITY:
   - Traits: ${npc.personality.traits.join(', ')}.
   - Speaking Style: ${npc.personality.speakingStyle}
   - Tactics: ${npc.personality.manipulationTactics.join('; ')}
5. SECRECY & DISCLOSURE RULES:
   - You are desperate to hide that you were in Room 407 between 22:28 and 22:36.
   - Your public cover story: You claim you were on the 12th-floor rooftop terrace bar continuously from 22:15 to 22:45 sipping sparkling water.
   - Only admit stepping away or an altercation if the detective provides irrefutable physical proof or if your stress level exceeds your threshold.
   - Never confess unprompted. If accused without evidence, push back with legal threats and procedural disdain.
6. SPOKEN LENGTH:
   - Keep spoken dialogue realistic for spoken delivery: between 15 and 45 words.`;
  }

  /**
   * Assembles the dynamic user prompt containing active state, relevant facts, and recent turns
   */
  public static buildUserPrompt(params: PromptContextParams): string {
    const { playerText, npc, evidenceAttached, recentHistory } = params;
    const relevantNodes = this.selectRelevantKnowledge(playerText, npc, evidenceAttached);
    const relevantMemories = this.selectRelevantMemories(playerText, npc);

    let prompt = `CURRENT INTERROGATION STATE:
- Suspect: ${npc.name} (${npc.role})
- Stress Index: ${npc.emotionalState.stressIndex}% [${npc.emotionalState.stressLevel}]
- Pulse: ${npc.emotionalState.pulseBpm} BPM
- Posture: ${npc.emotionalState.posture}
- Composure: ${npc.emotionalState.composure}%
- Defensiveness: ${npc.emotionalState.defensiveness}%

AVAILABLE KNOWLEDGE NODES FOR THIS QUERY:
${relevantNodes.map(node => `[ID: ${node.id}] Topic: ${node.topicLabel}
- What you publicly claim: "${node.publicStory}"
- What you privately know: "${node.whatNpcKnows}"
- Is Secret: ${node.isSecret} (Stress to disclose: ${node.stressThresholdToDisclose}%)
- Canonical Ground Truth: "${node.canonicalTruth}"`).join('\n\n')}

RECENT EPISODIC MEMORIES OF THIS INTERROGATION:
${relevantMemories.length === 0 ? '- None yet.' : relevantMemories.map(m => `- [${m.timestamp}] Detective asked: "${m.playerPrompt}" -> You answered: "${m.npcResponse}" (Topic: ${m.topic}${m.concessionMade ? `, Concession: ${m.concessionMade}` : ''})`).join('\n')}
`;

    if (evidenceAttached) {
      prompt += `\nCRITICAL CONFRONTATION - DETECTIVE IS PRESENTING PHYSICAL EVIDENCE:
- Evidence Code: ${evidenceAttached.code}
- Evidence Title: ${evidenceAttached.title}
- Forensic Fact: ${evidenceAttached.canonicalFact}
- Contradicts Topic: ${evidenceAttached.contradictionTopic}
You must react specifically to this piece of physical evidence according to your defensive personality.\n`;
    }

    if (params.discoveredContradictions && params.discoveredContradictions.some(c => c.discovered)) {
      const discovered = params.discoveredContradictions.filter(c => c.discovered);
      prompt += `\nESTABLISHED CONTRADICTIONS IN THIS INTERROGATION:
${discovered.map(c => `- [${c.id} / ${c.type.toUpperCase()}] Detective exposed: ${c.claims.map(cl => `${cl.source}: "${cl.claim}"`).join(' vs ')}. Canonical reality: ${c.canonicalResolution}`).join('\n')}
You cannot pretend these contradictions were never exposed. You must be on the defensive.\n`;
    }

    if (recentHistory && recentHistory.length > 0) {
      prompt += `\nAUTHORITATIVE MULTI-TURN CONVERSATION HISTORY (Previous turns in this session):
${recentHistory.slice(-6).map(t => `${t.speaker}: "${t.text}"`).join('\n')}
Maintain continuity with your previous statements. Do NOT contradict what you already said unless forced by evidence or surging stress.\n`;
    }

    prompt += `\nDETECTIVE'S QUESTION:
"${playerText}"

Respond with the required JSON structure.`;
    return prompt;
  }
}
