/**
 * Music Player — Google Drive Backend
 *
 * 音频文件存储在 Google Drive，通过 API 获取直链播放。
 * 配置方式见 music.json。
 */

const CONFIG_URL = 'music.json';

// Google Drive 直链转换
function gdriveDirectUrl(fileId) {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${window.__GDRIVE_API_KEY__}`;
}

// 格式化时间
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- State ----
let allTracks = [];  // 全部曲目
let tracks = [];     // 当前筛选后的曲目
let currentIndex = -1;
let isPlaying = false;
let activeTag = null; // 当前选中标签，null 为全部

// ---- DOM ----
const audio       = document.getElementById('audio');
const playlist    = document.getElementById('playlist');
const trackCount  = document.getElementById('trackCount');
const btnPlay     = document.getElementById('btnPlay');
const btnPrev     = document.getElementById('btnPrev');
const btnNext     = document.getElementById('btnNext');
const iconPlay    = btnPlay.querySelector('.icon-play');
const iconPause   = btnPlay.querySelector('.icon-pause');
const progressBar = document.getElementById('progressBar');
const timeCurrent = document.getElementById('timeCurrent');
const timeDuration= document.getElementById('timeDuration');
const volumeBar   = document.getElementById('volumeBar');
const nowTitle    = document.getElementById('nowTitle');

// ---- Load Config ----
// API Key 优先从 URL hash 读取（格式: #key=AIzaXXX），其次从 music.json
function getApiKeyFromHash() {
  const hash = location.hash.slice(1);
  const params = new URLSearchParams(hash);
  return params.get('key') || '';
}

async function init() {
  try {
    const res = await fetch(CONFIG_URL);
    const data = await res.json();
    window.__GDRIVE_API_KEY__ = getApiKeyFromHash() || data.googleDriveApiKey || '';
    allTracks = data.tracks || [];
    tracks = allTracks;
    renderTags();
    renderPlaylist();
    trackCount.textContent = `${tracks.length} tracks`;
  } catch (e) {
    playlist.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">无法加载播放列表，请检查 music.json</div>';
    console.error(e);
  }
}

// ---- Tags ----
const tagsBar = document.getElementById('tagsBar');

function renderTags() {
  // 从所有曲目中收集标签
  const tagSet = new Set();
  allTracks.forEach(t => {
    if (t.tags) t.tags.forEach(tag => tagSet.add(tag));
  });
  if (tagSet.size === 0) { tagsBar.style.display = 'none'; return; }

  const tags = [...tagSet];
  tagsBar.innerHTML = `<button class="tag-btn${!activeTag ? ' active' : ''}" data-tag="">全部</button>` +
    tags.map(tag => `<button class="tag-btn${activeTag === tag ? ' active' : ''}" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('');

  tagsBar.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      activeTag = tag || null;
      filterByTag();
      renderTags();
      renderPlaylist();
    });
  });
}

function filterByTag() {
  if (!activeTag) {
    tracks = allTracks;
  } else {
    tracks = allTracks.filter(t => t.tags && t.tags.includes(activeTag));
  }
  // 更新 currentIndex：找到当前播放曲目在筛选后列表中的位置
  if (currentIndex >= 0) {
    const playingSrc = audio.src;
    currentIndex = tracks.findIndex(t => {
      const url = t.driveId ? gdriveDirectUrl(t.driveId) : t.src;
      return url === playingSrc;
    });
  }
  trackCount.textContent = `${tracks.length} tracks`;
}

// ---- Render ----
function renderPlaylist() {
  playlist.innerHTML = tracks.map((t, i) => `
    <div class="track-item${i === currentIndex ? ' active' : ''}" data-index="${i}">
      <div class="index">
        <span class="index-num">${i + 1}</span>
        <div class="eq-bars"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></div>
      </div>
      <div class="meta">
        <div class="name">${esc(t.title)}</div>
      </div>
      <div class="duration">${t.duration || ''}</div>
    </div>
  `).join('');

  // 点击播放
  playlist.querySelectorAll('.track-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.index);
      if (idx === currentIndex) {
        togglePlay();
      } else {
        playTrack(idx);
      }
    });
  });
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// ---- Playback ----
function playTrack(idx) {
  if (idx < 0 || idx >= tracks.length) return;
  currentIndex = idx;
  const track = tracks[idx];

  // 构建音频 URL
  let src = track.src;
  if (track.driveId) {
    src = gdriveDirectUrl(track.driveId);
  }

  audio.src = src;
  audio.play();
  isPlaying = true;
  updateUI();
}

function togglePlay() {
  if (currentIndex === -1 && tracks.length > 0) {
    playTrack(0);
    return;
  }
  if (isPlaying) {
    audio.pause();
  } else {
    audio.play();
  }
  isPlaying = !isPlaying;
  updateUI();
}

function playPrev() {
  if (tracks.length === 0) return;
  let idx = currentIndex - 1;
  if (idx < 0) idx = tracks.length - 1;
  playTrack(idx);
}

function playNext() {
  if (tracks.length === 0) return;
  let idx = currentIndex + 1;
  if (idx >= tracks.length) idx = 0;
  playTrack(idx);
}

function updateUI() {
  // 播放/暂停图标
  iconPlay.style.display  = isPlaying ? 'none' : '';
  iconPause.style.display = isPlaying ? '' : 'none';

  // 底栏信息
  if (currentIndex >= 0) {
    const t = tracks[currentIndex];
    nowTitle.textContent = t.title;
  }

  // 高亮列表
  playlist.querySelectorAll('.track-item').forEach((el, i) => {
    el.classList.toggle('active', i === currentIndex);
  });

  // 暂停时停止动画
  const eqBars = document.querySelectorAll('.track-item.active .eq-bar');
  eqBars.forEach(b => {
    b.style.animationPlayState = isPlaying ? 'running' : 'paused';
  });
}

// ---- Controls ----
btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', playPrev);
btnNext.addEventListener('click', playNext);

// 进度条
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  progressBar.value = (audio.currentTime / audio.duration) * 100;
  timeCurrent.textContent = fmt(audio.currentTime);
});

audio.addEventListener('loadedmetadata', () => {
  timeDuration.textContent = fmt(audio.duration);
});

audio.addEventListener('ended', playNext);

audio.addEventListener('pause', () => {
  isPlaying = false;
  updateUI();
});

audio.addEventListener('play', () => {
  isPlaying = true;
  updateUI();
});

progressBar.addEventListener('input', () => {
  if (!audio.duration) return;
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

// 音量
audio.volume = 0.8;
volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
});

// 键盘快捷键
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
  if (e.code === 'ArrowLeft')  { e.preventDefault(); playPrev(); }
  if (e.code === 'ArrowRight') { e.preventDefault(); playNext(); }
});

// 启动
init();
