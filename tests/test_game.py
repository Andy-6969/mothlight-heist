"""Play-tests for Mothlight in headless Chromium (Playwright).

Serve the game first (`node serve.ts --port 8094`), then run: python tests/test_game.py
Each test drives the real game through window.__mothlight, the same input a player gives.
"""
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8094/"
T = 32

START_JOB = """(keys) => {
  const m = window.__mothlight, I = m.input;
  I.press('Enter'); m.step(1);
  for (const k of keys) { I.press(k); m.step(1); }
  I.press('Enter'); m.step(1);
  return m.game.scene;
}"""


def fresh(page, keys=()):
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_function("window.__mothlight !== undefined")
    assert page.evaluate(START_JOB, list(keys)) == "heist"


def test_boots_without_errors(page, errors):
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__mothlight.game.scene") == "title"
    assert not errors, errors


def test_plan_shop_respects_budget(page, errors):
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    res = page.evaluate("""() => {
      const m = window.__mothlight, I = m.input;
      I.press('Enter'); m.step(1);
      for (let i = 0; i < 12; i++) { I.press('3'); m.step(1); I.press('1'); m.step(1); }
      const p = m.game.plan;
      const cost = p.kit.smoke * 90 + p.kit.lure * 30 + p.kit.loop * 110 + p.kit.pick * 60 + p.kit.cutter * 40;
      return { cost, budget: p.budget, loop: p.kit.loop, smoke: p.kit.smoke };
    }""")
    assert res["cost"] <= res["budget"]
    assert res["loop"] <= 2 and res["smoke"] <= 3


def test_thief_moves_and_sneaks(page, errors):
    fresh(page)
    res = page.evaluate("""() => {
      const m = window.__mothlight, I = m.input, t = m.game.run.thief;
      const x0 = t.x; I.hold('d', true); m.step(30); I.hold('d', false);
      const walked = t.x - x0;
      const x1 = t.x; I.hold('Shift', true); I.hold('a', true); m.step(30); I.hold('a', false); I.hold('Shift', false);
      return { walked, sneaked: x1 - t.x };
    }""")
    assert res["walked"] > 40
    assert 0 < res["sneaked"] < res["walked"]


def test_lit_thief_is_caught_fairly(page, errors):
    fresh(page)
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run, g = r.guards[0];
      r.thief.x = g.x + Math.cos(g.angle) * 90; r.thief.y = g.y + Math.sin(g.angle) * 90;
      let firstAlert = -1;
      for (let i = 0; i < 600 && !r.outcome; i++) { m.step(1); if (firstAlert < 0 && g.state === 'alert') firstAlert = i; }
      return { firstAlert, outcome: r.outcome, scene: m.game.scene, alarm: r.alarm.value };
    }""")
    assert res["firstAlert"] > 30, "a sighting must take more than half a second to become an alert"
    assert res["outcome"] == "caught" and res["scene"] == "caught"
    assert res["alarm"] >= 22


def test_shadow_slows_detection(page, errors):
    fresh(page)
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run;
      // the thief crouches in hatched shadow at the edge of a lit cone's reach
      r.guards.forEach(g => { g.x = 40; g.y = 520; g.route = [{x:40,y:520},{x:41,y:520}]; g.path = []; });
      const g = r.guards[0];
      r.thief.x = 6.5 * 32; r.thief.y = 8.5 * 32; // a ':' tile
      g.x = 6.5 * 32 + 110; g.y = 8.5 * 32; g.angle = Math.PI; g.route = [{x:g.x,y:g.y},{x:g.x+1,y:g.y}];
      m.step(60);
      return { tile: r.map.tiles[8][6], sus: g.suspicion, state: g.state };
    }""")
    assert res["tile"] == ":"
    assert res["sus"] < 0.05 and res["state"] != "alert"


def test_smoke_blocks_sight(page, errors):
    fresh(page, ["1"])
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run, I = m.input;
      r.guards.forEach(g => { g.x = 40; g.y = 520; g.route = [{x:40,y:520},{x:41,y:520}]; g.path = []; });
      const g = r.guards[0];
      g.x = 14.5 * 32; g.y = 9.5 * 32; g.angle = 0; g.route = [{x:g.x,y:g.y},{x:g.x+1,y:g.y}];
      r.thief.x = g.x + 150; r.thief.y = g.y;
      I.mouse.x = g.x + 70; I.mouse.y = g.y + 64; I.mouse.clicked = true; m.step(1);
      m.step(60);
      return { smokes: r.smokes.length, sus: g.suspicion };
    }""")
    assert res["smokes"] == 1
    assert res["sus"] < 0.1


def test_full_job_pick_crack_escape(page, errors):
    fresh(page, ["4"])
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run, I = m.input, T = 32;
      r.guards.forEach(g => { g.x = 40; g.y = 520; g.route = [{x:40,y:520},{x:41,y:520}]; g.path = []; });
      r.thief.x = 36.5 * T; r.thief.y = 3.5 * T;   // outside the vault room's locked door
      I.hold('e', true); m.step(110); I.hold('e', false);
      const opened = r.map.doors.some(d => d.open);
      r.thief.x = 36.5 * T; r.thief.y = 5.5 * T + 4;
      I.hold('e', true); m.step(230); I.hold('e', false);
      const cracked = r.map.vault.cracked;
      const ex = r.map.exits[0]; r.thief.x = ex.cx - 40; r.thief.y = ex.cy;
      I.hold('d', true); m.step(40); I.hold('d', false);
      const scene = m.game.scene;
      I.press('Enter'); m.step(1);
      return { opened, cracked, scene, next: m.game.plan && m.game.plan.level.id, score: m.game.score };
    }""")
    assert res["opened"] and res["cracked"]
    assert res["scene"] == "results"
    assert res["next"] == "sallow"
    assert res["score"]["total"] > 0


def test_laser_trips_alarm(page, errors):
    fresh(page)
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run;
      r.guards.forEach(g => { g.x = 40; g.y = 520; g.route = [{x:40,y:520},{x:41,y:520}]; g.path = []; });
      r.time = 0.1;               // the grid is on at the start of each cycle
      r.thief.x = 12.5 * 32; r.thief.y = 10.5 * 32;
      m.step(2);
      return r.alarm.value;
    }""")
    assert res >= 30


def test_every_entry_is_safe_at_the_start(page, errors):
    page.goto(URL)
    page.wait_for_load_state("networkidle")
    res = page.evaluate("""() => {
      const m = window.__mothlight, I = m.input, out = [];
      for (let lvl = 0; lvl < 3; lvl++) {
        for (let e = 0; e < 2; e++) {
          m.startPlan(m.game, lvl);
          m.game.plan.entry = e;
          I.press('Enter'); m.step(1);
          m.step(240);  // stand still at the entry for four seconds
          const r = m.game.run;
          out.push({ lvl, e, worst: Math.max(...r.guards.map(g => g.suspicion)), outcome: r.outcome });
        }
      }
      return out;
    }""")
    for row in res:
        assert row["outcome"] is None and row["worst"] < 0.3, row


def test_retry_after_caught(page, errors):
    fresh(page)
    res = page.evaluate("""() => {
      const m = window.__mothlight, r = m.game.run, I = m.input;
      r.outcome = 'caught'; r.caughtBy = { name: 'x', x: 0, y: 0, seenFor: 1, inShadow: false, sneaking: false };
      m.step(1);
      I.press('r'); m.step(1);
      return { scene: m.game.scene, retries: m.game.run.retries, outcome: m.game.run.outcome };
    }""")
    assert res == {"scene": "heist", "retries": 1, "outcome": None}


def main():
    tests = [v for k, v in globals().items() if k.startswith("test_")]
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for t in tests:
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            errors = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            try:
                t(page, errors)
                assert not errors, errors
                print(f"PASS {t.__name__}")
            except AssertionError as e:
                failed += 1
                print(f"FAIL {t.__name__}: {e}")
            page.close()
        browser.close()
    print(f"{len(tests) - failed}/{len(tests)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
