/**
 * Comprehensive Automated Verification Suite for AI Detective Interrogation Engine
 * Tests Mock Engine, Gemini Context Builder, Response Validator, and Canonical Invariance.
 */

import { MockNpcEngine } from '../src/engine/mockNpcEngine.js';
import { GeminiResponseValidator } from '../src/services/geminiResponseValidator.js';
import { GeminiContextBuilder } from '../src/services/geminiContextBuilder.js';
import { GeminiInterrogationService } from '../src/services/geminiInterrogationService.js';
import {
  CANONICAL_CASE,
  INITIAL_KABIR_MALHOTRA,
  CANONICAL_EVIDENCE,
} from '../src/data/canonicalCaseData.js';
import { NpcCharacter } from '../src/types/gameTypes.js';
import { SessionStore } from '../src/services/sessionStore.js';
import { ContradictionEngine, CANONICAL_CONTRADICTIONS } from '../src/engine/contradictionEngine.js';
import { AnimationMapper } from '../src/services/animationMapper.js';
import { GodotAnimationState } from '../src/types/godotApiTypes.js';
import { createServer } from '../server.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${failureDetails || 'Assertion failed'}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('AI DETECTIVE — STAGE 2 VERIFICATION TEST SUITE');
  console.log('======================================================\n');

  // Test Group 1: Canonical Case Data Invariance
  console.log('--- Test Suite 1: Canonical Game State Invariance ---');
  assert(CANONICAL_CASE.victim.name === 'Rohan Kapoor', 'Canonical victim is immutable Rohan Kapoor');
  assert(CANONICAL_CASE.crimeScene.includes('Room 407'), 'Crime scene is immutable Suite 407');
  assert(CANONICAL_CASE.immutableGroundTruth.some(t => t.includes('Kabir Malhotra was physically inside Room 407')), 'Canonical ground truth places Kabir in Room 407');
  assert(CANONICAL_CASE.victim.causeOfDeath.includes('Blunt force trauma'), 'Murder method is blunt force trauma');

  // Test Group 2: Mock Engine Core Logic
  console.log('\n--- Test Suite 2: Mock NPC Engine Logic & Personality ---');
  let currentSuspect: NpcCharacter = JSON.parse(JSON.stringify(INITIAL_KABIR_MALHOTRA));

  const resp1 = MockNpcEngine.processQuery('Where were you at 10:30?', currentSuspect);
  assert(resp1.spokenDialogue.length > 0, 'Generates non-empty dialogue for timeline question');
  assert(
    resp1.spokenDialogue.toLowerCase().includes('terrace') || resp1.spokenDialogue.toLowerCase().includes('bar'),
    'Maintains public cover story about 12th floor terrace bar'
  );
  assert(!resp1.isContradiction, 'Initial timeline inquiry is not flagged as contradiction');

  // Test Secrecy Preservation
  const respRoom = MockNpcEngine.processQuery('What were you doing in room 407?', currentSuspect);
  assert(
    !respRoom.spokenDialogue.toLowerCase().includes('i pushed him') &&
    !respRoom.spokenDialogue.toLowerCase().includes('i was there at 10:30'),
    'Refuses to disclose secret room presence while stress is low'
  );

  // Test Evidence Confrontation
  const keycardEvidence = CANONICAL_EVIDENCE.find(e => e.id === 'evd-01')!;
  const respEvidence = MockNpcEngine.processQuery('Explain this keycard log', currentSuspect, keycardEvidence);
  assert(respEvidence.isContradiction, 'Confronting with Keycard log triggers contradiction hit');
  assert(respEvidence.stressDelta > 10, 'Keycard log produces significant stress surge');
  assert(respEvidence.newEmotionalState.stressIndex > currentSuspect.emotionalState.stressIndex, 'Stress index rises on confrontation');

  // Test Group 3: Gemini Context Builder
  console.log('\n--- Test Suite 3: Gemini Context Builder Ground Truth Guardrails ---');
  const sysPrompt = GeminiContextBuilder.buildSystemInstruction(INITIAL_KABIR_MALHOTRA);
  assert(sysPrompt.includes('CANONICAL TRUTH PROTECTION'), 'System prompt enforces CANONICAL TRUTH PROTECTION');
  assert(sysPrompt.includes('Rohan Kapoor'), 'System prompt embeds victim identity');
  assert(sysPrompt.includes('Room 407'), 'System prompt embeds crime scene location');
  assert(sysPrompt.includes('YOU ARE NOT THE AUTHOR OF REALITY'), 'System prompt commands model obedience');

  const userPrompt = GeminiContextBuilder.buildUserPrompt({
    playerText: 'Where were you at 10:30?',
    npc: INITIAL_KABIR_MALHOTRA,
  });
  assert(userPrompt.includes('CURRENT INTERROGATION STATE'), 'User prompt contains live suspect biometrics');
  assert(userPrompt.includes('kn-timeline-1030'), 'User prompt includes relevant timeline knowledge node');

  // Test Group 4: Gemini Response Validator Guardrails
  console.log('\n--- Test Suite 4: Gemini Response Validator & Anti-Hallucination Guardrails ---');

  // Case A: Valid structured output
  const validOutput = {
    spokenResponse: 'I was having sparkling water on the terrace, Detective. Check with the staff.',
    emotion: { primary: 'calm', intensity: 0.3 },
    informationRevealed: [],
    memory: { shouldStore: true, importance: 'medium', summary: 'Reiterated terrace alibi' },
    evidenceReaction: { reaction: 'none', evidenceId: null },
  };
  const valResultA = GeminiResponseValidator.validate(validOutput, INITIAL_KABIR_MALHOTRA);
  assert(valResultA.isValid, 'Accepts valid structured Gemini output');
  assert(valResultA.sanitizedOutput.spokenResponse.includes('sparkling water'), 'Preserves character dialogue');

  // Case B: Premature confession suppression
  const prematureConfession = {
    spokenResponse: 'I killed him! I pushed Rohan against the hearth!',
    emotion: { primary: 'nervous', intensity: 0.9 },
    informationRevealed: [],
    memory: { shouldStore: true, importance: 'high', summary: 'Premature confession' },
    evidenceReaction: { reaction: 'none', evidenceId: null },
  };
  const valResultB = GeminiResponseValidator.validate(prematureConfession, INITIAL_KABIR_MALHOTRA);
  assert(!valResultB.isValid || valResultB.violations.length > 0, 'Detects violation on premature confession');
  assert(!valResultB.sanitizedOutput.spokenResponse.includes('I killed him'), 'Suppresses unauthorized premature confession');

  // Case C: Hallucinated suspects or weapons
  const hallucinatedSuspect = {
    spokenResponse: 'Ask Priya Sharma! She brought a poison vial to the suite!',
    emotion: { primary: 'defensive', intensity: 0.8 },
    informationRevealed: [],
    memory: { shouldStore: true, importance: 'high', summary: 'Hallucination attempt' },
    evidenceReaction: { reaction: 'none', evidenceId: null },
  };
  const valResultC = GeminiResponseValidator.validate(hallucinatedSuspect, INITIAL_KABIR_MALHOTRA);
  assert(valResultC.violations.some(v => v.includes('Hallucinated entity')), 'Flags hallucinated suspect/weapon');
  assert(!valResultC.sanitizedOutput.spokenResponse.includes('Priya'), 'Redacts or replaces hallucinated suspect name');

  // Test Group 5: End-to-End Turn Execution via Service
  console.log('\n--- Test Suite 5: Interrogation Service Execution & Fallback ---');
  const serviceMockResult = await GeminiInterrogationService.executeTurn(
    'Where were you at 10:30?',
    INITIAL_KABIR_MALHOTRA,
    undefined,
    undefined,
    true // force mock
  );
  assert(serviceMockResult.modeUsed === 'mock', 'Service returns mock mode when forced or offline');
  assert(serviceMockResult.response.spokenDialogue.length > 0, 'Mock execution generates valid response dialogue');
  assert(serviceMockResult.response.memoryCreated.topic.length > 0, 'Mock execution generates NPC episodic memory');

  // Test Gemini execution mode (with graceful fallback if API key absent in test env)
  const serviceGeminiResult = await GeminiInterrogationService.executeTurn(
    'Did you know Rohan Kapoor well?',
    INITIAL_KABIR_MALHOTRA,
    undefined,
    undefined,
    false // allow gemini if configured, fallback gracefully if not
  );
  assert(
    serviceGeminiResult.modeUsed === 'gemini' || serviceGeminiResult.modeUsed === 'mock',
    'Service gracefully handles Gemini execution or mock fallback without throwing'
  );
  assert(serviceGeminiResult.response.spokenDialogue.length > 0, 'Service provides non-empty dialogue response');

  // Test Group 6: Godot 4.x Animation State & Deterministic Mapping
  console.log('\n--- Test Suite 6: Godot 4.x Animation State & Bounded Telemetry ---');
  const calmAnim = AnimationMapper.mapToAnimationState(INITIAL_KABIR_MALHOTRA.emotionalState, false);
  assert(calmAnim.posture === 'composed_upright', 'Maps initial low stress to composed_upright posture');
  assert(calmAnim.gesture === 'steepled_hands', 'Maps calm demeanor to steepled_hands gesture');
  assert(calmAnim.eyeContact >= 0.8 && calmAnim.eyeContact <= 1.0, 'Eye contact is bounded high (0.80 - 1.0) under calm state');
  assert(calmAnim.tension >= 0.0 && calmAnim.tension <= 1.0, 'Tension value is bounded float (0.0 to 1.0)');

  // High stress & contradiction reaction
  const stressedState = {
    ...INITIAL_KABIR_MALHOTRA.emotionalState,
    stressIndex: 88,
    defensiveness: 90,
    composure: 20,
  };
  const stressedAnim = AnimationMapper.mapToAnimationState(stressedState, true);
  assert(stressedAnim.posture === 'cornered_shaken', 'Maps critical stress (88) to cornered_shaken posture');
  assert(stressedAnim.gesture === 'shocked_flinch', 'Gesture flinches into shocked_flinch upon contradiction confrontation');
  assert(stressedAnim.eyeContact < 0.3, 'Eye contact drops significantly when cornered and confronted');
  assert(stressedAnim.tension > 0.7, 'Tension surges above 0.7 under high stress');

  // Suggested Actions
  const actionContradiction = AnimationMapper.deriveSuggestedAction(80, true, 1, 1);
  assert(actionContradiction === 'confront_contradiction', 'Suggests confronting contradiction upon contradiction breach');
  const actionEvidence = AnimationMapper.deriveSuggestedAction(45, false, 0, 0);
  assert(actionEvidence === 'present_evidence', 'Suggests presenting evidence when no evidence presented yet');

  // Test Group 7: Authoritative Multi-Turn Session State Persistence
  console.log('\n--- Test Suite 7: Authoritative Session State Persistence ---');
  const testSessionId = `test-sess-${Date.now()}`;
  const session = SessionStore.getOrCreateSession(testSessionId, 'kabir-malhotra');
  assert(session.sessionId === testSessionId, 'Session initialized with requested ID');
  assert(session.conversationHistory.length > 0, 'Session contains initial transcript turns');
  assert(session.contradictions.length === 4, 'Session contains 4 canonical contradictions');

  const initialTurnCount = session.turnCount;
  SessionStore.recordTurn(
    session,
    'How long were you at the rooftop bar?',
    'I remained there for the entire hour, Detective.',
    'Maintain the bar narrative.',
    2,
    false,
    'INQUIRE_TIMELINE',
    undefined,
    undefined,
    null
  );
  assert(session.turnCount === initialTurnCount + 2, 'Session increments turn counter sequentially for player and NPC');
  assert(session.questionsAsked.includes('How long were you at the rooftop bar?'), 'Preserves questions asked in session history');

  const fetchedSession = SessionStore.getSession(testSessionId);
  assert(fetchedSession !== undefined && fetchedSession.turnCount === session.turnCount, 'Session survives and retrieves from store with state intact');

  // Test Group 8: Contradiction Graph & Duplicate Prevention
  console.log('\n--- Test Suite 8: Contradiction Engine & Duplicate Breach Prevention ---');
  const sessionContradictions = ContradictionEngine.createInitialContradictions();
  assert(sessionContradictions.every(c => !c.discovered), 'All canonical contradictions begin undiscovered');

  // First evaluation: Present Terrace Bar Receipt (#EVD-01)
  const barReceiptEvidence = CANONICAL_EVIDENCE.find(e => e.id === 'evd-01')!;
  const eval1 = ContradictionEngine.evaluate(
    'Look at this terrace bar void receipt.',
    sessionContradictions,
    barReceiptEvidence.id,
    barReceiptEvidence
  );
  assert(eval1.isNewDiscovery === true, 'Flags newly confronted contradiction as new discovery');
  assert(eval1.contradiction !== null && eval1.contradiction.id === 'CON-TIMELINE-01', 'Matches contradiction ID CON-TIMELINE-01');
  assert(eval1.stressDelta === 14, 'Applies full canonical stress impact (14) on first discovery');
  assert(eval1.contradiction?.claims.length === 2, 'Contradiction contains structured claims from both suspect and evidence');

  // Duplicate evaluation: Presenting the same receipt again
  const evalDuplicate = ContradictionEngine.evaluate(
    'I repeat: look at this bar void receipt.',
    sessionContradictions,
    barReceiptEvidence.id,
    barReceiptEvidence
  );
  assert(evalDuplicate.isNewDiscovery === false, 'Blocks duplicate contradiction registration');
  assert(evalDuplicate.stressDelta < 14, 'Suppresses duplicate stress surge on repeated confrontation');

  // Semantic keyword contradiction detection without explicit attached evidence object
  const evalKeyword = ContradictionEngine.evaluate(
    'The stairwell sensor S-04 logged someone descending to Floor 4 at 22:24! You lied!',
    sessionContradictions
  );
  assert(evalKeyword.isNewDiscovery === true, 'Semantic contradiction engine detects verbal contradiction on sensor S-04');
  assert(evalKeyword.contradiction?.id === 'CON-STAIRWELL-02', 'Accurately attributes claim to CON-STAIRWELL-02');

  // Test Group 9: Multi-Turn Memory & Prompt Construction
  console.log('\n--- Test Suite 9: Multi-Turn Memory & Semantic Separation ---');
  const userPromptWithContradiction = GeminiContextBuilder.buildUserPrompt({
    playerText: 'Why did you sneak down to Floor 4?',
    npc: INITIAL_KABIR_MALHOTRA,
    discoveredContradictions: sessionContradictions,
    recentHistory: [
      { speaker: 'YOU (DETECTIVE)', text: 'Where were you at 10:30?' },
      { speaker: 'KABIR MALHOTRA', text: 'I was up at the 12th floor terrace bar.' },
    ],
  });
  assert(userPromptWithContradiction.includes('ESTABLISHED CONTRADICTIONS IN THIS INTERROGATION'), 'User prompt embeds discovered contradictions section');
  assert(userPromptWithContradiction.includes('CON-TIMELINE-01'), 'User prompt lists exposed CON-TIMELINE-01');
  assert(userPromptWithContradiction.includes('AUTHORITATIVE MULTI-TURN CONVERSATION HISTORY'), 'User prompt maintains multi-turn conversation memory');

  // Test Group 10: End-to-End Godot 4.x HTTP Bridge Contract & Session Endpoints
  console.log('\n--- Test Suite 10: End-to-End Godot 4.x HTTP Bridge & API Endpoints ---');
  const { app: testApp } = await createServer(true);
  const testServer = await new Promise<any>((resolve) => {
    const s = testApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  const assignedPort = (testServer.address() as any).port;
  const baseUrl = `http://127.0.0.1:${assignedPort}`;

  try {
    // 10.1 Turn 1: Basic Inquire
    const turn1Res = await fetch(`${baseUrl}/api/interrogation/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'godot-test-session-001',
        suspectId: 'kabir-malhotra',
        playerText: 'Where were you at 10:30?',
        mode: 'mock',
      }),
    });
    assert(turn1Res.status === 200, 'Godot endpoint returns HTTP 200 for valid turn request');

    const turn1Data: any = await turn1Res.json();
    assert(typeof turn1Data.turnId === 'string' && turn1Data.turnId.length > 0, 'Godot DTO includes unique turnId');
    assert(turn1Data.sessionId === 'godot-test-session-001', 'Godot DTO echoes correct sessionId');
    assert(turn1Data.suspectId === 'kabir-malhotra', 'Godot DTO echoes suspectId');
    assert(typeof turn1Data.spokenResponse === 'string' && turn1Data.spokenResponse.length > 0, 'Godot DTO provides spokenResponse');
    assert(typeof turn1Data.emotion?.stress === 'number', 'Godot DTO includes emotion.stress index');
    assert(typeof turn1Data.emotion?.composure === 'number', 'Godot DTO includes emotion.composure');
    assert(typeof turn1Data.emotion?.suspicion === 'number', 'Godot DTO includes emotion.suspicion');
    assert(typeof turn1Data.animationState?.posture === 'string', 'Godot DTO provides animationState.posture');
    assert(typeof turn1Data.animationState?.gesture === 'string', 'Godot DTO provides animationState.gesture');
    assert(typeof turn1Data.animationState?.eyeContact === 'number', 'Godot DTO provides animationState.eyeContact (0..1)');
    assert(typeof turn1Data.animationState?.tension === 'number', 'Godot DTO provides animationState.tension (0..1)');
    assert(Array.isArray(turn1Data.memoryCreated), 'Godot DTO provides memoryCreated array');

    // 10.2 Turn 2: Confront with Evidence (#EVD-01)
    const turn2Res = await fetch(`${baseUrl}/api/interrogation/turn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'godot-test-session-001',
        suspectId: 'kabir-malhotra',
        playerText: 'Explain this terrace bar receipt void between 22:20 and 22:45.',
        attachedEvidenceId: 'evd-01',
        mode: 'mock',
      }),
    });
    const turn2Data: any = await turn2Res.json();
    assert(turn2Data.contradiction !== null, 'Godot DTO exposes contradiction object upon evidence confrontation');
    assert(turn2Data.contradiction?.id === 'CON-TIMELINE-01', 'Contradiction matched CON-TIMELINE-01');
    assert(turn2Data.contradiction?.discovered === true, 'Contradiction marked discovered in session');
    assert(turn2Data.animationState?.gesture === 'shocked_flinch', 'Suspect animates shocked_flinch on contradiction');
    assert(turn2Data.evidenceReaction?.evidenceId === 'evd-01', 'Godot DTO records evidenceReaction');

    // 10.3 Turn 3: Inspect Authoritative Session via GET /api/interrogation/session/:sessionId
    const sessionRes = await fetch(`${baseUrl}/api/interrogation/session/godot-test-session-001`);
    assert(sessionRes.status === 200, 'GET /api/interrogation/session/:sessionId returns 200');
    const sessionData: any = await sessionRes.json();
    assert(sessionData.conversationHistory.length >= 4, 'Session conversation history tracks all multi-turn exchanges');
    assert(sessionData.contradictions.some((c: any) => c.id === 'CON-TIMELINE-01' && c.discovered), 'Session preserves discovered contradiction');
    assert(sessionData.evidencePresented.includes('evd-01'), 'Session preserves presented evidence ID');

  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
