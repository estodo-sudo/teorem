/**
 * Tutorial (SPEC_KEGEL_V2 §12; slimmed down 2026-11-26): what the muscle is, how to find it, where it
 * is (the animation), the right technique (with the starting position and the self-check folded in),
 * one practice set and its check, then the common mistakes, whose button finishes ("Hazırım"). Pure.
 */

export type TutorialStep = 'what' | 'find' | 'anatomy' | 'technique' | 'trial' | 'check' | 'tips' | 'mistakes';

/**
 * Main path (the tips step branches off "Nasıl geçti?"). `anatomy` is the "Pelvik taban kasın nerede?"
 * animation (SPEC_ANIMASYON_PELVIK), right after "Kası nasıl bulursun?"; it cannot be skipped the first time.
 */
export const TUTORIAL_ORDER: TutorialStep[] = ['what', 'find', 'anatomy', 'technique', 'trial', 'check', 'mistakes'];
