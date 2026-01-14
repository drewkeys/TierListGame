// Round 3: Pick from pairs of 2-star games + Round 2 survivors
export function Round3() {
  return (
    <>
      <div className="round2-wrap">
        <div className="round2-head">
          <div className="round2-title">Round 3</div>
          <div className="round2-sub">Only 2-star games plus Round 2 survivors. Each screen shows up to 2 games. Pick 1 to survive.</div>
        </div>
        <div id="round3Grid" className="round3-grid">
          <div className="loading-card">Round 3 implementation in progress...</div>
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
