// Round 4: Tier list
export function Round4() {
  return (
      <div className="round4-wrap">
        <div className="round4-head">
          <div className="round2-title">Round 4</div>
          <div className="round2-sub">Tier list: drag survivors of Round 3 and any 3-star games into S+, S, or S-.</div>
        </div>
        <div className="tier-board">
          <div className="tier-row" data-tier="S+">
            <div className="tier-label">S+</div>
            <div className="tier-drop" id="tierSPlus" aria-label="S Plus tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S">
            <div className="tier-label">S</div>
            <div className="tier-drop" id="tierS" aria-label="S tier drop zone"></div>
          </div>
          <div className="tier-row" data-tier="S-">
            <div className="tier-label">S-</div>
            <div className="tier-drop" id="tierSMinus" aria-label="S Minus tier drop zone"></div>
          </div>
        </div>
        <div className="tier-pool-wrap">
          <div className="tier-pool-title">Pool</div>
          <div id="tierPool" className="tier-pool" aria-label="Unassigned games pool"></div>
        </div>
        <div className="round4-nav">
          <button className="btn btn--ghost" type="button" onClick={() => {}}>
            ← Back to Round 3
          </button>
        </div>
      </div>
  );
}
