import { GodotContradictionRecord } from '../types/godotApiTypes';
import { EvidenceItem } from '../types/gameTypes';

export const CANONICAL_CONTRADICTIONS: GodotContradictionRecord[] = [
  {
    id: 'CON-TIMELINE-01',
    type: 'timeline',
    severity: 'high',
    linkedTopicId: 'kn-timeline-1030',
    evidenceId: 'evd-01',
    claims: [
      {
        source: 'kabir',
        claim: 'Kabir claimed he was continuously at the 12th floor terrace bar sipping sparkling water between 22:15 and 22:45.',
      },
      {
        source: 'evidence:evd-01',
        claim: 'Terrace Bar Void Receipt POS-02 shows order at 22:20, then zero activity until 22:45.',
      },
    ],
    canonicalResolution:
      'Kabir slipped down the service stairs at 22:24 to Suite 407, leaving a 21-minute unaccounted void in his rooftop alibi.',
    discovered: false,
    stressImpact: 14,
  },
  {
    id: 'CON-STAIRWELL-02',
    type: 'timeline',
    severity: 'critical',
    linkedTopicId: 'kn-timeline-1030',
    evidenceId: 'evd-02',
    claims: [
      {
        source: 'kabir',
        claim: 'Kabir claimed he never used the service stairwell to descend to the 4th floor during the murder window.',
      },
      {
        source: 'evidence:evd-02',
        claim: 'Service stairwell motion sensor S-04 logged a tall individual descending to Floor 4 at 22:24 and returning upward at 22:38.',
      },
    ],
    canonicalResolution:
      'Infrared sensor S-04 directly proves physical movement from Floor 12 down to Floor 4 matching Kabir Malhotra during the murder window.',
    discovered: false,
    stressImpact: 16,
  },
  {
    id: 'CON-CUFFLINK-03',
    type: 'physical',
    severity: 'critical',
    linkedTopicId: 'kn-room-407',
    evidenceId: 'evd-03',
    claims: [
      {
        source: 'kabir',
        claim: 'Kabir claimed he was nowhere near Room 407 during the murder window and his earlier 21:30 visit was peaceful.',
      },
      {
        source: 'evidence:evd-03',
        claim: 'Champagne-gold bandhgala cufflink torn during physical struggle recovered right beside Rohan Kapoor\'s body at the marble hearth.',
      },
    ],
    canonicalResolution:
      'The torn cufflink places Kabir inside Room 407 at the very moment Rohan\'s skull was struck against the hearth.',
    discovered: false,
    stressImpact: 20,
  },
  {
    id: 'CON-AUDIT-04',
    type: 'financial',
    severity: 'high',
    linkedTopicId: 'kn-money-audit',
    evidenceId: 'evd-04',
    claims: [
      {
        source: 'kabir',
        claim: 'Kabir claimed Horizon Apex had immaculate financials, zero irregularities, and mutual brotherhood with Rohan.',
      },
      {
        source: 'evidence:evd-04',
        claim: 'Encrypted Forensic Audit Memo proves ₹14 Crore siphoned by Kabir to Zodiac Crest Holdings and Rohan demanded resignation by midnight.',
      },
    ],
    canonicalResolution:
      'Rohan had irrefutable evidence of embezzlement and threatened immediate CBI arrest, giving Kabir an existential murder motive.',
    discovered: false,
    stressImpact: 22,
  },
];

export interface ContradictionEvaluationResult {
  contradiction: GodotContradictionRecord | null;
  isNewDiscovery: boolean;
  stressDelta: number;
}

export class ContradictionEngine {
  /**
   * Generates a fresh clone of canonical contradictions for a new interrogation session
   */
  public static createInitialContradictions(): GodotContradictionRecord[] {
    return JSON.parse(JSON.stringify(CANONICAL_CONTRADICTIONS));
  }

  /**
   * Evaluates player input and presented evidence against the session contradiction graph.
   * Prevents duplicate contradiction registration and duplicate stress surges.
   */
  public static evaluate(
    playerText: string,
    sessionContradictions: GodotContradictionRecord[],
    evidenceId?: string,
    evidenceAttached?: EvidenceItem
  ): ContradictionEvaluationResult {
    const activeEvidenceId = evidenceId || evidenceAttached?.id;
    const lowerText = playerText.toLowerCase();

    // 1. Check if direct evidence matches a contradiction
    let target = sessionContradictions.find(c => activeEvidenceId && c.evidenceId === activeEvidenceId);

    // 2. If no direct evidence attached, check if player text points out a specific contradiction claim
    if (!target) {
      if (
        (lowerText.includes('stair') || lowerText.includes('sensor') || lowerText.includes('s-04') || lowerText.includes('22:24') || lowerText.includes('22:38')) &&
        (lowerText.includes('movement') || lowerText.includes('down') || lowerText.includes('floor 4') || lowerText.includes('lie') || lowerText.includes('lied'))
      ) {
        target = sessionContradictions.find(c => c.id === 'CON-STAIRWELL-02');
      } else if (
        (lowerText.includes('receipt') || lowerText.includes('void') || lowerText.includes('bar log')) &&
        (lowerText.includes('22:20') || lowerText.includes('absent') || lowerText.includes('unaccounted') || lowerText.includes('terrace'))
      ) {
        target = sessionContradictions.find(c => c.id === 'CON-TIMELINE-01');
      } else if (
        (lowerText.includes('cufflink') || lowerText.includes('gold cuff') || lowerText.includes('torn')) &&
        (lowerText.includes('hearth') || lowerText.includes('body') || lowerText.includes('room 407') || lowerText.includes('marble'))
      ) {
        target = sessionContradictions.find(c => c.id === 'CON-CUFFLINK-03');
      } else if (
        (lowerText.includes('audit') || lowerText.includes('14 crore') || lowerText.includes('fourteen crore') || lowerText.includes('zodiac')) &&
        (lowerText.includes('embezzle') || lowerText.includes('siphon') || lowerText.includes('resignation') || lowerText.includes('money'))
      ) {
        target = sessionContradictions.find(c => c.id === 'CON-AUDIT-04');
      }
    }

    if (!target) {
      return { contradiction: null, isNewDiscovery: false, stressDelta: 0 };
    }

    // Check if already discovered
    if (target.discovered) {
      // Duplicate contradiction presentation: do not register again or surge stress
      return {
        contradiction: { ...target },
        isNewDiscovery: false,
        stressDelta: 2, // minor annoyance/repetition fatigue, not full surge
      };
    }

    // New contradiction discovery: mark as discovered
    target.discovered = true;
    return {
      contradiction: { ...target },
      isNewDiscovery: true,
      stressDelta: target.stressImpact,
    };
  }
}
