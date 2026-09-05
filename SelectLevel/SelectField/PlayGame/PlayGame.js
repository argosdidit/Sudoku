const PlayGame = (() => {
  'use strict';

  let level, assist, missLimit, fieldSize;
  let timer = 0;
  let timerId = null;
  let missCount = 0;
  let selectedCell = null;
  let gameEnded = false; // ★ ゲーム終了フラグ
  let completedNumbers = new Set(); // ★ 完成済みの数字を記録

  const func = {
    init: function () {
      this.loadParams();
      this.showHeaderInfo();
      this.startTimer();
      this.makePuzzle();
      this.makeSelectNumbers();
      this.makeMemoNumbers();
      this.bindDelete();

      // ★ 初期状態で既に完成している数字がないか確認
      for (let i = 1; i <= fieldSize; i++) {
        this.checkNumberComplete(i);
      }
      return this;
    },

    // -----------------------------
    // URL パラメータ取得
    // -----------------------------
    loadParams: function () {
      const params = new URLSearchParams(window.location.search);
      level = params.get("level");
      assist = params.get("assist");
      missLimit = params.get("miss");
      fieldSize = Number(params.get("field"));
      return this;
    },

    // -----------------------------
    // 上部情報表示
    // -----------------------------
    showHeaderInfo: function () {
      document.getElementById("txtLevel").textContent = `Level: ${level}`;
      document.getElementById("txtAssist").textContent = `Assist: ${assist}`;
      document.getElementById("txtMiss").textContent = `Miss: ${missCount}/${missLimit}`;
      return this;
    },

    // -----------------------------
    // タイマー開始
    // -----------------------------
    startTimer: function () {
      timerId = setInterval(() => {
        timer++;
        document.getElementById("txtTimer").textContent =
          `Time: ${String(Math.floor(timer / 60)).padStart(2, "0")}:${String(timer % 60).padStart(2, "0")}`;
      },
      1000);
      return this;
    },
    highlightSelectedCell: function (cell) {
      document.querySelectorAll(".cell").forEach(c => {
        c.classList.remove("selected");
        c.style.boxShadow = ""; // ★ 以前選択されていたセルの枠をリセット
      });
      cell.classList.add("selected");
      cell.style.boxShadow = `inset 0 0 0 3px ${this.colorForFieldSize(fieldSize)}`; // ★ 枠内をfieldSizeの色で強調
    },

    // ★ fieldSizeごとの基準色を一元管理
    colorForFieldSize: function (fieldSize) {
      const colors = {
        4:   "#f6c400",
        9:   "#4cff38",
        16:  "#0cf4d1",
        25:  "#1f9aff",
        36:  "#5825f3",
        49:  "#d61feb",
        64:  "#f9147f",
        81:  "#fe5319",
        100: "#ff0b0b",
      };
      return colors[fieldSize] || "#000";
    },

    // ★ ゲーム終了時にSelect/Memoボタンを無効化＆着色
    disableInputButtons: function () {
      gameEnded = true;
      const color = "#FFF";
      document.querySelectorAll(".numBtn, .memoBtn").forEach(btn => {
        btn.style.backgroundColor = color;
        btn.style.color = color; // ★ 文字を背景と同化させ見えなくする
      });
    },

    // ★ ある数字が盤面全体で完成したか判定
    checkNumberComplete: function (n) {
      if (completedNumbers.has(n)) return;

      const total = fieldSize;
      const cells = document.querySelectorAll(".cell");
      let count = 0;

      cells.forEach(c => {
        if ((c.classList.contains("fixed") || c.classList.contains("locked")) &&
            Number(c.textContent) === n) {
          count++;
        }
      });

      if (count >= total) {
        this.lockNumberButtons(n);
      }
    },

    // ★ 完成した数字のSelect/Memoボタンを着色＆記録
    lockNumberButtons: function (n) {
      completedNumbers.add(n);
      const color = "#FFF";
      document.querySelectorAll(".numBtn, .memoBtn").forEach(btn => {
        if (Number(btn.textContent) === n) {
          btn.style.backgroundColor = color;
          btn.style.color = color; // ★ 文字を背景と同化させ見えなくする
        }
      });
    },

    // ★ 対象セルと同じ行・列・ブロックにある他セルを取得
    getRelatedCells: function (cell) {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const n = Math.sqrt(fieldSize);
      const blockRowStart = Math.floor(row / n) * n;
      const blockColStart = Math.floor(col / n) * n;

      const related = [];
      document.querySelectorAll(".cell").forEach(c => {
        if (c === cell) return;
        const r = Number(c.dataset.row);
        const co = Number(c.dataset.col);
        const sameRow = (r === row);
        const sameCol = (co === col);
        const sameBlock =
          r >= blockRowStart && r < blockRowStart + n &&
          co >= blockColStart && co < blockColStart + n;
        if (sameRow || sameCol || sameBlock) related.push(c);
      });
      return related;
    },

    // ★ [3] 正解確定時、周辺セルのメモから該当数字を削除
    removeMemoFromRelated: function (cell, n) {
      const related = this.getRelatedCells(cell);
      related.forEach(c => {
        if (c.classList.contains("fixed") || c.classList.contains("locked")) return;
        let memos = c.dataset.memo ? c.dataset.memo.split(",").map(Number) : [];
        if (memos.includes(n)) {
          memos = memos.filter(x => x !== n);
          c.dataset.memo = memos.join(",");
          c.style.backgroundColor = memos.length > 0 ? this.colorForFieldSize(fieldSize) : "";
        }
      });
    },

    // ★ [4] 対象数字が周辺（行・列・ブロック）で確定済みか判定
    isNumberBlocked: function (cell, n) {
      const related = this.getRelatedCells(cell);
      return related.some(c =>
        (c.classList.contains("fixed") || c.classList.contains("locked")) &&
        Number(c.textContent) === n
      );
    },

    // ★ [6] 指定した数字をメモしているセルに、一時的にその数字を表示する
    revealMemoNumber: function (value) {
      document.querySelectorAll(".cell").forEach(c => {
        if (c.classList.contains("fixed") || c.classList.contains("locked")) return;
        const memos = c.dataset.memo ? c.dataset.memo.split(",").map(Number) : [];
        if (memos.includes(Number(value))) {
          c.textContent = value;
          c.style.color = "#000";
          c.classList.add("memo-preview"); // ★ clearFocusで戻すための目印
        }
      });
    },

    // -----------------------------
    // 選択用数字生成
    // -----------------------------
    makeSelectNumbers: function () {
      const box = document.getElementById("selectNumbers");
      const n = Math.sqrt(fieldSize);

      const btnPx = this.calcButtonSize(fieldSize);
      box.style.setProperty("--btn-size", `${btnPx}px`);
      box.style.gridTemplateColumns = `repeat(${n}, var(--btn-size))`;
      box.style.gridTemplateRows = `repeat(${n}, var(--btn-size))`;

      for (let i = 1; i <= fieldSize; i++) {
        const btn = document.createElement("div");
        btn.className = "numBtn";
        btn.textContent = i;
        btn.addEventListener("click", () => {
          this.handleSelectNumber(i);
        });
        box.appendChild(btn);
      }
      return this;
    },
    handleSelectNumber: function (n) {
      if (!selectedCell) return;
      if (gameEnded) return;
      if (completedNumbers.has(n)) return;

      if (selectedCell.classList.contains("fixed") ||
          selectedCell.classList.contains("locked")) {
            return;
      }
      selectedCell.style.color = "#000";
      selectedCell.textContent = "";
      selectedCell.dataset.memo = "";
      selectedCell.style.backgroundColor = "";
      selectedCell.style.fontWeight = "";
      this.updateMemoButtons();

      const row = Number(selectedCell.dataset.row);
      const col = Number(selectedCell.dataset.col);

      const isCorrect = (n === this.solution[row][col]);

      if (isCorrect) {
        selectedCell.textContent = n;
        selectedCell.style.color = this.colorForFieldSize(fieldSize);
        selectedCell.style.fontWeight = "bold";
        selectedCell.classList.add("locked");

        this.removeMemoFromRelated(selectedCell, n);
        this.checkNumberComplete(n);
      }
      else
      {
        selectedCell.textContent = n;
        selectedCell.style.color = "#FFF";
        selectedCell.style.backgroundColor = "#000";
        selectedCell.style.fontWeight = "bold";

        missCount++;
        document.getElementById("txtMiss").textContent =
          `Miss: ${missCount}/${missLimit}`;
        this.checkGameOver();
        return;
      }
      if (this.checkClear()) {
        clearInterval(timerId);
        this.disableInputButtons();
        alert("🎉 Clear! おめでとうございます！");
        this.endGame("Clear");
      }
    },
    makePuzzle: function () {
      const n = Math.sqrt(fieldSize);
      const solution = this.generateSolution(n);
      const puzzle = this.generatePuzzle(solution, level);

      const puzzleArea = document.getElementById("areaPuzzle");

      const cellPx = this.calcCellSize(fieldSize);
      puzzleArea.style.setProperty("--cell-size", `${cellPx}px`);
      puzzleArea.style.display = "grid";
      puzzleArea.style.gridTemplateColumns = `repeat(${fieldSize}, var(--cell-size))`;
      puzzleArea.style.gridTemplateRows = `repeat(${fieldSize}, var(--cell-size))`;

      for (let r = 0; r < fieldSize; r++) {
        for (let c = 0; c < fieldSize; c++) {
          const cell = document.createElement("div");
          cell.className = "cell";

          const value = puzzle[r][c];

          if (r % n === 0) cell.classList.add("block-top");
          if (c % n === 0) cell.classList.add("block-left");
          if ((r + 1) % n === 0) cell.classList.add("block-bottom");
          if ((c + 1) % n === 0) cell.classList.add("block-right");

          cell.dataset.row = r;
          cell.dataset.col = c;

          if (value !== null) {
            cell.textContent = value;
            cell.classList.add("fixed");

            cell.addEventListener("click", () => {
              selectedCell = cell;

              this.clearFocus();
              this.applyFocus(cell);
              this.highlightSelectedCell(cell);
              this.updateMemoButtons();
            });
          }
          else
          {
            cell.textContent = "";
            cell.addEventListener("click", () => {
              selectedCell = cell;
              this.updateMemoButtons();
              this.clearFocus();
              this.applyFocus(cell);
              this.highlightSelectedCell(cell);
            });
          }
          puzzleArea.appendChild(cell);
        }
      }
      this.solution = solution;
      this.puzzle = puzzle;
      return this;
    },
    calcCellSize: function (fieldSize) {
      if (fieldSize <= 4)  return 90;
      if (fieldSize <= 9)  return 60;
      if (fieldSize <= 16) return 48;
      if (fieldSize <= 25) return 40;
      if (fieldSize <= 36) return 34;
      if (fieldSize <= 49) return 30;
      if (fieldSize <= 64) return 27;
      if (fieldSize <= 81) return 25;
      return 22;
    },
    updateMemoButtons: function() {
      const memos = selectedCell.dataset.memo
      ? selectedCell.dataset.memo.split(",").map(Number)
      : [];

      const color = this.colorForFieldSize(fieldSize);
      document.querySelectorAll(".memoBtn").forEach(btn => {
        const num = Number(btn.textContent);
        if (completedNumbers.has(num)) return;
        btn.style.backgroundColor = memos.includes(num) ? color : "";
      });
    },
    generateSolution: function(n) {
      const size = n * n;
      const board = Array.from({ length: size }, () => Array(size).fill(0));

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          board[r][c] = (r * n + Math.floor(r / n) + c) % size + 1;
        }
      }
      return this.shuffleSolution(board);
    },
    shuffleSolution: function(board) {
      const size = board.length;
      const n = Math.sqrt(size);

      const nums = [...Array(size).keys()].map(x => x + 1);
      nums.sort(() => Math.random() - 0.5);

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          board[r][c] = nums[board[r][c] - 1];
        }
      }

      for (let block = 0; block < n; block++) {
        const start = block * n;
        const rows = [...Array(n).keys()].map(x => start + x);
        rows.sort(() => Math.random() - 0.5);

        const newRows = rows.map(i => board[i]);
        for (let i = 0; i < n; i++) {
          board[start + i] = newRows[i];
        }
      }

      for (let block = 0; block < n; block++) {
        const start = block * n;
        const cols = [...Array(n).keys()].map(x => start + x);
        cols.sort(() => Math.random() - 0.5);

        for (let r = 0; r < size; r++) {
          const row = board[r];
          const newRow = [...row];
          for (let i = 0; i < n; i++) {
            newRow[start + i] = row[cols[i]];
          }
          board[r] = newRow;
        }
      }
      return board;
    },
    generatePuzzle: function(solution, level) {
      const size = solution.length;
      const totalCells = size * size;

      const rate = level === "easy" ? 0.6 : 0.45;
      const filledCount = this.calcFilledCount(totalCells, rate);

      const indices = Array.from({ length: totalCells }, (_, i) => i);

      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }

      const keepSet = new Set(indices.slice(0, filledCount));
      const puzzle = Array.from({ length: size }, () => Array(size).fill(null));

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const idx = r * size + c;
          if (keepSet.has(idx)) {
            puzzle[r][c] = solution[r][c];
          }
        }
      }
      return puzzle;
    },
    calcFilledCount: function(totalCells, rate) {
      const raw = totalCells * rate;

      if (rate === 0.5) {
        return Math.ceil(raw);
      }
      if (rate === 0.8) {
        return Math.floor(raw);
      }
      return Math.round(raw);
    },
    applyFocus: function(cell) {
      // ★ Advanced → 何もしない
      if (assist === "advanced") {
        return;
      }
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const value = cell.textContent;

      const cells = document.querySelectorAll(".cell");

      const n = Math.sqrt(fieldSize);
      const blockRowStart = Math.floor(row / n) * n;
      const blockColStart = Math.floor(col / n) * n;

      cells.forEach(c => {
        const r = Number(c.dataset.row);
        const co = Number(c.dataset.col);

        const sameRow = (r === row);
        const sameCol = (co === col);
        const sameBlock =
          r >= blockRowStart && r < blockRowStart + n &&
          co >= blockColStart && co < blockColStart + n;

        const hasMemo = (c.dataset.memo ?? "") !== "";

        if ((sameRow || sameCol || sameBlock) &&
          !c.classList.contains("fixed") &&
          !c.classList.contains("locked") &&
          !hasMemo)
        {
          c.classList.add("focus-line");
        }
      });
      cell.classList.add("focus-line");

      // ★ 数字がある場合 → 同じ数字を濃いグレー（Intermediate）
      if (value !== "") {
        cells.forEach(c => {
          if (c.textContent === value) {
            c.classList.add("focus-number");
          }
        });

        this.revealMemoNumber(value); // ★ [6] 同じ数字のメモを一時表示
      }

      // ★ Beginner → 同じ数字の「行・列」もハイライト
      if (assist === "beginner" && value !== "") {
        cells.forEach(c => {
          if (c.textContent === value) {
            const r = Number(c.dataset.row);
            const co = Number(c.dataset.col);

            cells.forEach(target => {
              const tr = Number(target.dataset.row);
              const tc = Number(target.dataset.col);

              const sameRow = (tr === r);
              const sameCol = (tc === co);

              const hasMemo = (target.dataset.memo ?? "") !== "";

              if ((sameRow || sameCol) &&
                  !target.classList.contains("fixed") &&
                  !target.classList.contains("locked") &&
                  !hasMemo)
              {
                target.classList.add("focus-line");
              }
            });
          }
        });
      }
    },
    clearFocus: function() {
      document.querySelectorAll(".cell").forEach(c => {
        c.classList.remove("focus-line");
        c.classList.remove("focus-number");

        // ★ [6] 一時表示していたメモ数字を元に戻す
        if (c.classList.contains("memo-preview")) {
          c.textContent = "";
          c.style.color = "";
          c.classList.remove("memo-preview");
        }
      });
    },
    // -----------------------------
    // メモ用数字生成
    // -----------------------------
    makeMemoNumbers: function () {
      const box = document.getElementById("memoNumbers");
      const n = Math.sqrt(fieldSize);

      const btnPx = this.calcButtonSize(fieldSize);
      box.style.setProperty("--btn-size", `${btnPx}px`);
      box.style.gridTemplateColumns = `repeat(${n}, var(--btn-size))`;
      box.style.gridTemplateRows = `repeat(${n}, var(--btn-size))`;

      for (let i = 1; i <= fieldSize; i++) {
        const btn = document.createElement("div");
        btn.className = "memoBtn";
        btn.textContent = i;
        btn.addEventListener("click", () => {
          this.handleMemoNumber(i);
        });
        box.appendChild(btn);
      }
      return this;
    },
    handleMemoNumber: function (n) {
      if (!selectedCell) return;
      if (gameEnded) return;
      if (completedNumbers.has(n)) return;

      if (selectedCell.classList.contains("fixed") ||
          selectedCell.classList.contains("locked")) {
            return;
      }
      if (selectedCell.textContent !== "") {
        return;
      }
      if (this.isNumberBlocked(selectedCell, n)) return;

      let memos = selectedCell.dataset.memo
        ? selectedCell.dataset.memo.split(",").map(Number)
        : [];

        if (memos.includes(n)) {
          memos = memos.filter(x => x !== n);
        }
        else
        {
          memos.push(n);
        }

        selectedCell.dataset.memo = memos.join(",");
        selectedCell.style.backgroundColor = memos.length > 0
          ? this.colorForFieldSize(fieldSize)
          : "";
        selectedCell.style.fontWeight = "";
        this.updateMemoButtons();
        this.clearFocus();
      },
      calcButtonSize: function (fieldSize) {
        if (fieldSize <= 4)  return 110;
        if (fieldSize <= 9)  return 80;
        if (fieldSize <= 16) return 64;
        if (fieldSize <= 25) return 54;
        if (fieldSize <= 36) return 48;
        if (fieldSize <= 49) return 44;
        if (fieldSize <= 64) return 40;
        if (fieldSize <= 81) return 36;
        return 34;
      },
      // -----------------------------
      // Delete
      // -----------------------------
      bindDelete: function () {
        document.getElementById("btnDelete").addEventListener("click", () => {
          if (!selectedCell) return;
          if (gameEnded) return;

          if (selectedCell.classList.contains("fixed") ||
              selectedCell.classList.contains("locked")) {
                return;
          }

          selectedCell.style.color = "#000";
          selectedCell.textContent = "";

          selectedCell.dataset.memo = "";
          selectedCell.style.backgroundColor = "";
          selectedCell.style.fontWeight = "";
          this.updateMemoButtons();
        });
        return this;
      },
      // -----------------------------
      // 終了判定
      // -----------------------------
      checkClear: function () {
        const cells = document.querySelectorAll(".cell");

        for (let c of cells) {
          const r = Number(c.dataset.row);
          const col = Number(c.dataset.col);

          if (c.textContent === "") return false;

          if (Number(c.textContent) !== this.solution[r][col]) return false;
        }
        return true;
      },
      checkGameOver: function () {
        if (missLimit !== "Infinity" && missCount >= Number(missLimit)) {
          this.endGame("Fail");
        }
      },
      endGame: function (result) {
        clearInterval(timerId);
        this.disableInputButtons();
        window.location.href = `../ShowResult/ShowResult.html?result=${result}&time=${timer}`;
      },
    };
    const active = () => {
    func.init();
  };
  return { active };
})();

window.addEventListener("load", () => {
  PlayGame.active();
});