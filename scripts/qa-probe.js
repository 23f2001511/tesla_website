#!/usr/bin/env node
/**
 * Full-site QA probe — drives real Chrome over CDP and reports, for every
 * route: console errors, uncaught exceptions, failed / 4xx-5xx requests and
 * horizontal overflow, at desktop (1440) and mobile (390) widths.
 *
 * Usage:
 *   node scripts/qa-probe.js                        # localhost:3100
 *   node scripts/qa-probe.js http://localhost:3000  # custom base URL
 *
 * Auth-gated routes are probed only when QA_TOKEN is set (or the file
 * /tmp/qa_token.txt exists) — the token is sent as the `token` cookie.
 */
const { spawn } = require('child_process');
const fs = require('fs');

const BASE = (process.argv[2] || process.env.QA_BASE || 'http://localhost:3100').replace(/\/$/, '');
const CHROME =
  process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = Number(process.env.QA_CDP_PORT || 9511);
const SETTLE_MS = Number(process.env.QA_SETTLE_MS || 2500);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PUBLIC_ROUTES = [
  '/', '/about', '/events', '/team', '/blogs', '/resources', '/alumni',
  '/gallery', '/contact', '/achievements', '/login', '/register', '/set-password',
];

const AUTHED_ROUTES = [
  '/dashboard', '/dashboard/profile', '/dashboard/profile/edit', '/dashboard/members',
  '/dashboard/members/team', '/dashboard/members/events', '/dashboard/members/blogs',
  '/dashboard/members/achievments', '/dashboard/leadership', '/dashboard/leadership/events',
  '/dashboard/leadership/members', '/dashboard/leadership/blogs', '/dashboard/leadership/gallery',
  '/dashboard/leadership/resources', '/dashboard/leadership/alumni',
  '/dashboard/leadership/club-achievements', '/dashboard/leadership/events-blogs',
  '/dashboard/alumni', '/dashboard/alumni/insights', '/dashboard/alumni/network',
  '/dashboard/gallery', '/dashboard/resources', '/dashboard/my-journey', '/dashboard/settings',
  '/admin', '/admin/members', '/admin/events', '/admin/blogs', '/admin/gallery',
  '/admin/resources', '/admin/achievements', '/admin/alumni',
];

const token =
  process.env.QA_TOKEN ||
  (fs.existsSync('/tmp/qa_token.txt') ? fs.readFileSync('/tmp/qa_token.txt', 'utf8').trim() : '');
const AUTHED = token ? AUTHED_ROUTES : [];

// Noise that is never actionable in a production smoke test.
const IGNORE = [/favicon/i, /Download the React DevTools/i, /\[Fast Refresh\]/i, /net::ERR_ABORTED/];

async function main() {
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--mute-audio',
      `--user-data-dir=/tmp/qa-probe-profile-${DEBUG_PORT}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  let ver = null;
  for (let i = 0; i < 80 && !ver; i++) {
    try {
      ver = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json();
    } catch {
      await sleep(250);
    }
  }
  if (!ver) {
    chrome.kill();
    throw new Error('Chrome DevTools endpoint never came up');
  }

  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let msgId = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) {
        rej(new Error(JSON.stringify(msg.error)));
      } else {
        res(msg.result);
      }
      return;
    }
    for (const fn of listeners) fn(msg);
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((res, rej) => {
      const id = ++msgId;
      const timer = setTimeout(() => {
        pending.delete(id);
        rej(new Error(`CDP timeout: ${method}`));
      }, 30000);
      pending.set(id, {
        res: (v) => {
          clearTimeout(timer);
          res(v);
        },
        rej: (e) => {
          clearTimeout(timer);
          rej(e);
        },
      });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });

  const results = [];


  for (const width of [1440, 390]) {
    const routes = width === 1440 ? [...PUBLIC_ROUTES, ...AUTHED] : PUBLIC_ROUTES;
    for (const route of routes) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

      const bucket = { console: [], exceptions: [], failed: [], bad: [] };
      const onEvent = (msg) => {
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
          bucket.console.push(
            (msg.params.args || []).map((a) => a.value ?? a.description ?? a.type).join(' ')
          );
        } else if (msg.method === 'Runtime.exceptionThrown') {
          bucket.exceptions.push(
            msg.params.exceptionDetails?.exception?.description ||
              msg.params.exceptionDetails?.text ||
              'unknown exception'
          );
        } else if (msg.method === 'Network.loadingFailed') {
          bucket.failed.push(`${msg.params.errorText} ${msg.params.type}`);
        } else if (msg.method === 'Network.responseReceived') {
          const s = msg.params.response.status;
          if (s >= 400) bucket.bad.push(`${s} ${msg.params.response.url}`);
        }
      };
      listeners.push(onEvent);

      await send('Runtime.enable', {}, sessionId);
      await send('Network.enable', {}, sessionId);
      await send('Page.enable', {}, sessionId);
      await send(
        'Emulation.setDeviceMetricsOverride',
        { width, height: width === 390 ? 844 : 900, deviceScaleFactor: 1, mobile: width === 390 },
        sessionId
      );
      if (token) {
        await send(
          'Network.setCookie',
          { name: 'token', value: token, url: BASE, httpOnly: true, path: '/' },
          sessionId
        );
      }

      const loaded = new Promise((res) => {
        listeners.push((msg) => {
          if (msg.sessionId === sessionId && msg.method === 'Page.loadEventFired') res();
        });
        setTimeout(res, 15000);
      });

      await send('Page.navigate', { url: BASE + route }, sessionId);
      await loaded;
      await sleep(SETTLE_MS);
      // Scroll to the bottom so lazy sections mount before we measure.
      await send(
        'Runtime.evaluate',
        { expression: 'window.scrollTo(0, document.body.scrollHeight); true', returnByValue: true },
        sessionId
      );
      await sleep(600);

      const probe = await send(
        'Runtime.evaluate',
        {
          expression: `(() => ({
            title: document.title,
            overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
            scrollW: document.documentElement.scrollWidth,
            innerW: window.innerWidth,
          }))()`,
          returnByValue: true,
        },
        sessionId
      );

      listeners.splice(listeners.indexOf(onEvent), 1);
      await send('Target.closeTarget', { targetId });

      const clean = (arr) => arr.filter((s) => !IGNORE.some((re) => re.test(s)));
      const entry = {
        route,
        width,
        title: probe.result.value?.title,
        console: clean(bucket.console),
        exceptions: clean(bucket.exceptions),
        failed: clean(bucket.failed),
        bad: clean(bucket.bad),
        overflow: probe.result.value?.overflow,
        scrollW: probe.result.value?.scrollW,
        innerW: probe.result.value?.innerW,
      };
      results.push(entry);

      const bad =
        entry.console.length + entry.exceptions.length + entry.failed.length + entry.bad.length;
      const flag = bad || entry.overflow ? '!' : 'ok';
      console.log(
        `[${flag}] ${width}px ${route} — console:${entry.console.length} exc:${entry.exceptions.length} net:${entry.failed.length} http:${entry.bad.length}${entry.overflow ? ` OVERFLOW(${entry.scrollW}>${entry.innerW})` : ''}`
      );
      for (const c of entry.console.slice(0, 3)) console.log(`    console: ${c.slice(0, 220)}`);
      for (const c of entry.exceptions.slice(0, 3)) console.log(`    exception: ${c.slice(0, 220)}`);
      for (const c of entry.failed.slice(0, 3)) console.log(`    netfail: ${c.slice(0, 220)}`);
      for (const c of entry.bad.slice(0, 3)) console.log(`    http: ${c.slice(0, 220)}`);
    }
  }


  ws.close();
  chrome.kill();

  const problems = results.filter(
    (r) => r.console.length + r.exceptions.length + r.failed.length + r.bad.length || r.overflow
  );
  console.log('\n===== SUMMARY =====');
  console.log(`routes checked: ${results.length}`);
  console.log(`routes with problems: ${problems.length}`);
  fs.writeFileSync('/tmp/qa-probe-results.json', JSON.stringify(results, null, 2));
  console.log('full results → /tmp/qa-probe-results.json');
  process.exit(problems.length ? 1 : 0);
}

main().catch((e) => {
  console.error('PROBE FAILED:', e.message);
  process.exit(2);
});
