/**
 * /quote-check and /quote-check/result — Quote Check, a contractor's read of a
 * homeowner's quote for $79.
 *
 * The page is the sale. The upload card IS the call to action, above the fold;
 * the review runs before payment and shows a locked preview (verdict, counts,
 * blurred lines) so the buyer sees it is real; Stripe takes $79; the result
 * page unlocks everything and the same review goes out by email.
 *
 * English only for now. Not in the dictionaries on purpose: it is a separate
 * product being tested, and one file is easier to move to its own domain.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '@/pages/landing.css';
import './quotecheck.css';

const PRICE = '$79';

type Teaser = {
  readable: boolean; reason?: string; trade?: string; jobSummary?: string; totalQuoted?: number;
  verdict?: 'fair' | 'high' | 'very_high' | 'low' | 'unclear';
  counts?: { lines: number; flags: number; missing: number; redFlags: number; questions: number };
};
type Band = { low: number; high: number; note: string };
type Line = { item: string; quoted: string; status: 'fair' | 'watch' | 'high' | 'missing_detail'; note: string };
type Result = {
  readable: boolean; trade: string; contractorName: string; jobSummary: string; totalQuoted: number;
  verdict: Teaser['verdict']; headline: string; fairRange: { low: number; high: number; basis: string };
  costBreakdown: { materials: Band; labor: Band; otherCosts: Band; industryMarginPercent: Band; impliedMarginPercent: number; impliedMarginNote: string };
  lines: Line[]; missing: string[]; redFlags: string[]; questions: string[]; sayThis: string; bottomLine: string; confidence: string;
};

const VERDICT: Record<string, string> = {
  fair: 'This quote is fair',
  high: 'This quote is high',
  very_high: 'This quote is well above the going rate',
  low: 'This quote is low, and that is worth a look',
  unclear: 'This quote leaves too much unsaid',
};
const money = (n?: number) => (n && n > 0 ? '$' + Math.round(n).toLocaleString('en-US') : '');

function useHead(title: string, desc: string, path: string) {
  useEffect(() => {
    const was = document.title;
    document.title = title;
    const set = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector<HTMLElement>(sel);
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); const m = sel.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/); if (m) el.setAttribute(m[1], m[2]); el.dataset.qc = '1'; document.head.appendChild(el); }
      el.setAttribute(attr, val);
    };
    set('meta[name="description"]', 'content', desc);
    set('meta[property="og:title"]', 'content', title);
    set('meta[property="og:description"]', 'content', desc);
    set('meta[property="og:url"]', 'content', `https://levelworks.org${path}`);
    set('link[rel="canonical"]', 'href', `https://levelworks.org${path}`);
    return () => { document.title = was; document.head.querySelectorAll('[data-qc]').forEach(e => e.remove()); };
  }, [title, desc, path]);
}

function readUtm() {
  const q = new URLSearchParams(window.location.search);
  return { source: q.get('utm_source') || '', medium: q.get('utm_medium') || '', campaign: q.get('utm_campaign') || '', content: q.get('utm_content') || '' };
}

/** Shrink a photo so it fits the upload limit and reads fast. PDFs pass through. */
async function prepareFile(file: File): Promise<{ base64: string; mediaType: string; name: string; preview: string }> {
  const toB64 = (blob: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });
  if (file.type === 'application/pdf') {
    if (file.size > 3.5 * 1024 * 1024) throw new Error('That PDF is over 3 MB. A photo of each page works, or a smaller export.');
    return { base64: await toB64(file), mediaType: 'application/pdf', name: file.name, preview: '' };
  }
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error('Send a photo (JPG or PNG) or a PDF of the quote.');
  }
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('That photo could not be opened. Try a JPG or PNG, or a PDF.')); i.src = url; });
  const max = 2200;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('Could not read the photo.'))), 'image/jpeg', 0.86));
  URL.revokeObjectURL(url);
  return { base64: await toB64(blob), mediaType: 'image/jpeg', name: file.name, preview: c.toDataURL('image/jpeg', 0.6) };
}

const Ic = {
  check: <svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /></svg>,
  up: <svg viewBox="0 0 24 24"><path d="M12 16V4" /><path d="M6 10l6-6 6 6" /><path d="M4 20h16" /></svg>,
  lock: <svg viewBox="0 0 24 24"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>,
  shield: <svg viewBox="0 0 24 24"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  list: <svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  dollar: <svg viewBox="0 0 24 24"><path d="M12 2v20" /><path d="M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 2.2 3 5 3 5 1.1 5 3-2.2 3.5-5 3.5-5-1.6-5-3.5" /></svg>,
  flag: <svg viewBox="0 0 24 24"><path d="M5 22V4" /><path d="M5 4h12l-2 4 2 4H5" /></svg>,
  q: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5" /><path d="M12 17h.01" /></svg>,
  msg: <svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-8 8H8l-5 3 1.5-4.5A8 8 0 1121 12z" /></svg>,
  gavel: <svg viewBox="0 0 24 24"><path d="M14 4l6 6" /><path d="M10 8l6 6" /><path d="M12 6l-8 8 2 2 8-8" /><path d="M4 20h10" /></svg>,
};

function Top() {
  return (
    <div className="qc-top">
      <Link to="/quote-check" className="qc-brand"><i>{Ic.check}</i>Quote Check</Link>
      <span className="qc-price"><b>{PRICE}</b> · one quote, read in minutes</span>
    </div>
  );
}
function Foot() {
  return (
    <footer className="qc-foot">
      <span>Quote Check</span>
      <a href="mailto:eric@levelworks.org">eric@levelworks.org</a>
      <Link to="/terms">Terms</Link>
      <Link to="/privacy">Privacy</Link>
    </footer>
  );
}

type Stage = 'idle' | 'reading' | 'teaser' | 'paying';

export default function QuoteCheck() {
  useHead('Quote Check: is your contractor\'s quote fair? Find out before you sign', 'A contractor reads your quote line by line and tells you what is fair, what is padded, what is missing, and exactly what to say. $79, back in minutes.', '/quote-check');
  const location = useLocation();
  const [file, setFile] = useState<Awaited<ReturnType<typeof prepareFile>> | null>(null);
  const [zip, setZip] = useState('');
  const [about, setAbout] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<Stage>('idle');
  const [step, setStep] = useState(0);
  const [err, setErr] = useState('');
  const [over, setOver] = useState(false);
  const [id, setId] = useState('');
  const [teaser, setTeaser] = useState<Teaser | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Back from a cancelled checkout: pick the locked review up where it was.
  useEffect(() => {
    const rid = new URLSearchParams(location.search).get('id');
    if (!rid) return;
    fetch(`/api/quotecheck-result?id=${encodeURIComponent(rid)}`).then(async r => {
      const j = await r.json().catch(() => ({}));
      if (r.status === 402 && j.teaser) { setId(rid); setTeaser(j.teaser); setStage('teaser'); }
      else if (r.ok && j.result) { window.location.replace(`/quote-check/result?id=${rid}`); }
    }).catch(() => {});
  }, [location.search]);

  const pick = useCallback(async (f?: File | null) => {
    if (!f) return;
    setErr('');
    try { setFile(await prepareFile(f)); } catch (e) { setErr((e as Error).message); }
  }, []);

  async function submit() {
    if (!file) { setErr('Add a photo or PDF of the quote first.'); inputRef.current?.click(); return; }
    setErr(''); setStage('reading'); setStep(0);
    const timers = [setTimeout(() => setStep(1), 6000), setTimeout(() => setStep(2), 20000)];
    try {
      const r = await fetch('/api/quotecheck-upload', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: { base64: file.base64, mediaType: file.mediaType, name: file.name }, zip, about, notes, email }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.message || 'Could not read the quote right now. Try again in a minute.');
      setId(j.id); setTeaser(j.teaser); setStage('teaser');
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e) {
      setErr((e as Error).message); setStage('idle');
    } finally { timers.forEach(clearTimeout); }
  }

  async function pay() {
    if (!/.+@.+\..+/.test(email)) { setErr('Enter the email you want the review sent to.'); return; }
    setErr(''); setStage('paying');
    try {
      const r = await fetch('/api/quotecheck-checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email, utm: readUtm() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) throw new Error(j.message || 'Could not open checkout. Try again.');
      window.location.href = j.url;
    } catch (e) { setErr((e as Error).message); setStage('teaser'); }
  }

  const goUpload = () => { cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => inputRef.current?.click(), 400); };

  return (
    <div className="lw qc">
      <Top />
      <main>
        <section className="qc-hero">
          <div className="qc-label">Before you sign</div>
          <h1 className="qc-h1">Is your contractor's quote fair? Find out tonight.</h1>
          <p className="qc-sub">Upload the quote. It gets costed the way a contractor bids it, <b>materials, labor and margin</b>, then judged line by line: what's fair, what's padded, what's missing, and exactly what to say. {PRICE}. Back in minutes.</p>

          <div className="qc-card" ref={cardRef}>
            {stage === 'idle' && (
              <>
                {!file ? (
                  <label className={'qc-drop' + (over ? ' over' : '')}
                    onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
                    onDrop={e => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files?.[0]); }}>
                    {Ic.up}
                    <b>Upload the quote</b>
                    <span>Take a photo of it, or add the PDF. One page or many.</span>
                    <input ref={inputRef} type="file" accept="image/*,application/pdf" onChange={e => pick(e.target.files?.[0])} />
                  </label>
                ) : (
                  <div className="qc-file">
                    {file.preview ? <img src={file.preview} alt="" /> : <div className="qc-pdf">PDF</div>}
                    <div style={{ minWidth: 0 }}><b>{file.name}</b><span>Ready to read</span></div>
                    <button type="button" onClick={() => setFile(null)}>Change</button>
                  </div>
                )}
                <div className="qc-fields">
                  <div className="row">
                    <div><label htmlFor="qc-zip">ZIP code</label><input id="qc-zip" inputMode="numeric" placeholder="90210" value={zip} onChange={e => setZip(e.target.value.replace(/[^0-9]/g, '').slice(0, 5))} /></div>
                    <div><label htmlFor="qc-about">The job, in a few words</label><input id="qc-about" placeholder="Replace the roof on a 1,800 sq ft ranch" value={about} onChange={e => setAbout(e.target.value)} maxLength={300} /></div>
                  </div>
                  <div><label htmlFor="qc-notes">Anything worrying you? (optional)</label><textarea id="qc-notes" placeholder="He wants half up front. The other bid was $6,000 less." value={notes} onChange={e => setNotes(e.target.value)} maxLength={600} /></div>
                </div>
                <button type="button" className="lw-btn pri qc-cta" onClick={submit}>Read my quote</button>
                <p className="qc-fine">Free to upload. You see the verdict before you pay. {PRICE} unlocks the full review. If we can't read it, there's nothing to pay.</p>
              </>
            )}

            {stage === 'reading' && (
              <>
                <div className="qc-steps">
                  {['Reading every line of the quote', `Checking prices${zip ? ' for ' + zip : ' for your area'}`, 'Writing your review'].map((s, i) => (
                    <div key={s} className={'qc-step' + (i < step ? ' done' : i === step ? ' on' : '')}><i />{s}</div>
                  ))}
                </div>
                <p className="qc-wait">Usually under a minute. Don't close this tab.</p>
              </>
            )}

            {(stage === 'teaser' || stage === 'paying') && teaser && (
              teaser.readable ? (
                <>
                  <div className="qc-verdict">Your review is ready</div>
                  <div className={'qc-verdict-h ' + (teaser.verdict || '')}>{VERDICT[teaser.verdict || 'unclear']}</div>
                  <p className="qc-job"><b>{teaser.trade}</b> · {teaser.jobSummary}{teaser.totalQuoted ? <> · quoted <b>{money(teaser.totalQuoted)}</b></> : null}</p>
                  <div className="qc-counts">
                    <div className="qc-count"><b>{teaser.counts?.flags ?? 0}</b><span>{(teaser.counts?.flags ?? 0) === 1 ? 'line' : 'lines'} flagged high or vague</span></div>
                    <div className="qc-count"><b>{teaser.counts?.missing ?? 0}</b><span>things a proper quote should include and this one doesn't</span></div>
                    <div className="qc-count"><b>{teaser.counts?.redFlags ?? 0}</b><span>red flags in the terms</span></div>
                    <div className="qc-count"><b>{teaser.counts?.questions ?? 0}</b><span>questions to ask before you sign</span></div>
                  </div>
                  <div className="qc-locked">
                    <div className="blur" aria-hidden="true">
                      <p><b>What this job should cost:</b> $00,000 to $00,000. Materials $0,000 to $0,000. Labor $0,000 to $0,000. Normal margin 00% to 00%. This quote implies 00%.</p>
                      <p><b>Line by line.</b> Tear-off and disposal, quoted at $0,000: on the high side for this square footage. Underlayment: not specified, ask which product. Flashing: fair.</p>
                      <p><b>Say this.</b> "Thanks for the quote. Before I sign, can you break out the ..."</p>
                    </div>
                    <div className="lock">{Ic.lock}<b>The full review is locked</b><span>Materials, labor and margin itemized, every line judged, what's missing, the questions, the script, and the bottom line.</span></div>
                  </div>
                  <div className="qc-unlock">
                    <label htmlFor="qc-email">Where should we send it?</label>
                    <input id="qc-email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <button type="button" className="lw-btn pri qc-cta" onClick={pay} disabled={stage === 'paying'}>{stage === 'paying' ? 'Opening secure checkout' : `Unlock the full review · ${PRICE}`}</button>
                  <div className="qc-guarantee">{Ic.shield}<span><b>If it doesn't tell you something you didn't know, reply to the email and you get the {PRICE} back.</b> Paid through Stripe. Your quote is never shared with the contractor or anyone else.</span></div>
                </>
              ) : (
                <>
                  <div className="qc-verdict">We couldn't read that one</div>
                  <div className="qc-verdict-h unclear">Try a clearer photo</div>
                  <p className="qc-job">{teaser.reason || 'The upload did not look like a contractor quote, or the text was too small to read.'} Nothing was charged.</p>
                  <button type="button" className="lw-btn pri qc-cta" onClick={() => { setFile(null); setTeaser(null); setStage('idle'); }}>Upload again</button>
                </>
              )
            )}
            {err && <p className="qc-err">{err}</p>}
          </div>
        </section>

        <section className="qc-sec">
          <h2 className="qc-h2">A padded quote costs thousands. Finding out costs {PRICE}.</h2>
          <p>Most homeowners sign the first quote they trust, because they have no way to know what the work should cost. The contractor knows. Now you do too.</p>
          <div className="qc-stakes">
            <div className="qc-stake"><span>Typical padding on a roof replacement</span><b>$2,000 to $6,000</b></div>
            <div className="qc-stake"><span>Typical padding on a kitchen remodel</span><b>$4,000 to $12,000</b></div>
            <div className="qc-stake"><span>A vague quote that grows once the walls are open</span><b>10% to 30%</b></div>
            <div className="qc-stake us"><span>A contractor's read of your quote, tonight</span><b>{PRICE}</b></div>
          </div>
        </section>

        <section className="qc-sec">
          <h2 className="qc-h2">What you get back</h2>
          <div className="qc-gets">
            <div className="qc-get">{Ic.gavel}<div><b>The verdict</b><span>Fair, high, or too vague to sign, in one plain sentence.</span></div></div>
            <div className="qc-get">{Ic.dollar}<div><b>What the job should cost, itemized</b><span>Current material prices, projected labor for your area, permits and disposal, then the normal profit margin for that trade. Side by side with what the quote implies.</span></div></div>
            <div className="qc-get">{Ic.list}<div><b>Every line, judged</b><span>Fair, on the high side, padded, or missing detail, with a note on each one a contractor would actually say.</span></div></div>
            <div className="qc-get">{Ic.flag}<div><b>What's missing and what's a red flag</b><span>Permits, disposal, material specs, warranty, dates, the payment schedule, licence and insurance. Half down and a cash discount are red flags. You'll know which ones you have.</span></div></div>
            <div className="qc-get">{Ic.q}<div><b>The questions to ask</b><span>Exact questions, in your words, that a contractor can't wave away.</span></div></div>
            <div className="qc-get">{Ic.msg}<div><b>What to say</b><span>A short script you can say or text to negotiate or clarify, without sounding like you're accusing anyone.</span></div></div>
          </div>
        </section>

        <section className="qc-sec">
          <h2 className="qc-h2">How it works</h2>
          <ol className="qc-how">
            <li><div><b>Upload the quote</b><span>A photo from your phone is fine. PDF works too. Add your ZIP so the prices match your area.</span></div></li>
            <li><div><b>See the verdict, free</b><span>In about a minute you see whether the quote is fair, high or vague, and how many lines got flagged.</span></div></li>
            <li><div><b>Unlock the full review for {PRICE}</b><span>On screen and in your email, so you have it open at the kitchen table when the contractor calls back.</span></div></li>
          </ol>
        </section>

        <section className="qc-sec">
          <h2 className="qc-h2">What a review looks like</h2>
          <p>A sample, so you know what {PRICE} buys. Every review is written for your quote, your ZIP and your job.</p>
          <div className="qc-sample">
            <div className="qc-sample-tag">SAMPLE REVIEW · ROOF REPLACEMENT · QUOTED $18,400</div>
            <div className="qc-sample-body">
              <h3>This quote is high</h3>
              <p>About $3,500 over the going rate for a 24-square architectural shingle roof in your area, mostly in tear-off and the "miscellaneous materials" line. Materials run $5,200 to $6,400, labor $5,500 to $6,800, disposal and permits $900 to $1,300; at a normal 25 to 35 percent margin that's $15,500 to $17,600. This quote implies a 39 percent margin. The workmanship terms are fine. Ask two questions and this is a signable quote.</p>
              <div className="qc-lines">
                <div className="qc-line"><div><b>Tear-off and disposal, 24 sq</b><small>$140 a square is the top of the range for a single layer. $85 to $110 is typical unless there are two layers, and the quote doesn't say.</small></div><div className="amt">$3,360<span className="st high">high</span></div></div>
                <div className="qc-line"><div><b>Architectural shingles, installed</b><small>In range for a 30-year shingle. The brand and line aren't named. Ask which one, in writing.</small></div><div className="amt">$9,600<span className="st watch">watch</span></div></div>
                <div className="qc-line"><div><b>Ice and water shield, underlayment</b><small>Fair. Synthetic underlayment and ice barrier at the eaves is the right spec.</small></div><div className="amt">$1,440<span className="st fair">fair</span></div></div>
                <div className="qc-line"><div><b>Miscellaneous materials</b><small>$2,200 with no list. This is where padding lives. Ask for the list or have it struck.</small></div><div className="amt">$2,200<span className="st high">high</span></div></div>
                <div className="qc-line"><div><b>Flashing, vents, drip edge</b><small>Fair, and good that it's separate.</small></div><div className="amt">$1,800<span className="st fair">fair</span></div></div>
              </div>
              <div className="qc-say"><small>SAY THIS</small>"Thanks for the quote, I'd like to move forward. Two things first: can you break out what's in miscellaneous materials, and confirm the shingle brand and line on the contract? And is the tear-off priced for one layer or two?"</div>
            </div>
          </div>
        </section>

        <section className="qc-eric">
          <h2 className="qc-h2">Why a contractor built this</h2>
          <p>I've written more quotes than I can count. I know where the padding goes, what a vague line really means, and which terms should make you walk. Homeowners never had anyone on their side of the table. Now you do. Upload the quote, and if the review doesn't earn its {PRICE}, reply and I'll refund it.</p>
          <div className="sig">Eric Connor, contractor, builder of Quote Check and LevelWorks</div>
        </section>

        <section className="qc-sec qc-faq">
          <h2 className="qc-h2">Questions</h2>
          <dl>
            <dt>Is a person reading my quote, or software?</dt>
            <dd>Software, built and trained by a working contractor on the exact things he checks: regional labor and material rates, what a proper quote for your trade includes, and the terms that go wrong. It reads your quote the way he would, in about a minute. Reply to the review email and a person answers.</dd>
            <dt>How accurate is the price range?</dt>
            <dd>It's a range, not a magic number. Prices move with access, roof pitch, what's behind the wall, and how busy the contractor is. The range tells you whether you're in the neighborhood or nowhere near it, which is the thing you can't tell today.</dd>
            <dt>Will the contractor know?</dt>
            <dd>No. Your quote isn't shared with anyone. The script is written so you can ask for what you need without accusing anyone of anything.</dd>
            <dt>What if the quote is fair?</dt>
            <dd>Then you sign it tonight with a clear head instead of losing a week getting two more bids. That's worth {PRICE} too.</dd>
            <dt>What kinds of quotes?</dt>
            <dd>Roofing, siding, windows, HVAC, plumbing, electrical, kitchens, bathrooms, additions, decks, concrete, painting, flooring, fencing, landscaping. Any written quote from a contractor or home-services company in the US.</dd>
            <dt>What if it can't read my quote?</dt>
            <dd>You see that before you pay, and you pay nothing. Try a clearer photo or the PDF.</dd>
          </dl>
        </section>

        <section className="qc-bottom">
          <h2 className="qc-h2">Don't sign tonight. Sign tomorrow, knowing.</h2>
          <button type="button" className="lw-btn pri qc-cta" onClick={goUpload}>Read my quote</button>
          <p className="qc-fine">See the verdict free. {PRICE} for the full review. Refund if it doesn't earn it.</p>
        </section>
      </main>
      <Foot />
    </div>
  );
}

/** /quote-check/result?id=…&session_id=… — the unlocked review. */
export function QuoteCheckResult() {
  useHead('Your Quote Check review', 'Your contractor quote, reviewed line by line.', '/quote-check/result');
  const location = useLocation();
  const [state, setState] = useState<{ loading: boolean; err: string; data?: { id: string; result: Result; email: string; emailed: boolean } }>({ loading: true, err: '' });

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('id') || ''; const sid = q.get('session_id') || '';
    if (!id) { setState({ loading: false, err: 'This link is missing its review id.' }); return; }
    let tries = 0;
    const go = async () => {
      try {
        const r = await fetch(`/api/quotecheck-result?id=${encodeURIComponent(id)}${sid ? `&session_id=${encodeURIComponent(sid)}` : ''}`);
        const j = await r.json().catch(() => ({}));
        if (r.status === 402) {
          // Stripe can be a beat behind the redirect; try a few times before giving up.
          if (sid && tries++ < 4) { setTimeout(go, 1500); return; }
          setState({ loading: false, err: 'This review has not been unlocked yet. If you just paid, wait a moment and refresh.' });
          return;
        }
        if (!r.ok) throw new Error(j.message || 'Could not load the review.');
        setState({ loading: false, err: '', data: j });
      } catch (e) { setState({ loading: false, err: (e as Error).message }); }
    };
    go();
  }, [location.search]);

  const r = state.data?.result;
  return (
    <div className="lw qc">
      <Top />
      <main className="qc-result">
        {state.loading && <p className="qc-wait">Opening your review…</p>}
        {state.err && !state.loading && (
          <>
            <p className="qc-err">{state.err}</p>
            <p><Link to="/quote-check" className="lw-btn sec" style={{ marginTop: 12 }}>Back to Quote Check</Link></p>
          </>
        )}
        {r && (
          <>
            <div className="qc-verdict">Your Quote Check</div>
            <h1 className={r.verdict || ''}>{VERDICT[r.verdict || 'unclear']}</h1>
            <p className="lead">{r.headline}</p>
            <p><b>{r.trade}</b> · {r.jobSummary}{r.totalQuoted ? <> · quoted <b>{money(r.totalQuoted)}</b></> : null}{r.contractorName ? <> · from {r.contractorName}</> : null}</p>

            <h2>What this job should cost</h2>
            <div className="qc-range"><b>{money(r.fairRange.low)} to {money(r.fairRange.high)}</b><span>{r.fairRange.basis}</span></div>

            <h2>How that number is built</h2>
            <div className="qc-lines">
              {([['Materials', r.costBreakdown.materials], ['Labor', r.costBreakdown.labor], ['Permits, disposal, other', r.costBreakdown.otherCosts]] as [string, Band][]).map(([k, v]) => (
                <div className="qc-line" key={k}><div><b>{k}</b><small>{v.note}</small></div><div className="amt">{money(v.low)} to {money(v.high)}</div></div>
              ))}
              <div className="qc-line"><div><b>Normal overhead and profit for {r.trade.toLowerCase()}</b><small>{r.costBreakdown.industryMarginPercent.note}</small></div><div className="amt">{r.costBreakdown.industryMarginPercent.low}% to {r.costBreakdown.industryMarginPercent.high}%</div></div>
              {r.totalQuoted > 0 && <div className="qc-line total"><div><b>Margin this quote implies</b><small>{r.costBreakdown.impliedMarginNote}</small></div><div className="amt"><b>{Math.round(r.costBreakdown.impliedMarginPercent)}%</b></div></div>}
            </div>

            <h2>Line by line</h2>
            <div className="qc-lines">
              {r.lines.map((l, i) => (
                <div className="qc-line" key={i}><div><b>{l.item}</b><small>{l.note}</small></div><div className="amt">{l.quoted}<span className={'st ' + l.status}>{l.status.replace('_', ' ')}</span></div></div>
              ))}
            </div>

            {r.missing.length > 0 && <><h2>What's missing from this quote</h2><ul>{r.missing.map((m, i) => <li key={i}>{m}</li>)}</ul></>}
            {r.redFlags.length > 0 && <><h2>Red flags</h2><ul>{r.redFlags.map((m, i) => <li key={i}>{m}</li>)}</ul></>}

            <h2>Ask the contractor</h2>
            <ul>{r.questions.map((m, i) => <li key={i}>{m}</li>)}</ul>

            <h2>Say this</h2>
            <div className="qc-say">{r.sayThis}</div>

            <h2>Bottom line</h2>
            <p>{r.bottomLine}</p>

            <p className="qc-mailed">{state.data?.emailed ? `A copy is in your inbox at ${state.data.email}.` : 'A copy is on its way to your email.'} Reply to it if something in the quote was misread, or if the review didn't earn its {PRICE}.</p>
            <div className="qc-print">
              <button type="button" className="lw-btn sec" onClick={() => window.print()}>Print or save as PDF</button>
              <Link to="/quote-check" className="lw-btn sec">Check another quote</Link>
            </div>
            <p className="qc-fine" style={{ textAlign: 'left', marginTop: 22 }}>This review is a professional read of the document you sent, based on typical costs for your area. It is not an inspection of the property. Prices vary with access, materials and the contractor's workload.</p>
          </>
        )}
      </main>
      <Foot />
    </div>
  );
}
