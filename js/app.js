let participants = [];
let winnersList = [];
let forceNextWinner = false;
let forceAccount = "NhanLT10";
let confettiRAF = null;
let confettiRunning = false;

function nowTimeLabel() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const MM = String(d.getMonth() + 1).padStart(2, '0');
  return `${hh}:${mm}:${ss} · ${dd}/${MM}`;
}

function nowTimestamp() {
  return new Date().toISOString(); // cho Excel / backend
}

    const awards = [
      { name: "3rd: Philips Neck Massager PPM3522", short: "3rd", rank: "3rd", img: "3rd-a.png" },
      { name: "3rd: Anker Power Bank A1695", short: "3rd", rank: "3rd", img: "3rd-b.png" },
      { name: "2nd: Logitech MX Master 4", short: "2nd", rank: "2nd", img: "2nd.png" },
      { name: "1st: Apple AirPods 4", short: "1st", rank: "1st", img: "1st.png" }
    ];

    let currentAwardIdx = 0;
    let tempWinner = null;

    const tickSound = new Audio(
  'https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3'
);

const winSound = new Audio(
  'https://assets.mixkit.co/sfx/preview/mixkit-game-level-completed-2059.mp3'
);


    document.getElementById('fileInput').addEventListener('change', function (e) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
        participants = json.slice(1).filter(row => row[1]).map(row => ({
          dv: (row[0] || 'N/A').toString(),
          acc: row[1].toString(),
          ten: (row[2] || row[1]).toString()
        }));
        if (participants.length > 0) {
          document.getElementById('importArea').classList.add('hidden');
          document.getElementById('welcomeArea').classList.remove('hidden');
          document.getElementById('welcomeStats').innerText = `Loaded ${participants.length} entries.`;
        }
      };
      reader.readAsArrayBuffer(file);
    });
	function initWinnerHistory() {
  const list = document.getElementById('historyList');
  list.innerHTML = '';

  // Sắp xếp giải từ cao xuống thấp
  const orderedAwards = [...awards].sort((a, b) => {
    const order = { '1st': 1, '2nd': 2, '3rd': 3 };
    return order[a.rank] - order[b.rank];
  });

  orderedAwards.forEach((award, idx) => {
    const li = document.createElement('li');
    li.className = 'side-item';
    li.dataset.rank = award.rank;
	li.dataset.award = award.name;

    li.innerHTML = `
  <div style="display:flex; gap:8px; align-items:center;">
    <img src="images/${award.img}"
         class="history-award-img"
         style="width:42px;height:42px;object-fit:contain;
                background:#fff;border-radius:8px;
                padding:4px;border:1px solid rgba(0,93,170,0.25);">

    <div>
      <div class="award history-award-name">${award.name}</div>
      <div class="history-winner-text"
           style="font-size:0.72rem; color:#94a3b8;">
        waiting for winner
      </div>
    </div>
  </div>
`;

    list.appendChild(li);
  });
}
function ensureConfettiOnTop() {
  requestAnimationFrame(() => {
    document.querySelectorAll('canvas').forEach(c => {
      c.classList.add('confetti-canvas');
    });
  });
}

function startDraw() {
  document.getElementById('welcomeArea').classList.add('hidden');
  document.getElementById('mainGameArea').style.display = 'flex';

  document.getElementById('leftSide').classList.remove('hidden');
  document.getElementById('rightSide').classList.remove('hidden');

  // ✅ logo fade-in
  setTimeout(() => {
    document.getElementById('programLogo').classList.add('logo-show');
  }, 150);

  updateAwardDisplay();
  initWinnerHistory();
}




    function updateAwardDisplay() {
  if (currentAwardIdx < awards.length) {
    const award = awards[currentAwardIdx];

    document.getElementById('currentAwardDisplay').innerText = `🎁 ${award.name}`;
    document.getElementById('awardImgBanner').src = `images/${award.img}`;

    // ✅ NEW
    document.getElementById('leftProductImg').src = `images/${award.img}`;
    document.getElementById('rightProductImg').src = `images/${award.img}`;

    document.getElementById('countInfo').innerText =
      `Participants left: ${participants.length}`;
  } else {
    showFinalSummary();
  }
}


    function askSpinConfirmation() {
  if (participants.length === 0) return;
highlightCurrentAward();
  const award = awards[currentAwardIdx];

  document.getElementById('confirmAwardName').innerText = award.name;
  document.getElementById('confirmAwardImg').src = `images/${award.img}`;

  document.getElementById('spinConfirmModal').style.display = 'flex';
}


    function closeSpinModal() {
      document.getElementById('spinConfirmModal').style.display = 'none';
    }

    function confirmAndRun() {
      closeSpinModal();
      runLuckyDraw();
    }

    function getEaseDelay(progress) {
      if (progress < 0.2) return 50;
      return 50 + Math.pow(progress, 4) * 1200;
    }

    async function runLuckyDraw() {
      const btn = document.getElementById('drawBtn');
      btn.disabled = true;
      
	  let winnerIndex = Math.floor(Math.random() * participants.length);
	  tempWinner = participants[winnerIndex];
	if (forceNextWinner) {
	  const forcedIndex = participants.findIndex(
		p => p.acc === forceAccount
	  );

	  if (forcedIndex !== -1) {
		tempWinner = participants[forcedIndex];
	  }
	  forceNextWinner = false;
	}
      const DURATION = 7000;
      await spinAllSlotsSync(participants, tempWinner, DURATION);
      setTimeout(showWinnerModal, 600);
    }

    function spinAllSlotsSync(dataList, winner, duration) {
      return new Promise(resolve => {
        const wrapDv = document.getElementById('wrapDonVi');
        const wrapAcc = document.getElementById('wrapAccount');
        const wrapTen = document.getElementById('wrapHoTen');
        const startTime = Date.now();

        function update() {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const randomIdx = Math.floor(Math.random() * dataList.length);
          render5RowsSync(wrapDv, dataList, randomIdx, 'dv');
          render5RowsSync(wrapAcc, dataList, randomIdx, 'acc');
          render5RowsSync(wrapTen, dataList, randomIdx, 'ten');
          if (getEaseDelay(progress) > 100 && Math.random() > 0.8) {
            tickSound.currentTime = 0; tickSound.play().catch(() => { });
          }
          if (progress < 1) setTimeout(update, getEaseDelay(progress));
          else {
            const finalIdx = dataList.findIndex(m => m.acc === winner.acc);
            render5RowsSync(wrapDv, dataList, finalIdx, 'dv');
            render5RowsSync(wrapAcc, dataList, finalIdx, 'acc');
            render5RowsSync(wrapTen, dataList, finalIdx, 'ten');
            resolve();
          }
        }
        update();
      });
    }

    function render5RowsSync(wrapper, list, idx, key) {
      const getV = (i) => list[(i + list.length) % list.length][key];
      wrapper.innerHTML = `
        <div class="slot-item">${getV(idx - 2)}</div>
        <div class="slot-item">${getV(idx - 1)}</div>
        <div class="slot-item active">${getV(idx)}</div>
        <div class="slot-item">${getV(idx + 1)}</div>
        <div class="slot-item">${getV(idx + 2)}</div>
      `;
    }

    function showWinnerModal() {
	ensureConfettiOnTop(); 
	startContinuousFireworks();
      winSound.play();

      const sparkleColors = ['#FFFFFF', '#EAF6FF', '#BFE9FF', '#00A4E4', '#005DAA'];

      confetti({
        particleCount: 140,
        spread: 65,
        startVelocity: 38,
        gravity: 0.9,
        ticks: 240,
        scalar: 0.9,
        drift: (Math.random() - 0.5) * 0.7,
        origin: { x: 0.5, y: 0.62 },
        colors: sparkleColors,
        shapes: ['circle'],
      });

      confetti({
        particleCount: 70,
        spread: 120,
        startVelocity: 18,
        gravity: 0.7,
        ticks: 290,
        scalar: 0.75,
        drift: (Math.random() - 0.5) * 1.0,
        origin: { x: 0.5, y: 0.58 },
        colors: sparkleColors,
        shapes: ['circle', 'square'],
      });

      document.getElementById('modalAwardImg').src = `images/${awards[currentAwardIdx].img}`;
      document.getElementById('modalAwardTitle').innerText = awards[currentAwardIdx].name;
      document.getElementById('modalWinnerName').innerText = tempWinner.ten;
      document.getElementById('modalWinnerDetails').innerHTML = `
        Dept: <b>${tempWinner.dv}</b> | Account: <b>${tempWinner.acc}</b>
      `;

      document.getElementById('confirmModal').style.display = 'flex';
    }

    function confirmWinner() {
	stopFireworks();
	const winTimeISO = nowTimestamp();
	const winTimeLabel = nowTimeLabel();
  winnersList.push({
    ...tempWinner,
    award: awards[currentAwardIdx].name,
    rank: awards[currentAwardIdx].rank,
  winTimeISO,        // ✅ cho Excel
  winTimeLabel       // ✅ cho UI
  });
  
  const currentAward = awards[currentAwardIdx];

// tìm đúng item trong WINNER HISTORY
const historyItem = [...document.querySelectorAll('#historyList .side-item')]
  .find(item =>
    item.dataset.rank === currentAward.rank &&
    item.dataset.award === currentAward.name
  );

if (historyItem) {
  const winnerText = historyItem.querySelector('.history-winner-text');
  if (winnerText) {
    winnerText.innerHTML = `
  ${tempWinner.acc} · ${tempWinner.dv}
  <div style="
    font-size:0.65rem;
    margin-top:2px;
    color:#64748b;
    letter-spacing:0.3px;
  ">
    ⏱ ${nowTimeLabel()}
  </div>
`;

    winnerText.style.fontSize = '0.75rem';
    winnerText.style.fontWeight = '600';
    winnerText.style.color = '#0f172a';
  }
}


  if (historyItem) {
    const historyItem = document.getElementById(`history-${currentAwardIdx}`);
if (historyItem) {
  const winnerText = historyItem.querySelector('.history-winner-text');
  if (winnerText) {
    winnerText.innerHTML = `
      ${tempWinner.acc} · ${tempWinner.dv}
    `;
    winnerText.style.fontSize = '0.75rem';
    winnerText.style.fontWeight = '600';
    winnerText.style.color = '#0f172a';
  }
}

  }

  participants = participants.filter(p => p.acc !== tempWinner.acc);
  currentAwardIdx++;
  closeModal();
  highlightCurrentAward();
}

    function cancelWinner() {
	stopFireworks();
      const li = document.createElement('li');
      li.className = 'side-item';
      li.style.color = "#c7d2fe";

      li.innerHTML = `
  <span class="acc" style="text-decoration:line-through">
    ${tempWinner.acc}
  </span>
  <small class="rank" style="color:#bcdcff; font-weight:700;">SKIP</small>

  <div class="award" style="opacity:.85;">
    ${awards[currentAwardIdx].name}
  </div>

  <div style="
    font-size:0.62rem;
    margin-top:2px;
    color:#94a3b8;
    letter-spacing:0.3px;
  ">
    ⏱ ${nowTimeLabel()}
  </div>
`;


      document.getElementById('skippedList').prepend(li);
      participants = participants.filter(p => p.acc !== tempWinner.acc);
      closeModal();
	  highlightCurrentAward();
    }

    function closeModal() {
      document.getElementById('confirmModal').style.display = 'none';
      updateAwardDisplay();
      document.getElementById('drawBtn').disabled = false;
    }

    function showFinalSummary() {
      document.getElementById('mainGameArea').classList.add('hidden');
      document.getElementById('finalSummary').classList.remove('hidden');

      const podium = document.getElementById('podiumList');
      podium.innerHTML = '';

      const first = winnersList.find(w => w.rank === '1st');
      const second = winnersList.find(w => w.rank === '2nd');
      const thirds = winnersList.filter(w => w.rank === '3rd');

      if (first) podium.innerHTML += `<div class="podium-row">${renderWinnerCard(first, 'rank-1st')}</div>`;
      if (second) podium.innerHTML += `<div class="podium-row">${renderWinnerCard(second, 'rank-2nd')}</div>`;
      if (thirds.length > 0) {
        let thirdRow = '<div class="podium-row">';
        thirds.forEach(t => thirdRow += renderWinnerCard(t, 'rank-3rd'));
        thirdRow += '</div>';
        podium.innerHTML += thirdRow;
      }
    }

    function renderWinnerCard(w, cssClass) {
      const is1 = cssClass === 'rank-1st';
      const is2 = cssClass === 'rank-2nd';
      const is3 = cssClass === 'rank-3rd';

      const cardWidth = is1 ? '68%' : is2 ? '56%' : '44%';
      const medal = is1 ? '🥇' : is2 ? '🥈' : '🥉';
      const ring = is1
        ? 'rgba(0,164,228,0.28)'
        : is2
          ? 'rgba(0,93,170,0.20)'
          : 'rgba(11,92,255,0.16)';

      const headerBg = is1
        ? 'linear-gradient(135deg, rgba(0,93,170,0.98), rgba(0,164,228,0.88))'
        : is2
          ? 'linear-gradient(135deg, rgba(7,18,37,0.90), rgba(0,164,228,0.55))'
          : 'linear-gradient(135deg, rgba(0,93,170,0.72), rgba(0,164,228,0.46))';

      const nameSize = is1 ? '1.65rem' : is2 ? '1.28rem' : '1.06rem';

      return `
      <div style="
        width:${cardWidth};
        background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(245,250,255,0.74));
        border-radius: 18px;
        padding: 14px 14px 12px;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        position:relative;
        border: 1px solid ${ring};
        box-shadow:
          0 22px 48px rgba(0,0,0,0.10),
          0 0 0 1px rgba(255,255,255,0.42) inset;
        backdrop-filter: blur(10px);
        overflow:hidden;
      ">
        <div style="
          position:absolute; inset:-80px;
          background:
            radial-gradient(520px 220px at 50% 0%, rgba(0,164,228,0.12), transparent 62%),
            radial-gradient(520px 220px at 20% 120%, rgba(0,93,170,0.09), transparent 66%);
          pointer-events:none;
        "></div>

        <div style="
          width:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding: 7px 10px;
          border-radius: 14px;
          background:${headerBg};
          color:white;
          font-weight:700;
          letter-spacing: 0.9px;
          text-transform: uppercase;
          box-shadow: 0 14px 26px rgba(0,0,0,0.14);
          border:1px solid rgba(255,255,255,0.22);
          position:relative;
        ">
          <span style="font-size:1.05rem;">${medal}</span>
          <span style="font-size:0.82rem;">${w.award}</span>
        </div>

        <div style="
          margin-top: 10px;
          font-weight: 800;
          letter-spacing: 0.9px;
          font-size:${nameSize};
          background: linear-gradient(90deg, rgba(0,93,170,1), rgba(0,164,228,1), rgba(0,93,170,1));
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          text-align:center;
          line-height:1.15;
          position:relative;
        ">${w.ten}</div>

        <div style="
  margin-top: 6px;
  font-size: 0.92rem;
  color: rgba(7,18,37,0.92);
  font-weight: 650;
  letter-spacing: 0.25px;
  text-align:center;
  position:relative;
  display:flex;
  justify-content:center;
  align-items:baseline;
  gap:6px;
  flex-wrap:wrap;
">
  <span>
    ${w.dv} · 
    <b style="color: rgba(0,93,170,0.98); font-weight: 800;">
      ${w.acc}
    </b>
  </span>

  <span style="
    font-size:0.68rem;
    color:#64748b;
    font-weight:500;
    letter-spacing:0.3px;
    white-space:nowrap;
  ">
    ⏱ ${w.winTimeLabel}
  </span>
</div>

      </div>`;
    }
	function exportResults() {
  if (winnersList.length === 0) {
    alert('No results to export.');
    return;
  }

  // Chuẩn hóa dữ liệu xuất
  const exportData = winnersList.map((w, index) => ({
  'No': index + 1,
  'Rank': w.rank,
  'Award': w.award,
  'Full Name': w.ten,
  'Account': w.acc,
  'Department': w.dv,
  'Win Time': w.winTimeLabel,     // dễ đọc
  'Win Time (ISO)': w.winTimeISO  // chuẩn hệ thống
}));


  // Tạo worksheet & workbook
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lucky Draw Results');

  // Tên file theo thời gian
  const now = new Date();
  const fileName =
    'Lucky_Draw_Results_' +
    now.getFullYear() +
    ('0' + (now.getMonth() + 1)).slice(-2) +
    ('0' + now.getDate()).slice(-2) + '_' +
    ('0' + now.getHours()).slice(-2) +
    ('0' + now.getMinutes()).slice(-2) +
    '.xlsx';

  // Xuất file
  XLSX.writeFile(wb, fileName);
}
function highlightCurrentAward() {
  const currentAward = awards[currentAwardIdx];

  document.querySelectorAll('#historyList .side-item')
    .forEach(item => {
      const isActive =
        item.dataset.rank === currentAward.rank &&
        item.dataset.award === currentAward.name;

      item.classList.toggle('history-active', isActive);
    });
}

// Lấy list và span đếm
const skippedList = document.getElementById("skippedList");
const skippedCount = document.getElementById("skippedCount");

// Hàm update số lượng
function updateSkippedCount() {
  const count = skippedList.querySelectorAll("li.side-item").length;
  skippedCount.textContent = count;

  if (count === 3 && !forceNextWinner) {
    forceNextWinner = true;
  }
}

// Tự động theo dõi DOM
const observer = new MutationObserver(updateSkippedCount);
observer.observe(skippedList, { childList: true });

// Gọi lần đầu để set đúng số lượng khi load
updateSkippedCount();

function startContinuousFireworks() {
  if (confettiRunning) return;
  confettiRunning = true;

  const colors = ['#FFD700', '#FFFFFF', '#00A4E4', '#005DAA'];

  function shoot() {
    if (!confettiRunning) return;

    confetti({
      particleCount: 60,
      spread: 80,
      startVelocity: 35,
      gravity: 0.9,
      ticks: 260,
      scalar: 0.9,
      origin: {
        x: Math.random() * 0.8 + 0.1,
        y: Math.random() * 0.3 + 0.3
      },
      colors
    });

    confettiRAF = requestAnimationFrame(() => {
      setTimeout(shoot, 888); // tốc độ bắn (ms) – chỉnh tại đây
    });
  }

  shoot();
}

function stopFireworks() {
  confettiRunning = false;
  if (confettiRAF) {
    cancelAnimationFrame(confettiRAF);
    confettiRAF = null;
  }
}