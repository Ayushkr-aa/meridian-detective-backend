import { EmotionalState } from '../types/gameTypes';
import { GodotAnimationState, AnimationPosture, AnimationGesture, SuggestedPlayerAction } from '../types/godotApiTypes';

export class AnimationMapper {
  /**
   * Deterministically maps backend emotional state and turn flags to Godot 4.x animation values.
   * Neither Gemini nor client input can bypass these deterministic bounds.
   */
  public static mapToAnimationState(
    emotionalState: EmotionalState,
    isContradictionHit: boolean,
    intentDetected: string = '',
    isRefusal: boolean = false
  ): GodotAnimationState {
    const stress = emotionalState.stressIndex;
    const defensiveness = emotionalState.defensiveness;
    const composure = emotionalState.composure;

    // 1. Posture mapping
    let posture: AnimationPosture = 'composed_upright';
    if (stress >= 85) {
      posture = 'cornered_shaken';
    } else if (stress >= 75) {
      posture = 'tense_leaning_forward';
    } else if (stress >= 65) {
      posture = 'defensive_arms_crossed';
    } else if (stress >= 50) {
      posture = 'attentive_calculating';
    } else {
      posture = 'composed_upright';
    }

    // 2. Gesture mapping
    let gesture: AnimationGesture = 'steepled_hands';
    if (isContradictionHit) {
      gesture = 'shocked_flinch';
    } else if (isRefusal) {
      gesture = 'dismissive_wave';
    } else if (stress >= 85) {
      gesture = 'clenched_fists';
    } else if (stress >= 75) {
      gesture = 'adjusting_cuff';
    } else if (stress >= 65) {
      gesture = 'defensive_palm';
    } else if (stress >= 50) {
      gesture = 'fidgeting';
    } else {
      gesture = 'steepled_hands';
    }

    // 3. Eye contact mapping (0.0 to 1.0, decreases under stress & guilt)
    let rawEyeContact = 0.90;
    if (stress >= 85) {
      rawEyeContact = 0.18;
    } else if (stress >= 75) {
      rawEyeContact = 0.35;
    } else if (stress >= 65) {
      rawEyeContact = 0.52;
    } else if (stress >= 50) {
      rawEyeContact = 0.72;
    } else {
      rawEyeContact = 0.88;
    }

    // Modulate slightly with composure
    const eyeContact = Math.round(Math.min(1.0, Math.max(0.1, rawEyeContact * (0.6 + (composure / 100) * 0.4))) * 100) / 100;

    // 4. Tension mapping (0.0 to 1.0, calculated strictly from stress and defensiveness)
    const rawTension = (stress * 0.7 + defensiveness * 0.3) / 100;
    const tension = Math.round(Math.min(1.0, Math.max(0.0, rawTension)) * 100) / 100;

    return {
      posture,
      gesture,
      eyeContact,
      tension,
    };
  }

  /**
   * Deterministically suggests the optimal detective action based on game progression
   */
  public static deriveSuggestedAction(
    stressIndex: number,
    isContradictionHit: boolean,
    discoveredContradictionsCount: number,
    evidencePresentedCount: number
  ): SuggestedPlayerAction {
    if (isContradictionHit) {
      return 'confront_contradiction';
    }
    if (stressIndex >= 78) {
      return 'cross_examine_alibi';
    }
    if (evidencePresentedCount === 0 && stressIndex < 60) {
      return 'present_evidence';
    }
    if (discoveredContradictionsCount < 2) {
      return 'press_timeline';
    }
    return 'inquire_motive';
  }
}
