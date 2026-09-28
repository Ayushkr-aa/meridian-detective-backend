export interface ArchitectureTopic {
  id: string;
  number: number;
  title: string;
  category: 'CORE_ENGINE' | 'STATE_DATA' | 'AI_VOICE' | 'INFRA_BACKEND';
  summary: string;
  details: string[];
  schemaOrCode?: string;
}

export const ARCHITECTURE_TOPICS: ArchitectureTopic[] = [
  {
    id: 'ui-components',
    number: 1,
    title: 'UI Component Structure',
    category: 'CORE_ENGINE',
    summary: 'Perimeter-anchored Glassmorphic HUD overlaying a live 3D Godot viewport or cinematic camera backdrop.',
    details: [
      'TacticalHeader: Case metadata (File #04, 23:42 IST, The Grand Malabar Suite 804 // Room 407), live Mic status, FPS counter, engine heartbeat.',
      'TargetProfileCard (Top-Left): POI reference (REF-407A), suspect portrait metadata (Kabir Malhotra, 42), legal status, master access credentials.',
      'BiometricTelemetryHUD (Top-Center): Real-time Stress Index percentage, animated ECG pulse waveform (BPM), 5-pip posture disposition bar.',
      'DockToggles (Top-Right): Hotkey badges [TAB] for Evidence Tray, [H] for Transcript & NPC Memory Drawer.',
      'FlyoutTranscriptDrawer (Left Flank): Multi-tab drawer featuring Transcript Log, NPC Memory Inspector, and Detective Deduction Notebook.',
      'ConfrontationEvidenceDock (Right Flank): Expandable tactical inventory displaying physical evidence pieces (#EVD-01 to #EVD-04) with trigger pins.',
      'CinematicSubtitleBanner (Bottom-Center): Dynamic speaker nametag, audio stream status, voice match percentage, typewriter dialogue text.',
      'InteractionConsole (Bottom Dock): Push-to-Talk spacebar trigger indicator, text terminal query input, Godot hotkey hint strip.'
    ],
    schemaOrCode: `// Component Hierarchy Tree
<InterrogationHUDContainer>
  ├── <HeaderTelemetryBar />
  ├── <SuspectProfileCard suspect={kabirMalhotra} />
  ├── <BiometricsTelemetryBar ecg={pulse} stress={stressLevel} />
  ├── <QuickToggleDock tabEvidence={isOpen} hTranscript={isOpen} />
  ├── <TranscriptDrawer history={turns} memories={npcMemories} deductions={playerKnowledge} />
  ├── <EvidenceConfrontationDock inventory={evidenceState} onSelect={presentEvidence} />
  ├── <SubtitleBanner speaker="KABIR MALHOTRA" dialogue={currentNpcSpeech} />
  └── <PlayerQueryConsole onSendText={submitQuery} onVoicePress={holdPtt} />
</InterrogationHUDContainer>`
  },
  {
    id: 'game-state',
    number: 2,
    title: 'Game State Required by Interrogation Interface',
    category: 'STATE_DATA',
    summary: 'Authoritative runtime state tracking interrogation progress, pressure thresholds, and unlock conditions.',
    details: [
      'Interrogation Session ID & Timestamp (In-game Indian Standard Time, e.g., 23:42 IST).',
      'Suspect Psychological State: Stress (0-100), Demeanor (COMPOSED, CALCULATING, DEFENSIVE, TENSE, CORNERED), Heartbeat BPM (72 - 145).',
      'Contradiction Breaches: Counter of caught lies (e.g., 2/4 required to unlock confession or search warrant).',
      'Discovered Clues & Presented Clues: Set of evidence IDs currently revealed to suspect in this conversation.',
      'Current Turn & Composure Gauge: Depletion of composure when confronted with verifiable physical facts.',
      'HUD Interaction State: Dock visibility toggles, voice recording state (IDLE, RECORDING, PROCESSING, STREAMING).'
    ],
    schemaOrCode: `interface InterrogationGameState {
  case_id: "CASE-04-MALABAR-407";
  session_id: string;
  suspect_id: "npc-kabir-malhotra";
  game_time_ist: "23:42:00";
  stress_index: number;       // 0 to 100
  pulse_bpm: number;          // 70 to 150
  posture: "COMPOSED" | "CALCULATING" | "DEFENSIVE" | "TENSE" | "CORNERED";
  contradictions_unlocked: string[]; // ["kn-timeline-1030", "kn-room-407"]
  presented_evidence_ids: string[];  // ["EVD-01", "EVD-03"]
  player_knowledge_score: number;    // 0-100
  interrogation_status: "ACTIVE" | "SUSPECT_CONFESSED" | "SUSPECT_WALKED_OUT";
}`
  },
  {
    id: 'npc-data',
    number: 3,
    title: 'NPC Data Required',
    category: 'STATE_DATA',
    summary: 'Static canonical persona, psychological vulnerabilities, guarded secrets, and voice acoustic profiles.',
    details: [
      'Persona & Linguistic Cadence: Kabir Malhotra, 42, sophisticated South Mumbai elite tone, subtle diplomatic deflections, controlled composure.',
      'Hard Canonical Truth (The Backend Secrets): What Kabir ACTUALLY did (Entered Room 407 at 10:28 via fire stairs, struggled with Rohan over briefcase, Rohan struck marble hearth).',
      'Fabricated Alibi (What NPC pretends): Claims he was at the 12th-floor rooftop terrace bar continuously sipping sparkling water between 22:15 and 22:45.',
      'Trigger Vulnerabilities: Panics when confronted with terrace bar void receipt, fire stair motion sensors, torn silk cufflink, and ₹14 Crore audit memo.',
      'Voice Actor Model ID: Prestige South Asian male voice profile with pitch/speed modulation based on stress level.'
    ],
    schemaOrCode: `interface NpcPersonaDefinition {
  npc_id: "npc-kabir-malhotra";
  full_name: "Kabir Malhotra";
  occupation: "Business Partner of the Victim, Horizon Apex Group";
  voice_id: "voice-in-prestige-male-02";
  alibi_claims: [
    { topic: "time_22_15_to_22_45", claim: "Sitting continuously at 12th floor terrace bar" },
    { topic: "room_407", claim: "Left Rohan alive and happy at 21:55 PM" }
  ];
  secrets: [
    { secret_id: "SEC-01", description: "Embezzled ₹14 Crore to Zodiac Crest Holdings", stress_threshold: 74 },
    { secret_id: "SEC-02", description: "Descended stairs to Room 407 at 10:28; altercation occurred", stress_threshold: 82 }
  ];
  speech_style: "Polite, haughty, calculated South Mumbai venture capitalist; slips into defensive pushback under high duress";
}`
  },
  {
    id: 'evidence-data',
    number: 4,
    title: 'Evidence Data Required',
    category: 'STATE_DATA',
    summary: 'Immutable physical clues gathered in the hotel with verifiable cryptographic/forensic timestamps.',
    details: [
      'Evidence Identifier: Unique canonical code (#EVD-01, #EVD-02, #EVD-03, #EVD-04).',
      'Item Metadata: Name, forensic discovery point, recovery timestamp, 3D item mesh reference for Godot.',
      'Canonical Verifiable Fact: The objective truth this clue establishes (immune to NPC gaslighting).',
      'Contradiction Target Topic: The specific lie in the NPC alibi this evidence directly shatters.',
      'Stress Surge Multiplier: Numeric penalty applied to the suspect\'s composure upon successful presentation.'
    ],
    schemaOrCode: `interface EvidenceRecord {
  id: "evd-03";
  code: "#EVD-03";
  name: "Torn Champagne Cufflink";
  discovery_location: "Beside marble hearth in Room 407";
  timestamp_found: "22:50 IST";
  canonical_fact: "Handmade Italian silk-wrapped cufflink matching Kabir Malhotra's custom bandhgala";
  debunks_alibi_topic: "kn-room-407";
  stress_delta: +20;
  icon_symbol: "watch";
}`
  },
  {
    id: 'conversation-state',
    number: 5,
    title: 'Conversation State',
    category: 'STATE_DATA',
    summary: 'Sliding memory window preserving dialogue coherence without exceeding token budget or leaking truth.',
    details: [
      'Chronological Turn Log: Pairings of Detective query and NPC spoken response with timestamps.',
      'Active Sub-topics Discussed: e.g., ["kn-timeline-1030", "kn-room-407", "kn-money-audit"].',
      'Lies Caught in Current Session: Tracking which falsehoods have already been exposed to prevent the NPC from repeating refuted claims.',
      'Pending Concessions: Facts the suspect has been forced to admit (e.g., "Admitted descending stairs at 10:28 to make a phone call").'
    ],
    schemaOrCode: `interface InterrogationConversationMemory {
  turn_count: number;
  recent_history: Array<{
    turn: number;
    speaker: "PLAYER" | "NPC";
    utterance: string;
    timestamp: string;
  }>;
  established_admissions: string[]; // ["Admitted stepping away from the bar for 12 minutes"]
  active_contradictions: string[];
}`
  },
  {
    id: 'ai-request-response',
    number: 6,
    title: 'AI Request/Response Structure',
    category: 'AI_VOICE',
    summary: 'Strict Pydantic / TypeScript schema enforcing structured JSON output from Gemini with dialogue, emotion, and telemetry.',
    details: [
      'Gemini System Prompt: Injects character identity, current stress, known lies, immutable case facts, and boundary rules.',
      'Canonical Guardrail Rule: The LLM receives "CANONICAL FACTS YOU MUST NEVER CONTRADICT" and "LIES YOU ARE TRYING TO MAINTAIN".',
      'Structured Response Payload: Dialogue string, speech inflection tags, stress delta, animation trigger for Godot, and lie status.',
      'Banned Outputs: LLM is strictly prohibited from inventing new physical crime scene evidence or confessing before stress > threshold.'
    ],
    schemaOrCode: `// Gemini Output Schema (Enforced via responseSchema)
interface GeminiInterrogationResponse {
  spoken_dialogue: string;           // "The receipt gap...? Detective, people step into the washroom!"
  internal_monologue: string;        // "He presented the bar receipt. I must challenge chain of custody."
  stress_delta: number;              // +14
  posture_state: "COMPOSED" | "DEFENSIVE" | "TENSE" | "CORNERED";
  animation_trigger: "cross_arms" | "sweat_wipe" | "avoid_eye_contact" | "slam_table";
  facial_blendshape_preset: "tension_brow_high" | "jaw_clench";
  is_alibi_broken: boolean;
  lie_detected_by_npc: boolean;
}`
  },
  {
    id: 'voice-architecture',
    number: 7,
    title: 'Voice Input / Output Architecture',
    category: 'AI_VOICE',
    summary: 'Real-time Push-to-Talk speech recognition and low-latency streaming TTS playback in Godot.',
    details: [
      'Input Flow (STT): Player holds Spacebar -> Godot AudioCapture captures 16kHz PCM stream -> Sends via WebSocket / WebRTC to FastAPI -> Whisper or Gemini Live Speech-to-Text transcribes query.',
      'Whisper / Gemini Transcriber: Emits real-time partial transcript to HUD Subtitle Console while player is speaking.',
      'Output Flow (TTS): FastAPI streams dialogue chunks to ElevenLabs or Gemini 2.0 Flash Audio -> Returns OGG Vorbis / PCM chunks to Godot.',
      'Audio Synchronization: Godot AudioStreamPlayer feeds phoneme/viseme data into NPC facial blendshapes (MouthOpen, LipTighten) for lip-sync.'
    ],
    schemaOrCode: `// Voice Data Flow Pipeline
[Player Voice (Mic)] 
  -> Godot AudioEffectCapture 
  -> Opus/PCM WebSocket chunk 
  -> FastAPI (/api/v1/voice/stt)
  -> Real-time Detective Query text
  -> Interrogation Engine
  -> Gemini (Dialogue generation)
  -> FastAPI (/api/v1/voice/tts)
  -> Godot AudioStreamPlayer + LipSync BlendTree`
  },
  {
    id: 'backend-api',
    number: 8,
    title: 'Backend API Requirements (FastAPI)',
    category: 'INFRA_BACKEND',
    summary: 'High-performance asynchronous REST & WebSocket service mediating between Godot game client and AI models.',
    details: [
      'POST /api/v1/interrogation/query: Transmits text question, evidence presented, and session ID; returns verified NPC response.',
      'WS /api/v1/interrogation/stream: Low-latency duplex stream for Push-to-Talk audio, partial transcripts, and speech synthesis.',
      'POST /api/v1/interrogation/confront: Presents physical evidence; triggers deterministic contradiction check before calling Gemini.',
      'GET /api/v1/interrogation/session/{id}: Retrieves current psychological metrics, memory window, and dossier state.',
      'POST /api/v1/interrogation/validate: Validation middleware verifying Gemini output against PostgreSQL canonical ground truth.'
    ],
    schemaOrCode: `# FastAPI Route Signatures
@app.post("/api/v1/interrogation/query", response_model=InterrogationTurnResponse)
async def submit_interrogation_turn(
    payload: PlayerTurnRequest,
    db: AsyncSession = Depends(get_db)
): ...

@app.websocket("/api/v1/interrogation/voice-ws")
async def voice_interrogation_socket(websocket: WebSocket): ...`
  },
  {
    id: 'database-requirements',
    number: 9,
    title: 'Database Requirements (PostgreSQL)',
    category: 'INFRA_BACKEND',
    summary: 'Relational storage preserving immutable case ground truth, NPC psychological schemas, and historical logs.',
    details: [
      'Table: cases (case_id, title, setting, victim_name, true_culprit_id, crime_timeline_json).',
      'Table: npcs (npc_id, case_id, name, persona_prompt, initial_alibi, base_stress, confession_threshold).',
      'Table: evidence (evidence_id, case_id, code, canonical_fact, debunks_topic, stress_weight).',
      'Table: interrogation_sessions (session_id, player_id, current_stress, contradictions_count, created_at).',
      'Table: interrogation_turns (turn_id, session_id, speaker, text, evidence_attached, stress_after, created_at).'
    ],
    schemaOrCode: `-- PostgreSQL Schema Sample
CREATE TABLE canonical_case_facts (
    fact_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id VARCHAR(32) NOT NULL,
    timeline_minute INT NOT NULL,
    event_description TEXT NOT NULL,
    associated_evidence_id VARCHAR(32),
    is_public_knowledge BOOLEAN DEFAULT FALSE
);

CREATE TABLE interrogation_transcripts (
    turn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES interrogation_sessions(session_id),
    speaker VARCHAR(32) NOT NULL,
    utterance TEXT NOT NULL,
    stress_snapshot INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`
  },
  {
    id: 'godot-communication',
    number: 10,
    title: 'How Interface Communicates with Godot',
    category: 'CORE_ENGINE',
    summary: 'Two architecture patterns: Native Godot Control UI vs Embedded CEF/WebSockets HUD.',
    details: [
      'Native Godot Option (Recommended for 120 FPS): UI is implemented as Godot 4 Control Nodes (Theme, NinePatchRect, RichTextLabel) matching the Stitch CSS styling.',
      'Embedded Web Option (AI Studio Prototype): HUD is a web overlay running on local WebSockets / HTTP, rendering in CEF or mirroring telemetry.',
      'Godot Signal Architecture: HTTPRequest node dispatches JSON payloads to FastAPI; emits signal interrogation_response_received(payload).',
      'Godot Animation Coordinator: Triggers NPC skeletal animations (IdleDefensive -> LookAway -> TableSlam) based on returned animation_trigger.'
    ],
    schemaOrCode: `# Godot 4 GDScript Client Implementation
extends Node
signal suspect_spoke(text: String, stress: int, anim: String)

func transmit_query(prompt: String, evidence_id: String = ""):
    var payload = {
        "session_id": current_session_id,
        "query": prompt,
        "evidence_id": evidence_id
    }
    $HTTPRequest.request(
        "http://127.0.0.1:8000/api/v1/interrogation/query",
        ["Content-Type: application/json"],
        HTTPClient.METHOD_POST,
        JSON.stringify(payload)
    )

func _on_request_completed(result, response_code, headers, body):
    var json = JSON.parse_string(body.get_string_from_utf8())
    emit_signal("suspect_spoke", json.spoken_dialogue, json.stress_delta, json.animation_trigger)`
  },
  {
    id: 'parts-belong-to-godot',
    number: 11,
    title: 'Which Parts Belong to Godot',
    category: 'CORE_ENGINE',
    summary: 'Rendering, physics, 3D character animation, spatial audio, and client input handling.',
    details: [
      '3D Camera & Luxury Hotel Suite Environment (lighting, volumetric smoke, raymarching reflections).',
      'Skeletal Rigs & BlendShapes: Realistic facial expressions, lip-sync visemes, eye darting, and defensive posture blends.',
      'Client Input Management: Spacebar Push-To-Talk detection, text line edits, TAB/H hotkey listeners.',
      'Audio Playback: Spatial 3D suspect voice playback with room acoustics (luxury suite reverberation).',
      'HUD Rendering & Polish: 120 FPS diegetic reticles, animated ECG sparklines, and button sound FX.'
    ]
  },
  {
    id: 'parts-belong-to-fastapi',
    number: 12,
    title: 'Which Parts Belong to FastAPI',
    category: 'INFRA_BACKEND',
    summary: 'Game rules arbiter, session manager, prompt builder, guardrail validator, and speech pipeline coordinator.',
    details: [
      'Session Orchestration: Tracks player progress, turn limits, and persistent state across queries.',
      'Prompt Construction: Synthesizes NPC Persona + Memory Window + Canonical Facts into strict Gemini prompt.',
      'Validation Engine: Pre- and Post-validation ensuring the LLM never hallucinates fake murder details.',
      'Audio Transcoding: Handles streaming audio conversion between Godot client and TTS/STT providers.',
      'Rate Limiting & Cost Management: Enforces token constraints and prevents query abuse.'
    ]
  },
  {
    id: 'parts-belong-to-gemini',
    number: 13,
    title: 'Which Parts Belong to Gemini',
    category: 'AI_VOICE',
    summary: 'Dynamic dialogue generation, character voice roleplaying, subtext, hesitation, and emotional nuance.',
    details: [
      'Natural Conversation: Parsing unconstrained player questions and formulating realistic human responses.',
      'Linguistic Personality: Embodying Kabir Malhotra\'s calm, calculating, South Asian luxury venture capitalist persona.',
      'Dynamic Tone Modulation: Shifting from dismissive arrogance to panicked stammering as stress elevates from 45% to 85%+.',
      'Contextual Hesitations: Generating diegetic pauses, stammering ("...Look, Detective, people step into the washroom..."), and tactical diversions.'
    ]
  },
  {
    id: 'parts-belong-to-postgresql',
    number: 14,
    title: 'Which Parts Belong to PostgreSQL',
    category: 'INFRA_BACKEND',
    summary: 'Canonical case ground truth, forensic evidence parameters, and long-term save states.',
    details: [
      'Canonical Murder Timeline: Minute-by-minute immutable truth of what happened in Room 407.',
      'Authoritative Evidence Registry: Tamper-proof attributes, serial numbers, discovery nodes, and contradiction links.',
      'Player Dossier & Save State: Unlocked clues, player deductions, case file progression.',
      'Audit Logging: Full transcripts of all interrogations for replay, grading, and prompt tuning.'
    ]
  }
];

export interface DataFlowStep {
  step: number;
  label: string;
  source: string;
  destination: string;
  role: string;
  description: string;
  payloadPreview: string;
}

export const DATA_FLOW_PIPELINE: DataFlowStep[] = [
  {
    step: 1,
    label: 'Player Question / PTT Input',
    source: 'Player Input',
    destination: 'Godot Engine (Client)',
    role: 'Capture',
    description: 'Player holds Spacebar or types in the tactical console: "Where were you at 10:30?" Godot records audio stream or text input.',
    payloadPreview: `{\n  "query_type": "TEXT_OR_VOICE",\n  "raw_input": "Where were you at 10:30?",\n  "presented_evidence_id": null\n}`
  },
  {
    step: 2,
    label: 'Godot Client -> Backend Dispatch',
    source: 'Godot Engine',
    destination: 'FastAPI Backend',
    role: 'Transport',
    description: 'Godot dispatches an HTTP/WebSocket packet containing session token, player text, active case ID, and attached evidence reference.',
    payloadPreview: `POST /api/v1/interrogation/turn\n{\n  "session_id": "ses-407a-9912",\n  "suspect_id": "npc-kabir-malhotra",\n  "text": "Where were you at 10:30?"\n}`
  },
  {
    step: 3,
    label: 'Backend State & Memory Assembly',
    source: 'FastAPI Backend',
    destination: 'PostgreSQL DB',
    role: 'Ground Truth Injection',
    description: 'FastAPI queries PostgreSQL for Kabir\'s canonical timeline, current stress (45%), caught lies list, and recent 4 conversation turns. The LLM receives zero creative freedom on facts.',
    payloadPreview: `// Injected Ground Truth Matrix\n{\n  "CANONICAL_ALIBI_TO_DEFEND": "Sitting at rooftop terrace bar from 22:15 to 22:45",\n  "CANONICAL_REALITY": "Descended stairs to Room 407 at 10:28; altercation occurred",\n  "CURRENT_STRESS": 45,\n  "BURDEN_OF_PROOF": "Unchallenged alibi"\n}`
  },
  {
    step: 4,
    label: 'Prompt Synthesis -> Gemini Inference',
    source: 'FastAPI Backend',
    destination: 'Gemini 2.5 Flash / 3.0',
    role: 'Roleplay & Dialogue Synthesis',
    description: 'FastAPI formats the system prompt with strict negative constraints ("Do not confess, do not invent physical items, maintain calm controlled corporate tone"). Gemini generates the dialogue and stress delta.',
    payloadPreview: `{\n  "dialogue": "At 10:30? I was up at the 12th-floor rooftop terrace bar waiting for our venture associate, sipping sparkling water...",\n  "internal_thought": "Hold the rooftop bar line. The bartender knows me by face.",\n  "stress_delta": +2,\n  "animation_hint": "composed_sip_water"\n}`
  },
  {
    step: 5,
    label: 'Response Validation & Guardrail Filter',
    source: 'FastAPI Validation Layer',
    destination: 'FastAPI Memory Store',
    role: 'Deterministic Gatekeeper',
    description: 'Backend checks Gemini\'s response: Did it hallucinate a new clue? Did it confess prematurely? If it violates canonical truth, FastAPI rejects and applies a deterministic fallback.',
    payloadPreview: `// Validation Status: PASSED\n{\n  "truth_compliant": true,\n  "hallucination_detected": false,\n  "early_confession_flag": false,\n  "new_stress_index": 47\n}`
  },
  {
    step: 6,
    label: 'Backend -> Godot Response Dispatch',
    source: 'FastAPI Backend',
    destination: 'Godot Engine',
    role: 'Gameplay State Update',
    description: 'FastAPI sends validated dialogue text, updated stress index, ECG pulse rate, posture shift, and audio stream URL or TTS buffer to Godot.',
    payloadPreview: `{\n  "dialogue": "At 10:30? I was up at the 12th-floor rooftop terrace bar...",\n  "stress": 47,\n  "pulse_bpm": 86,\n  "posture": "COMPOSED",\n  "anim": "idle_composed",\n  "audio_stream_url": "/api/v1/audio/stream-chunk-91.ogg"\n}`
  },
  {
    step: 7,
    label: 'Godot NPC Performance & HUD Update',
    source: 'Godot Engine',
    destination: 'Player Screen & Speakers',
    role: 'Cinematic Presentation',
    description: 'Godot updates the Stitch HUD Subtitle banner, triggers the NPC skeletal animation, pulses the ECG waveform, and streams the spatial voice through the luxury suite speakers.',
    payloadPreview: `[Godot Execution]\n-> Subtitle: Typewriter effect on dialogue banner\n-> Mesh: BlendShape lip_sync mapped to audio spectrum\n-> HUD: Stress Index updated to 47% [NORMAL]\n-> Audio: 3D spatial playback at NPC coordinates`
  }
];
