(function () {
  const form = document.getElementById('urlForm');
  const input = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const errorEl = document.getElementById('formError');
  const landing = document.getElementById('landing');
  const loading = document.getElementById('loading');
  const article = document.getElementById('article');
  const readAnotherBtn = document.getElementById('readAnotherBtn');
  const aboutSection = document.getElementById('about');
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  document.querySelectorAll('.example').forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.url || '';
      form.requestSubmit();
    });
  });

  readAnotherBtn.addEventListener('click', () => {
    showLanding();
    input.value = '';
    input.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = input.value.trim();
    if (!url) return;
    hideError();
    setLoading(true);
    try {
      const res = await fetch('/api/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      renderArticle(data);
      showArticle();
    } catch (err) {
      showError(err.message || 'Something went wrong.');
      showLanding();
    } finally {
      setLoading(false);
    }
  });

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.textContent = on ? 'Reading…' : 'Read it';
    if (on) {
      landing.hidden = true;
      article.hidden = true;
      aboutSection.hidden = true;
      loading.hidden = false;
    } else {
      loading.hidden = true;
    }
  }

  function showLanding() {
    landing.hidden = false;
    article.hidden = true;
    loading.hidden = true;
    aboutSection.hidden = false;
    readAnotherBtn.hidden = true;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function showArticle() {
    landing.hidden = true;
    loading.hidden = true;
    aboutSection.hidden = true;
    article.hidden = false;
    readAnotherBtn.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  }

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  function hideError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderArticle(data) {
    document.title = `${data.title} — Tubestack`;

    document.getElementById('articleTitle').textContent = data.title;

    const author = document.getElementById('articleAuthor');
    author.textContent = data.author;
    author.href = data.authorUrl || data.videoUrl;

    const meta = document.getElementById('articleMeta');
    meta.textContent = `${data.readMinutes} min read · ${data.durationFormatted} video · ${data.wordCount.toLocaleString()} words`;

    const videoLink = document.getElementById('articleVideoLink');
    videoLink.href = data.videoUrl;

    const thumbLink = document.getElementById('articleThumbLink');
    thumbLink.href = data.videoUrl;
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
})();
