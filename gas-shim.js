/* gas-shim.js — ให้หน้าเว็บบน Cloudflare Pages เรียกฟังก์ชันฝั่ง Apps Script ได้ด้วยรูปแบบเดิม google.script.run.xxx()
 * แก้ API_URL เป็นลิงก์เว็บแอป (ลงท้ายด้วย /exec) ของ Apps Script ที่ Deploy แล้วเท่านั้น */
window.API_URL = 'https://script.google.com/macros/s/AKfycbwfvU57Eqkq1HLhCuqlskJKjB8IBDS5Apq1f9jF9g9yE9CHek4GriOhyTsHj5XBMT_K/exec';

(function () {
  function post(fn, args) {
    return fetch(window.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // text/plain = ไม่เกิด CORS preflight
      body: JSON.stringify({ fn: fn, args: args }),
      redirect: 'follow'
    }).then(function (r) {
      if (!r.ok) throw new Error('เซิร์ฟเวอร์ตอบกลับผิดปกติ (' + r.status + ')');
      return r.json();
    }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.error) || 'เกิดข้อผิดพลาด');
      return j.data;
    }, function (e) {
      if (e instanceof TypeError) throw new Error('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตหรือการตั้งค่า Deploy ของ Apps Script');
      throw e;
    });
  }
  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, name) {
        if (name === 'withSuccessHandler') return function (f) { return runner(f, fail); };
        if (name === 'withFailureHandler') return function (f) { return runner(ok, f); };
        if (typeof name !== 'string') return undefined;
        return function () {
          var args = Array.prototype.slice.call(arguments);
          post(name, args).then(function (d) { if (ok) ok(d); }, function (e) { if (fail) fail({ message: e.message }); else console.error(e); });
        };
      }
    });
  }
  window.google = {
    script: {
      run: runner(null, null),
      url: { getLocation: function (cb) { var p = {}; new URLSearchParams(location.search).forEach(function (v, k) { p[k] = v; }); cb({ parameter: p, hash: location.hash.slice(1) }); } }
    }
  };
})();
