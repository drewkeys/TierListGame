// Round 2: Pick from trios of 1-star games
// This is a simplified version - full implementation would need the complex Round 2 state management
export function Round2() {
  return (
    <>
      <div className="round2-wrap">
        <div className="round2-head">
          <div className="round2-title">Round 2</div>
          <div className="round2-sub">Only 1-star games. Each screen shows up to 3 games. Pick 1 to survive.</div>
        </div>
        <div id="round2Grid" className="round2-grid">
          <div className="loading-card">Round 2 implementation in progress...</div>
        </div>
        <div className="round2-bottom-spacer"></div>
      </div>
      <div className="round2-nav">
        <button className="btn btn--ghost" type="button" onClick={() => {}}>
          ← Back
        </button>
        <button className="btn btn--magenta" type="button" disabled>
          Next →
        </button>
      </div>
    </>
  );
}
