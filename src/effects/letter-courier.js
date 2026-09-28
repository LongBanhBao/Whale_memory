import { gsap } from 'gsap';

// One owner for the whale while it delivers the letter; the finale's idle
// motion and fireworks resume only after the whale has returned home.
export function createLetterCourier({ world, swimmer, dialog, button, galleryButton, reducedMotion, compactRuntime = false, pose, pause, resume }) {
  const scroll = document.querySelector('#courier-scroll');
  const parchment = dialog.querySelector('.letter-parchment');
  const words = dialog.querySelector('.letter-parchment__words');
  let timeline;
  let saved;
  let motion;
  let active = false;
  const phase = value => { world.dataset.letterPhase = value; };
  const render = () => pose(motion.x, motion.y, motion.scale, motion.rotation, 0, .65, 0, .18);

  function putScrollBack() {
    button.append(scroll);
    scroll.removeAttribute('style');
    swimmer.style.removeProperty('--letter-facing');
    swimmer.style.removeProperty('visibility');
  }

  function finish() {
    active = false;
    putScrollBack();
    delete world.dataset.letterPhase;
    button.disabled = false;
    galleryButton.disabled = false;
    resume();
    button.focus({ preventScroll: true });
  }

  function returnHome() {
    if (!active || world.dataset.letterPhase === 'returning') return;
    timeline?.kill();
    phase('returning');
    putScrollBack();
    if (reducedMotion) { finish(); return; }
    timeline = gsap.timeline({ onComplete: finish })
      .to(motion, { ...saved, duration: 1.5, ease: 'power2.inOut', onUpdate: render });
  }

  function readLetter() {
    phase('reading');
    swimmer.style.visibility = 'hidden';
    scroll.style.visibility = 'hidden';
    dialog.showModal();
    words.scrollTop = 0;
    timeline = gsap.timeline()
      .fromTo(parchment, { clipPath: 'inset(0 0 72% 0)', opacity: 0, '--letter-unroll': 0 }, {
        clipPath: 'inset(0 0 0% 0)', opacity: 1, '--letter-unroll': 1,
        duration: reducedMotion ? 0 : 1.25, ease: 'power2.inOut',
      })
      .fromTo(words, { opacity: 0, y: 8 }, {
        opacity: 1, y: 0, duration: reducedMotion ? 0 : .65,
      }, reducedMotion ? 0 : .8);
  }

  button.addEventListener('click', () => {
    if (active || button.disabled) return;
    active = true;
    pause();
    button.disabled = true;
    galleryButton.disabled = true;
    const style = getComputedStyle(swimmer);
    saved = {
      x: parseFloat(style.getPropertyValue('--whale-x')) / 100,
      y: parseFloat(style.getPropertyValue('--whale-y')) / 100,
      scale: parseFloat(style.getPropertyValue('--whale-scale')),
      rotation: parseFloat(style.getPropertyValue('--whale-rotation')),
    };
    motion = { ...saved };
    if (reducedMotion) { readLetter(); return; }
    phase('approaching');
    const bounds = world.getBoundingClientRect();
    const target = button.getBoundingClientRect();
    const scale = compactRuntime ? Math.min(.48, saved.scale) : bounds.width < 700 ? .55 : .38;
    const mouthOffset = swimmer.offsetWidth * scale * .36;
    const x = (target.left + target.width / 2 - bounds.left - mouthOffset) / bounds.width;
    const y = (target.top + target.height / 2 - bounds.top - swimmer.offsetHeight * scale * .1) / bounds.height;
    const approach = compactRuntime
      ? { x: (saved.x + x) / 2, y: y - .018, scale, rotation: 4 }
      : { x: x - .12, y: y - .1, scale, rotation: 12 };
    timeline = gsap.timeline()
      .to(motion, { ...approach,
        duration: 1.2, ease: 'power1.inOut', onUpdate: render })
      .to(motion, { x, y, rotation: 0, duration: .8, ease: 'power2.out', onUpdate: render })
      .call(() => {
        phase('carrying');
        swimmer.append(scroll);
        scroll.style.width = `${target.width / scale}px`;
        swimmer.style.setProperty('--letter-facing', '1');
      })
      .to(swimmer, { '--letter-facing': -1, duration: .45, ease: 'power1.inOut' })
      .to(motion, { x: .5 + mouthOffset / bounds.width, y: .26, rotation: -8,
        duration: 2.2, ease: 'power2.inOut', onUpdate: render })
      .to(motion, { rotation: 0, duration: .35, onUpdate: render })
      .call(readLetter);
  });

  dialog.addEventListener('close', returnHome);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active && !dialog.open) returnHome();
  });

  return {
    reset() {
      active = false;
      timeline?.kill();
      if (dialog.open) dialog.close();
      putScrollBack();
      delete world.dataset.letterPhase;
      gsap.set([parchment, words], { clearProps: 'all' });
    },
  };
}
