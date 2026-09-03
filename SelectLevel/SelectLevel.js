const SudokuLevel = (() => {
  'use strict';

  let func;

  const levelData = [
    { label: "Easy (60%)", value: "easy" },
    { label: "Hard (45%)", value: "hard" },
  ];

  const assistData = [
    { label: "Beginner", value: "beginner" },
    { label: "Intermediate", value: "intermediate" },
    { label: "Advanced", value: "advanced" },
  ];

  const missData = [
    { label: "無制限", value: Infinity },
    { label: "5回", value: 5 },
    { label: "3回", value: 3 },
    { label: "1回", value: 1 },
  ];

  func = {
    init: function () {
      return this;
    },

    makeHeaderField: function () {
      const header = document.querySelector("[areaHeader]");
      header.insertAdjacentHTML("beforeend", `<h1>Sudoku の設定を選択してください</h1>`);
      return this;
    },

    makeRadioGroup: function (title, boxId, name, dataList) {
      const box = document.getElementById(boxId);
      const titleEl = document.createElement("h2");
      titleEl.textContent = title;
      box.appendChild(titleEl);
      
      const group = document.createElement("div");
      group.className = "radio-group";
      box.appendChild(group);
      
      dataList.forEach(item => {
        const wrapper = document.createElement("div");
        wrapper.className = "radio-item";
        
        const input = document.createElement("input");
        input.type = "radio";
        input.name = name;
        input.value = item.value;
        
        const label = document.createElement("label");
        label.textContent = item.label;
        
        // ★ ラジオボタンが変わった時
        input.addEventListener("change", () => {
          group.querySelectorAll(".radio-item").forEach(el => {
            el.classList.remove("selected");
          });
          wrapper.classList.add("selected");
        });
        
        // ★ カード全体をクリックしたらラジオボタンを選択する
        wrapper.addEventListener("click", () => {
          input.checked = true;
          input.dispatchEvent(new Event("change"));
        });
        
        wrapper.appendChild(input);
        wrapper.appendChild(label);
        group.appendChild(wrapper);
      });
      return this;
    },
    initRadioButton: function () {
      const firstLevel = document.querySelector("#levelBox input[type=radio]");
      if (firstLevel) {
        firstLevel.checked = true;
        firstLevel.dispatchEvent(new Event("change"));
      }

      const firstAssist = document.querySelector("#assistBox input[type=radio]");
      if (firstAssist) {
        firstAssist.checked = true;
        firstAssist.dispatchEvent(new Event("change"));
      }

      const firstMiss = document.querySelector("#missBox input[type=radio]");
      if (firstMiss) {
        firstMiss.checked = true;
        firstMiss.dispatchEvent(new Event("change"));
      }

      return this;
    },

    makeBtnNext: function () {
      const btn = document.createElement("button");
      btn.textContent = "次へ";

      btn.addEventListener("click", () => {
        const level = this.getRadioValue("level");
        const assist = this.getRadioValue("assist");
        const miss = this.getRadioValue("miss");

        if (!level || !assist || miss === null) {
          alert("すべて選択してください");
          return;
        }

        window.location.href =
          `SelectField/SelectField.html?level=${level}&assist=${assist}&miss=${miss}`;
      });

      document.getElementById("btnNext").appendChild(btn);
      return this;
    },

    getRadioValue: function (name) {
      const selected = document.querySelector(`input[name="${name}"]:checked`);
      return selected ? selected.value : null;
    },
  };

  const active = () => {
    func
      .init()
      .makeHeaderField()
      .makeRadioGroup("Level", "levelBox", "level", levelData)
      .makeRadioGroup("Assist", "assistBox", "assist", assistData)
      .makeRadioGroup("Miss Count", "missBox", "miss", missData)
      .initRadioButton()
      .makeBtnNext();
  };

  return { active };
})();

window.addEventListener("load", () => {
  SudokuLevel.active();
});
