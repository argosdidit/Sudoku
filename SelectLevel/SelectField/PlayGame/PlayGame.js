const PlayGame = (() => {
  'use strict';

  let level, assist, missLimit, fieldSize;
  let timer = 0;
  let timerId = null;
  let missCount = 0;
  let selectedCell = null;

  const func = {
    init: function () {
      this.loadParams();
      this.showHeaderInfo();
      this.startTimer();
      this.makePuzzle();
      this.makeSelectNumbers();
      this.makeMemoNumbers();
      this.bindDelete();
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
      document.querySelectorAll(".cell").forEach(c => c.classList.remove("selected"));
      cell.classList.add("selected");
    },
    // -----------------------------
    // 選択用数字生成
    // -----------------------------
    makeSelectNumbers: function () {
      const box = document.getElementById("selectNumbers");
      const n = Math.sqrt(fieldSize); // 例: 16 → 4
      // 
      // ★ 追加：桁数を考慮したボタンサイズを計算し、CSS変数に反映
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
      // ★ ロックされているセルは変更禁止

      if (selectedCell.classList.contains("fixed") ||
          selectedCell.classList.contains("locked")) {
            return;
      }
      // ★ メモが入っていたら消す
      selectedCell.style.color = "#000";
      selectedCell.textContent = "";
      // ★ ここに追加（memoリセット）
      selectedCell.dataset.memo = "";
      selectedCell.style.backgroundColor = "";
      this.updateMemoButtons(); // ★ ボタン側もリセット

      const row = Number(selectedCell.dataset.row);
      const col = Number(selectedCell.dataset.col);
      
      // ★ 正誤判定
      const isCorrect = (n === this.solution[row][col]);
      
      if (isCorrect) {
        // ★ 正しい → 青色
        selectedCell.textContent = n;
        switch(fieldSize)
        {
          case 4:
            selectedCell.style.color = "#f6c400";
            break;
          case 9:
            selectedCell.style.color = "#4cff38";
            break;
          case 16:
            selectedCell.style.color = "#0cf4d1";
            break;
          case 25:
            selectedCell.style.color = "#1f9aff";
            break;
          case 36:
            selectedCell.style.color = "#5825f3";
            break;
          case 49:
            selectedCell.style.color = "#d61feb";
            break;
          case 64:
            selectedCell.style.color = "#f9147f";
            break;
          case 81:
            selectedCell.style.color = "#fe5319";
            break;
          case 100:
            selectedCell.style.color = "#ff0b0b";
            break;
        }
        selectedCell.style.fontWeight = "bold";
        selectedCell.classList.add("locked");
      }
      else
      {
        // ★ 間違い → 赤色
        selectedCell.textContent = n;
        selectedCell.style.color = "#FFF";
        selectedCell.style.backgroundColor = "#000";
        selectedCell.style.fontWeight = "bold";
        
        missCount++;
        document.getElementById("txtMiss").textContent =
          `Miss: ${missCount}/${missLimit}`;
        this.checkGameOver();
        return; // 間違いならここで終了
      }
      // ★ ここでクリア判定
      if (this.checkClear()) {
        clearInterval(timerId);
        alert("🎉 Clear! おめでとうございます！");
        this.endGame("Clear");
      }
    },
    makePuzzle: function () {
      const n = Math.sqrt(fieldSize); // 例: 9 → 3
      const solution = this.generateSolution(n);
      const puzzle = this.generatePuzzle(solution, level);
      
      const puzzleArea = document.getElementById("areaPuzzle");
      
      // ★ 追加：fieldSize に応じてセルサイズ(px)を決定
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
          
          // ★ ブロック境界（太枠）
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
              this.clearAssist();
              this.highlightSelectedCell(cell);
              this.applyAssist(cell);
            });
          }
          puzzleArea.appendChild(cell);
        }
      }
      this.solution = solution;
      this.puzzle = puzzle;
      return this;
    },
    // ★ 新規追加：fieldSize に応じた1セルあたりの px サイズを返す
    calcCellSize: function (fieldSize) {
      // 小さい盤面は大きく、大きい盤面は最低限の可読サイズを確保
      if (fieldSize <= 4)  return 90;
      if (fieldSize <= 9)  return 60;
      if (fieldSize <= 16) return 48;
      if (fieldSize <= 25) return 40;
      if (fieldSize <= 36) return 34;
      if (fieldSize <= 49) return 30;
      if (fieldSize <= 64) return 27;
      if (fieldSize <= 81) return 25;
      return 22; // 100×100 など
    },
    updateMemoButtons: function() {
      const memos = selectedCell.dataset.memo
      ? selectedCell.dataset.memo.split(",").map(Number)
      : [];
      
      document.querySelectorAll(".memoBtn").forEach(btn => {
        const num = Number(btn.textContent);
        switch(fieldSize)
        {
          case 4:
            btn.style.backgroundColor = memos.includes(num) ? "#f6c400" : "";
            break;
          case 9:
            btn.style.backgroundColor = memos.includes(num) ? "#4cff38" : "";
            break;
          case 16:
            btn.style.backgroundColor = memos.includes(num) ? "#0cf4d1" : "";
            break;
          case 25:
            btn.style.backgroundColor = memos.includes(num) ? "#1f9aff" : "";
            break;
          case 36:
            btn.style.backgroundColor = memos.includes(num) ? "#5825f3" : "";
            break;
          case 49:
            btn.style.backgroundColor = memos.includes(num) ? "#d61feb" : "";
            break;
          case 64:
            btn.style.backgroundColor = memos.includes(num) ? "#f9147f" : "";
            break;
          case 81:
            btn.style.backgroundColor = memos.includes(num) ? "#fe5319" : "";
            break;
          case 100:
            btn.style.backgroundColor = memos.includes(num) ? "#ff0b0b" : "";
            break;
        }
      });
    },
    // n×n ブロック → n^2 × n^2 の盤面
    generateSolution: function(n) {
      const size = n * n;
      const board = Array.from({ length: size }, () => Array(size).fill(0));
      
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          board[r][c] = (r * n + Math.floor(r / n) + c) % size + 1;
        }
      }
      return this.shuffleSolution(board); // ★ 追加
    },
    shuffleSolution: function(board) {
      const size = board.length;
      const n = Math.sqrt(size);
      
      // ★ 数字の入れ替え
      const nums = [...Array(size).keys()].map(x => x + 1);
      nums.sort(() => Math.random() - 0.5);
      
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          board[r][c] = nums[board[r][c] - 1];
        }
      }
      
      // ★ 行の入れ替え（ブロック内）
      for (let block = 0; block < n; block++) {
        const start = block * n;
        const rows = [...Array(n).keys()].map(x => start + x);
        rows.sort(() => Math.random() - 0.5);
        
        const newRows = rows.map(i => board[i]);
        for (let i = 0; i < n; i++) {
          board[start + i] = newRows[i];
        }
      }
      
      // ★ 列の入れ替え（ブロック内）
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
      
      // 全セルの index を作る
      const indices = Array.from({ length: totalCells }, (_, i) => i);
      
      // ランダムシャッフル
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      
      // filledCount だけ残す → 残りは空欄
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
        return Math.ceil(raw);   // Hard → 繰り上げ
      }
      if (rate === 0.8) {
        return Math.floor(raw);  // Easy → 繰り下げ
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
      
      // ★ Intermediate（現状の仕様）
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
      // フォーカスセル自身は強調
      cell.classList.add("focus-line");
      
      // ★ 数字がある場合 → 同じ数字を濃いグレー（Intermediate）
      if (value !== "") {
        cells.forEach(c => {
          if (c.textContent === value) {
            c.classList.add("focus-number");
          }
        });
      }
      
      // ★ Beginner → 同じ数字の「行・列」もハイライト
      if (assist === "beginner" && value !== "") {
        cells.forEach(c => {
          if (c.textContent === value) {
            const r = Number(c.dataset.row);
            const co = Number(c.dataset.col);
            
            // 同じ数字の行・列をハイライト
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
      });
    },
    // -----------------------------
    // メモ用数字生成
    // -----------------------------
    makeMemoNumbers: function () {
      const box = document.getElementById("memoNumbers");
      const n = Math.sqrt(fieldSize);
      
      // ★ 追加：Selectと同じ基準でサイズを揃える
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
      
      if (selectedCell.classList.contains("fixed") ||
          selectedCell.classList.contains("locked")) {
            return;
      }
      if (selectedCell.textContent !== "") {
        return;
      }
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
        switch(fieldSize)
        {
          case 4:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#f6c400" : "";
            break;
          case 9:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#4cff38" : "";
            break;
          case 16:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#0cf4d1" : "";
            break;
          case 25:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#1f9aff" : "";
            break;
          case 36:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#5825f3" : "";
            break;
          case 49:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#d61feb" : "";
            break;
          case 64:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#f9147f" : "";
            break;
          case 81:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#fe5319" : "";
            break;
          case 100:
            selectedCell.style.backgroundColor = memos.length > 0 ? "#ff0b0b" : "";
            break;
        }
        this.updateMemoButtons(); // ★ 追加：ボタン色を同期
        // ★ 最重要：フォーカスを消す（applyFocus に上書きさせない）
        this.clearFocus();
      },
      // ★ 新規追加：Select/Memoボタンの1辺サイズ(px)。
      // パズルのセルより一回り大きめに確保（3桁数字の可読性のため）
      calcButtonSize: function (fieldSize) {
        if (fieldSize <= 4)  return 110;
        if (fieldSize <= 9)  return 80;
        if (fieldSize <= 16) return 64;
        if (fieldSize <= 25) return 54;
        if (fieldSize <= 36) return 48;
        if (fieldSize <= 49) return 44;
        if (fieldSize <= 64) return 40;
        if (fieldSize <= 81) return 36;
        return 34; // 100 (3桁の "100" まで考慮)
      },
      // -----------------------------
      // Delete
      // -----------------------------
      bindDelete: function () {
        document.getElementById("btnDelete").addEventListener("click", () => {
          if (!selectedCell) return;
          
          // ★ ロックされているセルは削除禁止
          if (selectedCell.classList.contains("fixed") ||
              selectedCell.classList.contains("locked")) {
                return;
          }
          
          // ★ メモが入っていたら消す
          selectedCell.style.color = "#000";
          selectedCell.textContent = "";
          
          // ★ ここに追加（memoリセット）
          selectedCell.dataset.memo = "";
          selectedCell.style.backgroundColor = "";
          this.updateMemoButtons(); // ★ ボタン側もリセット
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
          
          // 空欄はクリアではない
          if (c.textContent === "") return false;
          
          // 正解でない場合もクリアではない
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
        
        // ★ 結果保存は後で実装
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
