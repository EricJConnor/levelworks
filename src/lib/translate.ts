/**
 * Client side of the estimate/invoice translation feature.
 *
 * Nothing here decides anything: the contractor taps the button, sees both
 * versions, and chooses. We never translate and send in one step — a document
 * that goes to a client is always one he has read first.
 */

export type Direction = 'es-en' | 'en-es';

export interface TranslateItem {
  id: string;
  text: string;
}

export interface TranslateResult {
  ok: boolean;
  items: TranslateItem[];
  /** Present when ok is false: a plain sentence safe to show the user. */
  message?: string;
}

/**
 * A rough guess at whether a block of text is Spanish, used only to pick the
 * default direction of the button so the contractor rarely has to think about
 * it. Wrong guesses are harmless — the button names the direction, and he can
 * flip it.
 */
export function looksSpanish(text: string): boolean {
  const s = ` ${text.toLowerCase()} `;
  if (/[ñáéíóúü¿¡]/.test(s)) return true;
  const words = [' de ', ' la ', ' el ', ' los ', ' las ', ' con ', ' para ', ' por ', ' pared ', ' pintura ', ' cocina ', ' baño ', ' techo ', ' piso ', ' puerta ', ' ventana ', ' instalar ', ' reparar ', ' materiales ', ' mano de obra '];
  return words.filter((w) => s.includes(w)).length >= 2;
}

export async function translateItems(
  direction: Direction,
  items: TranslateItem[],
  projectName?: string,
): Promise<TranslateResult> {
  const payload = items.filter((i) => i.text && i.text.trim());
  if (payload.length === 0) return { ok: true, items: [] };

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, items: payload, projectName }),
    });

    let data: any = null;
    try { data = await res.json(); } catch { /* non-JSON error page */ }

    if (!res.ok) {
      return {
        ok: false,
        items: [],
        message: data?.message || 'Could not translate right now. Try again.',
      };
    }
    return { ok: true, items: Array.isArray(data?.items) ? data.items : [] };
  } catch {
    return {
      ok: false,
      items: [],
      message: 'No connection. Translation needs a signal.',
    };
  }
}
