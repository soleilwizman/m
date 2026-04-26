(function () {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const errorEl = document.getElementById('formError');

  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchError = document.getElementById('searchError');

  const landing = document.getElementById('landing');
  const loading = document.getElementById('loading');
  const article = document.getElementById('article');
  const channelResults = document.getElementById('channelResults');
  const channelPage = document.getElementById('channelPage');
  const aboutSection = document.getElementById('about');

  const readAnotherBtn = document.getElementById('readAnotherBtn');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const VIEWS = { landing, loading, article, channelResults, channelPage };
  let currentView = 'landing';
  let lastChannel = null;
  let toastTimer = null;
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastClose = document.getElementById('toastClose');
  toastClose.addEventListener('click', hideToast);

  const articleBackBtn = document.getElementById('articleBackBtn');
  articleBackBtn.addEventListener('click', () => {
    if (lastChannel) showView('channelPage');
    else showLanding();
  });

  function showToast(msg) {
    if (!msg) return;
    toastMsg.textContent = msg;
    toast.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 7000);
  }

  function hideToast() {
    toast.hidden = true;
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
  }

  document.querySelectorAll('.example').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.url) {
        input.value = btn.dataset.url;
        form.requestSubmit();
      } else if (btn.dataset.search) {
        searchInput.value = btn.dataset.search;
        searchForm.requestSubmit();
      }
    });
  });

  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.back;
      if (target === 'landing') showLanding();
      else if (target === 'channelResults') showView('channelResults');
    });
  });

  readAnotherBtn.addEventListener('click', () => {
    lastChannel = null;
    showLanding();
    input.value = '';
    searchInput.value = '';
    input.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;
    await loadTranscript(url);
  });

  searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
    await loadChannelSearch(q);
  });

  async function loadTranscript(url, opts) {
    const fromChannel = opts && opts.fromChannel;
    if (!fromChannel) lastChannel = null;
    hideError(errorEl);
    hideToast();
    setSubmitLoading(submitBtn, true, 'Reading…', 'Read it');
    showView('loading');
    try {
      const res = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      renderArticle(data);
      if (lastChannel) {
        articleBackBtn.textContent = `← Back to ${lastChannel.name}`;
        articleBackBtn.hidden = false;
      } else {
        articleBackBtn.hidden = true;
      }
      showView('article');
    } catch (err) {
      const message = err.message || 'Something went wrong.';
      if (lastChannel) {
        showToast(message);
        showView('channelPage');
      } else {
        showError(errorEl, message);
        showLanding();
      }
    } finally {
      setSubmitLoading(submitBtn, false, 'Reading…', 'Read it');
    }
  }

  async function loadChannelSearch(q) {
    hideError(searchError);
    setSubmitLoading(searchBtn, true, 'Searching…', 'Search');
    showView('loading');
    try {
      const res = await fetch(`/api/search-channels?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed.');
      renderChannelResults(q, data.channels || []);
      showView('channelResults');
    } catch (err) {
      showError(searchError, err.message || 'Search failed.');
      showLanding();
    } finally {
      setSubmitLoading(searchBtn, false, 'Searching…', 'Search');
    }
  }

  async function loadChannel(channel) {
    showView('loading');
    try {
      const res = await fetch(`/api/channel-videos?id=${encodeURIComponent(channel.id)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load channel.');
      lastChannel = channel;
      renderChannelPage(channel, data);
      showView('channelPage');
    } catch (err) {
      showToast(err.message || 'Could not load channel.');
      showView('channelResults');
    }
  }

  function setSubmitLoading(btn, on, busyLabel, idleLabel) {
    if (!btn) return;
    btn.disabled = on;
    btn.textContent = on ? busyLabel : idleLabel;
  }

  function showView(name) {
    Object.entries(VIEWS).forEach(([k, el]) => {
      if (!el) return;
      el.hidden = k !== name;
    });
    aboutSection.hidden = name !== 'landing';
    readAnotherBtn.hidden = name === 'landing' || name === 'loading';
    currentView = name;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function showLanding() {
    showView('landing');
  }

  function showError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideError(el) {
    if (!el) return;
    el.hidden = true;
    el.textContent = '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }

  function renderArticle(data) {
    document.title = `${data.title} — Tubestack`;
    document.getElementById('articleTitle').textContent = data.title;

    const author = document.getElementById('articleAuthor');
    author.textContent = data.author;
    author.href = data.authorUrl || data.videoUrl;

    const meta = document.getElementById('articleMeta');
    meta.textContent = `${data.readMinutes} min read · ${data.durationFormatted} video · ${data.wordCount.toLocaleString()} words`;

    document.getElementById('articleVideoLink').href = data.videoUrl;
    document.getElementById('articleThumbLink').href = data.videoUrl;
    const thumb = document.getElementById('articleThumb');
    thumb.src = data.thumbnail;
    thumb.alt = data.title;

    const body = document.getElementById('articleBody');
    body.innerHTML = data.paragraphs
      .map((p) => {
        const tsUrl = `${data.videoUrl}&t=${p.seconds}s`;
        return `<p class="para"><a class="ts" href="${escapeHtml(tsUrl)}" target="_blank" rel="noreferrer" title="Jump to ${escapeHtml(
          p.timestamp
        )} on YouTube">${escapeHtml(p.timestamp)}</a>${escapeHtml(p.text)}</p>`;
      })
      .join('');
  }

  function renderChannelResults(query, channels) {
    document.title = `${query} — Tubestack`;
    document.getElementById('channelResultsTitle').textContent = `Channels matching "${query}"`;
    const list = document.getElementById('channelList');
    const empty = document.getElementById('channelResultsEmpty');
    list.innerHTML = '';
    if (!channels.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    channels.forEach((c) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'channel-card';
      btn.type = 'button';
      btn.innerHTML = `
        <img class="avatar" src="${escapeHtml(c.thumbnail || '')}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="info">
          <p class="name">${escapeHtml(c.name)}${c.verified ? '<span class="verified" aria-label="Verified"></span>' : ''}</p>
          ${c.subscribers ? `<p class="sub">${escapeHtml(c.subscribers)}</p>` : ''}
          ${c.description ? `<p class="desc">${escapeHtml(c.description)}</p>` : ''}
        </div>
      `;
      btn.addEventListener('click', () => loadChannel(c));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  function renderChannelPage(channel, data) {
    document.title = `${data.channelTitle || channel.name} — Tubestack`;
    document.getElementById('channelName').textContent = data.channelTitle || channel.name;
    const avatar = document.getElementById('channelAvatar');
    avatar.src = channel.thumbnail || '';
    avatar.alt = '';
    avatar.onerror = () => {
      avatar.style.visibility = 'hidden';
    };
    const sub = document.getElementById('channelSub');
    sub.textContent = channel.subscribers || '';
    sub.hidden = !channel.subscribers;
    const desc = document.getElementById('channelDesc');
    desc.textContent = channel.description || '';
    desc.hidden = !channel.description;

    const list = document.getElementById('videoList');
    const empty = document.getElementById('videoListEmpty');
    list.innerHTML = '';
    const videos = data.videos || [];
    if (!videos.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    videos.forEach((v) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'video-card';
      btn.type = 'button';
      btn.innerHTML = `
        <img class="thumb" src="${escapeHtml(v.thumbnail)}" alt="" onerror="this.style.visibility='hidden'" />
        <div class="info">
          <p class="title">${escapeHtml(v.title)}</p>
          <p class="date">${escapeHtml(formatDate(v.published))}</p>
          ${v.description ? `<p class="desc">${escapeHtml(v.description)}</p>` : ''}
        </div>
      `;
      btn.addEventListener('click', () => loadTranscript(v.url, { fromChannel: true }));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }
})();
