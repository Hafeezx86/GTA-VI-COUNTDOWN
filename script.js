// If the logo image is missing, show the words "GTA VI" in its place
const logo = document.getElementById('logo');
function useTextLogo() {
  const span = document.createElement('span');
  span.className = 'logo-fallback';
  span.textContent = 'GTA VI';
  logo.replaceWith(span);
}
if (logo.complete && logo.naturalWidth === 0) {
  useTextLogo();                 // already failed before this script ran
} else {
  logo.addEventListener('error', useTextLogo);
}

// Launch date: 19 November 2026 (month is 0-based, so 10 = November)
const LAUNCH = { year: 2026, month: 10, day: 19, hour: 0, minute: 0 };

// One entry per UTC offset from -12 to +14, with a well-known city for each
const ZONES = [
  ['Baker Island (UTC−12)', 'Etc/GMT+12'],
  ['Pago Pago (UTC−11)', 'Pacific/Pago_Pago'],
  ['Honolulu (UTC−10)', 'Pacific/Honolulu'],
  ['Anchorage (UTC−9)', 'America/Anchorage'],
  ['Los Angeles (UTC−8)', 'America/Los_Angeles'],
  ['Denver (UTC−7)', 'America/Denver'],
  ['Chicago (UTC−6)', 'America/Chicago'],
  ['New York (UTC−5)', 'America/New_York'],
  ['Halifax (UTC−4)', 'America/Halifax'],
  ['São Paulo (UTC−3)', 'America/Sao_Paulo'],
  ['South Georgia (UTC−2)', 'Atlantic/South_Georgia'],
  ['Cape Verde (UTC−1)', 'Atlantic/Cape_Verde'],
  ['London (UTC+0)', 'Europe/London'],
  ['Paris / Berlin (UTC+1)', 'Europe/Paris'],
  ['Cairo (UTC+2)', 'Africa/Cairo'],
  ['Moscow (UTC+3)', 'Europe/Moscow'],
  ['Dubai (UTC+4)', 'Asia/Dubai'],
  ['Karachi (UTC+5)', 'Asia/Karachi'],
  ['New Delhi (UTC+5:30)', 'Asia/Kolkata'],
  ['Dhaka (UTC+6)', 'Asia/Dhaka'],
  ['Bangkok (UTC+7)', 'Asia/Bangkok'],
  ['Singapore (UTC+8)', 'Asia/Singapore'],
  ['Tokyo (UTC+9)', 'Asia/Tokyo'],
  ['Sydney (UTC+11 in Nov)', 'Australia/Sydney'],
  ['Auckland (UTC+13 in Nov)', 'Pacific/Auckland'],
  ['Kiritimati (UTC+14)', 'Pacific/Kiritimati'],
];

// How many ms a time zone is ahead of UTC at a given instant
function offsetMs(timeZone, utcMs) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const v = {};
  parts.forEach(p => { v[p.type] = Number(p.value); });
  const asUtc = Date.UTC(v.year, v.month - 1, v.day, v.hour, v.minute, v.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

// The real moment (UTC ms) when the clock reads LAUNCH in the given zone
function launchInstant(timeZone) {
  const wall = Date.UTC(LAUNCH.year, LAUNCH.month, LAUNCH.day, LAUNCH.hour, LAUNCH.minute);
  let guess = wall - offsetMs(timeZone, wall);
  guess = wall - offsetMs(timeZone, guess); // second pass handles DST edges
  return guess;
}

// Viewer's own zone: midnight on launch day in local time
const localLaunch = new Date(LAUNCH.year, LAUNCH.month, LAUNCH.day, LAUNCH.hour, LAUNCH.minute).getTime();

const pad = n => String(n).padStart(2, '0');
function formatRemaining(ms) {
  if (ms <= 0) return 'OUT NOW!';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${pad(d)}:${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

// Build the table once
const viewerFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
});
const tbody = document.getElementById('tz-table');
const rows = ZONES.map(([label, zone]) => {
  const instant = launchInstant(zone);
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${label}</td>
    <td>Thu 19 Nov 2026, 00:00</td>
    <td>${viewerFmt.format(new Date(instant))}</td>
    <td class="countdown"></td>`;
  tbody.appendChild(tr);
  return { instant, cell: tr.querySelector('.countdown') };
});

// Fireworks: play for 5 minutes once the countdown reaches zero, never before.
// If the page is opened partway through those 5 minutes, play for the time left.
const FIREWORKS_MS = 5 * 60 * 1000;
let fireworksStarted = false;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function maybeStartFireworks(now) {
  if (fireworksStarted || reduceMotion) return;
  const sinceLaunch = now - localLaunch;
  if (sinceLaunch >= 0 && sinceLaunch < FIREWORKS_MS) {
    fireworksStarted = true;
    startFireworks(FIREWORKS_MS - sinceLaunch);
  }
}

// Update every second
const mainEl = document.getElementById('main-countdown');
function tick() {
  const now = Date.now();
  maybeStartFireworks(now);
  mainEl.textContent = formatRemaining(localLaunch - now);
  rows.forEach(r => { r.cell.textContent = formatRemaining(r.instant - now); });
}
tick();
setInterval(tick, 1000);
