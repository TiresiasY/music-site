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

// 封面：如果是 Google Drive ID 则转直链，否则原样返回
function coverUrl(src) {
  if (!src) return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="%23222" width="1" height="1"/></svg>';
  if (src.startsWith('http')) return src;
  // 假设是 Google Drive file ID
  return `https://drive.google.com/thumbnail?id=${src}&sz=w200`;
}

// 格式化时间
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---- State ----
let tracks = [];
let currentIndex = -1;
let isPlaying = false;

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
const coverThumb  = document.getElementById('coverThumb');
const nowTitle    = document.getElementById('nowTitle');
const nowArtist   = document.getElementById('nowArtist');

// ---- Load Config ----
async function init() {
  try {
    const res = await fetch(CONFIG_URL);
    const data = await res.json();
    window.__GDRIVE_API_KEY__ = data.googleDriveApiKey || '';
    tracks = data.tracks || [];
    renderPlaylist();
    trackCount.textContent = `${tracks.length} tracks`;
  } catch (e) {
    playlist.innerHTML = '<div style="padding:40px;text-align:center;color:#666;">无法加载播放列表，请检查 music.json</div>';
    console.error(e);
  }
}

// ---- Render ----
function renderPlaylist() {
  playlist.innerHTML = tracks.map((t, i) => `
    <div class="track-item${i === currentIndex ? ' active' : ''}" data-index="${i}">
      <div class="index">
        <span class="index-num">${i + 1}</span>
        <div class="eq-bars"><span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span></div>
      </div>
      <img class="cover" src="${coverUrl(t.cover)}" alt="" loading="lazy">
      <div class="meta">
        <div class="name">${esc(t.title)}</div>
        <div class="artist">${esc(t.artist || '')}</div>
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
    nowTitle.textContent  = t.title;
    nowArtist.textContent = t.artist || '-';
    coverThumb.src = coverUrl(t.cover);
    coverThumb.style.display = '';
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

// 隐藏默认封面
coverThumb.style.display = 'none';

// 启动
init();
