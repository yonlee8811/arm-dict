/**
 * 異形（var）の発音音声。
 *
 * assets/audio/ は tools/gen_word_audio.py が「見出し語 id → 音声」として
 * 自動生成する。異形の音声はその原則に収まらないため、
 * assets/audio-var/ に分けて、この表で手書きに管理する。
 *
 * キーは `見出し語id#異形の番号`。番号は dictionary.json の var 配列の添字。
 *
 * n-0224c ութսուն（80）
 *   見出し語 ut'sun     → assets/audio/n-0224c.m4a     （規範形）
 *   異形    ut'anasun  → assets/audio-var/n-0224c.m4a （口語形）
 */
export const WORD_AUDIO_VAR: Record<string, number> = {
  'n-0224c#0': require('../assets/audio-var/n-0224c.m4a'),
};
