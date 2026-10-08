(() => {
  const body = document.body;
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let savedMotion;
  try { savedMotion = localStorage.getItem('vincent-motion'); } catch {}
  let motion = savedMotion === null || savedMotion === undefined ? !preference.matches : savedMotion === 'on';
  const motionButton = document.querySelector('.motion-toggle');
  const setMotion = (enabled, save = false) => {
    motion = enabled;
    body.classList.toggle('motion-on', enabled);
    body.classList.toggle('motion-off', !enabled);
    document.documentElement.classList.toggle('motion-off', !enabled);
    if (motionButton) {
      motionButton.setAttribute('aria-pressed', String(enabled));
      motionButton.setAttribute('aria-label', 'Motion');
      motionButton.innerHTML = `<span class="motion-icon" aria-hidden="true">${enabled ? 'Ⅱ' : '▷'}</span>Motion <span aria-hidden="true">${enabled ? 'on' : 'off'}</span>`;
    }
    document.querySelectorAll('[data-pb-replay]').forEach(button => {
      button.disabled = !enabled;
      button.textContent = enabled ? 'Replay comparison' : 'Replay · motion off';
      button.title = enabled ? 'Replay the personal-best comparison' : 'Enable Motion in the header to replay';
    });
    if (!enabled) document.getAnimations().forEach(animation => animation.cancel());
    if (save) try { localStorage.setItem('vincent-motion', enabled ? 'on' : 'off'); } catch {}
  };
  setMotion(motion);
  motionButton?.addEventListener('click', () => setMotion(!motion, true));
  preference.addEventListener('change', event => setMotion(!event.matches));
  document.addEventListener('visibilitychange', () => body.classList.toggle('page-hidden', document.hidden));

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.nav');
  const closeMenu = () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    if (menuButton) menuButton.textContent = 'Menu';
    navigation?.classList.remove('open');
  };
  menuButton?.addEventListener('click', () => {
    const expanded = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!expanded));
    menuButton.textContent = expanded ? 'Menu' : 'Close';
    navigation?.classList.toggle('open', !expanded);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
      closeMenu(); menuButton.focus();
    }
  });
  navigation?.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });

  document.querySelectorAll('[data-tabs]').forEach(widget => {
    const tabs = [...widget.querySelectorAll('[role="tab"]')].filter(el => el.closest('[data-tabs]') === widget);
    const panels = [...widget.querySelectorAll('[data-panel]')].filter(el => el.closest('[data-tabs]') === widget);
    const activate = tab => {
      tabs.forEach(item => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(panel => {
        const selected = panel.id === tab.getAttribute('aria-controls');
        panel.hidden = !selected;
        if (selected && motion) panel.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 480, easing: 'cubic-bezier(.22,1,.36,1)' });
      });
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault(); tabs[next].focus(); activate(tabs[next]);
      });
    });
  });

  document.querySelectorAll('[data-members]').forEach(grid => {
    const total = Number(grid.dataset.members);
    for (let i = 0; i < total; i++) {
      const member = document.createElement('i'); member.style.setProperty('--i', i); grid.append(member);
    }
  });
  document.querySelectorAll('[data-club]').forEach(club => {
    const board = club.querySelector('[data-member-board]');
    const count = club.querySelector('[data-club-count]');
    club.querySelectorAll('[data-club-select]').forEach(button => button.addEventListener('click', () => {
      const earlier = button.dataset.clubSelect === 'earlier';
      club.querySelectorAll('[data-club-select]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (board) {
        board.dataset.memberBoard = earlier ? 'earlier' : 'best';
        board.setAttribute('aria-label', `${earlier ? 4 : 15} circles represent ${earlier ? 4 : 15} Card Game Club members`);
      }
      if (count) count.textContent = earlier ? '4' : '15';
    }));
  });

  document.querySelectorAll('[data-pb]').forEach(card => {
    const display = card.querySelector('[data-pb-time]');
    display?.setAttribute('aria-live', 'polite');
    card.querySelectorAll('[data-pb-select]').forEach(button => button.addEventListener('click', () => {
      card.querySelectorAll('[data-pb-select]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      display.textContent = button.dataset.pbSelect === 'earlier' ? '24:30' : '19:36';
      if (motion) display.animate([{ opacity: .3, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400, easing: 'ease-out' });
    }));
    const replay = card.querySelector('[data-pb-replay]');
    replay?.addEventListener('click', async () => {
      if (!motion) return;
      replay.disabled = true;
      const bars = [...card.querySelectorAll('.pb-bars i')];
      const animations = bars.map((bar, i) => bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: i === 0 ? 3000 : 2400, easing: 'linear' }));
      await Promise.allSettled(animations.map(a => a.finished));
      replay.disabled = !motion;
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target.matches('.world-switcher')) { entry.target.classList.toggle('in-view', entry.isIntersecting); return; }
      if (entry.isIntersecting) {
        if (motion) entry.target.classList.add('reveal-animate');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('[data-reveal], .world-switcher').forEach(el => observer.observe(el));
  const progress = document.querySelector('.scroll-progress');
  let scheduled = false;
  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0})`;
    scheduled = false;
  };
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateProgress); } }, { passive: true });
  window.addEventListener('resize', updateProgress);
  updateProgress();

  // Open a directly linked project when it is inside a disclosure.
  const showHash = () => {
    if (!location.hash) return;
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const disclosure = target?.matches('details') ? target : target?.closest('details');
    if (disclosure) disclosure.open = true;
  };
  showHash(); window.addEventListener('hashchange', showHash);
})();
