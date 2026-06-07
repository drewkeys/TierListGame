import './CreditsModal.css';

const avatarPath = (fileName: string) => `${import.meta.env.BASE_URL}assets/ui/${fileName}`;

const creatorCredit = {
  handle: '@campingcampfire/drewkeys',
  avatar: 'drew.png',
  note: 'Site made by cookie pickle!!!',
};

const mainCredits = [
  {
    handle: '@FELISTREAMING',
    avatar: 'feli.png',
    note: 'For helping with the cover art, game descriptions, and YouTube embed links',
  },
  {
    handle: '@hollulu/meekcheep',
    avatar: 'holly.png',
    note: 'For creating these badass console banner images',
  },
  {
    handle: '@wonsoongi/avice01',
    avatar: 'won.png',
    note: 'For helping with the cover art, game descriptions, and YouTube embed links',
  },
  {
    handle: '@fenrir',
    avatar: 'fen.png',
    note: 'For being my fam and refactoring my shitty code',
  },
  {
    handle: '@bennyboyzero',
    avatar: 'bnub.png',
    note: 'For helping with the cover art, game descriptions, and YouTube embed links',
  },
];

const playtesters = [
  '@mouch',
  '@elfsatyr',
  '@silverchatting',
  '@musikyl',
  '@m0blan',
  '@yuzuvoid',
  '@ultraguardians',
  '@vivi',
  '@misspt',
  '@ediblegod',
];

interface CreditsModalProps {
  open: boolean;
  onClose: () => void;
}

function getInitial(handle: string): string {
  return handle.replace('@', '').slice(0, 1).toUpperCase() || '?';
}

function CreditAvatar({ avatar, handle }: { avatar: string; handle: string }) {
  return (
    <div className="credits-card__avatar" aria-hidden="true">
      <span>{getInitial(handle)}</span>
      <img
        src={avatarPath(avatar)}
        alt=""
        onError={(event) => {
          event.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
}

export function CreditsModal({ open, onClose }: CreditsModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop credits-backdrop" onClick={onClose} />
      <div className="modal credits-modal" role="dialog" aria-modal="true" aria-labelledby="creditsModalTitle">
        <div className="modal__panel credits-modal__panel" onClick={(event) => event.stopPropagation()}>
          <header className="modal__header credits-modal__header">
            <div>
              <div className="modal__console credits-modal__eyebrow">Credits</div>
              <h2 id="creditsModalTitle" className="modal__title credits-modal__title">COOKIE CREW</h2>
            </div>
            <button className="modal__close credits-modal__close" type="button" onClick={onClose} aria-label="Close credits">
              Close
            </button>
          </header>

          <div className="credits-modal__content">
            <p className="credits-modal__intro">
              Credits to those that helped me with this cookie pickle site:
            </p>

            <section className="credits-creator" aria-label="Creator credit">
              <article className="credits-card credits-card--creator">
                <CreditAvatar avatar={creatorCredit.avatar} handle={creatorCredit.handle} />
                <div className="credits-card__text">
                  <h3>{creatorCredit.handle}</h3>
                  <p>{creatorCredit.note}</p>
                </div>
              </article>
            </section>

            <section className="credits-modal__grid" aria-label="Main credits">
              {mainCredits.map((credit) => (
                <article className="credits-card" key={credit.handle}>
                  <CreditAvatar avatar={credit.avatar} handle={credit.handle} />
                  <div className="credits-card__text">
                    <h3>{credit.handle}</h3>
                    <p>{credit.note}</p>
                  </div>
                </article>
              ))}
            </section>

            <div className="credits-cookie-divider" aria-hidden="true">
              🍪🥒🍪🥒🍪🥒🍪🥒🍪🥒
            </div>

            <p className="credits-chat-callout">Type Cookie or Pickle in chat!!</p>

            <section className="credits-playtesters" aria-label="Playtesters">
              <p>
                Also big shoutout to these playtesters for giving me ideas and telling me how mine are stupid:{' '}
                {playtesters.join(' ')}
              </p>
            </section>

            <section className="credits-ep" aria-label="Favorite EP">
              <p>p.s. Check out one of my favorite EPs:</p>
              <div className="credits-ep__embed">
                <iframe
                  src="https://www.youtube.com/embed/qCxop-1wDTQ"
                  title="Favorite EP"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <img
                className="credits-ep__beachie"
                src={avatarPath('beachie.jpg')}
                alt="Beachie"
              />
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
