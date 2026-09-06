const ShowResult = (() => {
  'use strict';

  const init = () => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("result");
    const level = params.get("level");
    const assist = params.get("assist");
    const timeSec = Number(params.get("time"));
    const miss = params.get("miss");
    const missLimit = params.get("missLimit");
    const field = params.get("field"); // ★ 追加

    document.getElementById("resultTitle").textContent =
      result === "Clear" ? "🎉 Clear!" : "Game Over";

    document.getElementById("valLevel").textContent = level;
    document.getElementById("valAssist").textContent = assist;
    document.getElementById("valTime").textContent =
      `${String(Math.floor(timeSec / 60)).padStart(2, "0")}:${String(timeSec % 60).padStart(2, "0")}`;
    document.getElementById("valMiss").textContent = `${miss}/${missLimit}`;

    const dataUrl = sessionStorage.getItem("resultPuzzleImage");
    const img = document.getElementById("puzzleImage");
    if (dataUrl) {
      img.src = dataUrl;
    }

    document.getElementById("btnDownload").addEventListener("click", () => {
      if (!dataUrl) return;

  // ★ 追加：ファイル名生成
  const n = Math.sqrt(Number(field)); // 例: field=16 → n=4
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  const dateStr =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const timeStr =
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  const fileName = `sudoku_result_${n}^2_${dateStr}_${timeStr}.png`;

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName; // ★ 変更：固定文字列だったdownload属性を動的生成に
  a.click();
});

    // ★ 追加：もう一度トライ → 同じ設定でPlayGameへ
    document.getElementById("btnRetry").addEventListener("click", () => {
      const retryParams = new URLSearchParams({
        level: level,
        assist: assist,
        miss: missLimit, // ★ PlayGame側は "miss" キーで上限値を受け取る仕様のため
        field: field,
      });
      window.location.href = `../PlayGame.html?${retryParams.toString()}`;
    });

    // ★ 追加：TOPに戻る → SelectLevelへ
    document.getElementById("btnTop").addEventListener("click", () => {
      window.location.href = `../../../SelectLevel.html`;
    });
  };

  return { init };
})();

window.addEventListener("load", () => {
  ShowResult.init();
});