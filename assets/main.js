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
    document.querySelectorAll('[data-growth-replay]').forEach(button => {
      button.disabled = !enabled;
      button.title = enabled ? 'Replay the membership comparison' : 'Enable Motion in the header to replay';
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

  document.querySelectorAll('[data-growth]').forEach(chart => {
    const replay = chart.querySelector('[data-growth-replay]');
    replay?.addEventListener('click', async () => {
      if (!motion || replay.disabled) return;
      replay.disabled = true;
      const animations = [...chart.querySelectorAll('.growth-fill')].map(bar =>
        bar.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
          { duration: 1200, easing: 'cubic-bezier(.22,1,.36,1)' }));
      await Promise.allSettled(animations.map(animation => animation.finished));
      replay.disabled = !motion;
    });
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

  let youtubeAPI;
  const loadYouTubeAPI = () => {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (!youtubeAPI) youtubeAPI = new Promise((resolve, reject) => {
      window.onYouTubeIframeAPIReady = () => resolve(window.YT);
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => { youtubeAPI = undefined; script.remove(); reject(new Error('Player unavailable')); };
      document.head.append(script);
    });
    return youtubeAPI;
  };

  document.querySelectorAll('[data-work-gallery]').forEach(gallery => {
    const tabs = [...gallery.querySelectorAll('.work-tab')];
    const panels = [...gallery.querySelectorAll('.work-panel')];
    const rail = gallery.querySelector('.work-rail');
    let active = tabs[0];
    let player;
    let playerTimeout;
    let mediaSession = 0;
    const visibleTabs = () => tabs.filter(tab => !tab.hidden);
    const stopVideos = () => {
      mediaSession++;
      clearTimeout(playerTimeout);
      if (player) { player.destroy(); player = undefined; }
      gallery.querySelectorAll('[data-video-frame]').forEach(frame => {
        frame.querySelector('iframe')?.remove();
        frame.querySelector('.player-message')?.remove();
        frame.querySelector('img').hidden = false;
        frame.querySelector('[data-video-id]').hidden = false;
      });
      gallery.querySelectorAll('.stop-video,.video-state').forEach(element => element.remove());
    };
    const select = (tab, reveal = false) => {
      stopVideos();
      active = tab;
      tabs.forEach(item => {
        item.setAttribute('aria-selected', String(item === tab));
        item.tabIndex = item === tab ? 0 : -1;
      });
      panels.forEach(panel => {
        const selected = panel.id === tab.getAttribute('aria-controls');
        panel.hidden = !selected;
        if (selected && motion) panel.animate([{ opacity: .15, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' });
      });
      const visible = visibleTabs();
      gallery.querySelector('[data-work-position]').textContent = `${String(visible.indexOf(tab) + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')}`;
      if (reveal) {
        const rect = tab.getBoundingClientRect();
        const box = rail.getBoundingClientRect();
        if (rect.left < box.left || rect.right > box.right) rail.scrollBy({ left: rect.left - box.left, behavior: motion ? 'smooth' : 'auto' });
      }
    };
    tabs.forEach(tab => {
      tab.addEventListener('click', () => select(tab, true));
      tab.addEventListener('keydown', event => {
        const visible = visibleTabs();
        const index = visible.indexOf(tab);
        let next;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % visible.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + visible.length) % visible.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = visible.length - 1;
        if (next === undefined) return;
        event.preventDefault(); select(visible[next], true); visible[next].focus({ preventScroll: true });
      });
    });
    gallery.querySelectorAll('[data-work-filter]').forEach(button => button.addEventListener('click', () => {
      gallery.querySelectorAll('[data-work-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      tabs.forEach(tab => { tab.hidden = button.dataset.workFilter !== 'all' && tab.dataset.workKind !== button.dataset.workFilter; });
      select(visibleTabs()[0]);
      rail.scrollTo({ left: 0, behavior: 'instant' });
    }));
    const step = direction => {
      const visible = visibleTabs();
      select(visible[(visible.indexOf(active) + direction + visible.length) % visible.length], true);
    };
    gallery.querySelector('[data-work-prev]').addEventListener('click', () => step(-1));
    gallery.querySelector('[data-work-next]').addEventListener('click', () => step(1));
    gallery.querySelectorAll('[data-video-id]').forEach(button => button.addEventListener('click', () => {
      stopVideos();
      const session = mediaSession;
      const frame = button.closest('[data-video-frame]');
      const iframe = document.createElement('iframe');
      iframe.id = `player-${gallery.id}-${button.dataset.videoId}`;
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(button.dataset.videoId)}?rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`;
      iframe.title = button.dataset.videoTitle;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.style.opacity = '0';
      iframe.tabIndex = -1;
      button.hidden = true;
      frame.append(iframe);
      const message = document.createElement('div');
      message.className = 'player-message'; message.setAttribute('role', 'status'); message.textContent = 'Loading film…';
      frame.append(message);
      const panel = button.closest('.work-panel');
      const state = document.createElement('span'); state.className = 'video-state'; state.setAttribute('aria-live', 'polite');
      panel.querySelector('.work-actions').append(state);
      const fail = () => {
        if (session !== mediaSession) return;
        clearTimeout(playerTimeout);
        if (player) { player.destroy(); player = undefined; }
        iframe.remove(); frame.querySelector('img').hidden = false;
        message.textContent = 'This player couldn’t load here.';
        const link = document.createElement('a');
        link.href = panel.querySelector('.work-actions a').href;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.className = 'pill light'; link.textContent = 'Watch on YouTube ↗';
        message.append(link); if (!message.isConnected) frame.append(message);
        state.textContent = '';
      };
      playerTimeout = setTimeout(fail, 10000);
      loadYouTubeAPI().then(YT => {
        if (session !== mediaSession || !iframe.isConnected) return;
        player = new YT.Player(iframe.id, { events: {
          onReady: event => {
            if (session !== mediaSession) return;
            clearTimeout(playerTimeout); message.remove();
            frame.querySelector('img').hidden = true; iframe.style.opacity = '1'; iframe.tabIndex = 0;
            event.target.playVideo();
          },
          onStateChange: event => {
            if (session !== mediaSession) return;
            state.textContent = event.data === 1 ? 'Now playing' : event.data === 2 ? 'Paused' : '';
          },
          onError: fail
        } });
      }).catch(fail);
      const stop = document.createElement('button');
      stop.type = 'button'; stop.className = 'text-link stop-video'; stop.textContent = 'Close player';
      stop.addEventListener('click', () => { stopVideos(); button.focus({ preventScroll: true }); });
      panel.querySelector('.work-actions').append(stop);
    }));
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
