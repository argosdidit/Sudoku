const SelectField = (() => {
  'use strict';

  let selectedField = null;

  const fieldData = [
    { label: "2² = 4×4", value: 4 },
    { label: "3² = 9×9", value: 9 },
    { label: "4² = 16×16", value: 16 },
    { label: "5² = 25×25", value: 25 },
    { label: "6² = 36×36", value: 36 },
    { label: "7² = 49×49", value: 49 },
    { label: "8² = 64×64", value: 64 },
    { label: "9² = 81×81", value: 81 },
    { label: "10² = 100×100", value: 100 },
  ];

  const func = {
    init: function () {
      return this;
    },
    makeFieldButtons: function () {
      const box = document.getElementById("fieldBox");
      const group = document.createElement("div");
      group.className = "radio-group";
      box.appendChild(group);
      
      fieldData.forEach(item => {
        const wrapper = document.createElement("div");
        wrapper.className = "radio-item";
        
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "field";
        input.value = item.value;
        
        const label = document.createElement("label");
        label.textContent = item.label;
        label.className = `label-${item.value}`;
        
        // ★ ラジオボタンが変わった時
        input.addEventListener("change", () => {
          selectedField = item.value;
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
      const selectedField = document.querySelector("#fieldBox input[type=radio]");
      if (selectedField) {
        selectedField.checked = true;
        selectedField.dispatchEvent(new Event("change"));
      }
      return this;
    },
    makeBtnNext: function () {
      const btn = document.createElement("button");
      btn.textContent = "次へ";

      btn.addEventListener("click", () => {
        const params = new URLSearchParams(window.location.search);
        const level = params.get("level");
        const assist = params.get("assist");
        const miss = params.get("miss");

        if (!selectedField) {
          alert("盤面サイズを選択してください");
          return;
        }

        window.location.href =
          `PlayGame/PlayGame.html?level=${level}&assist=${assist}&miss=${miss}&field=${selectedField}`;
      });

      document.getElementById("btnNext").appendChild(btn);
      return this;
    },

    makeBtnPrev: function () {
      const btn = document.createElement("button");
      btn.textContent = "戻る";

      btn.addEventListener("click", () => {
        window.location.href = "../SelectLevel.html";
      });

      document.getElementById("btnPrev").appendChild(btn);
      return this;
    },
  };

  const active = () => {
    func
      .init()
      .makeFieldButtons()
      .initRadioButton()
      .makeBtnNext()
      .makeBtnPrev();
  };

  return { active };
})();

window.addEventListener("load", () => {
  SelectField.active();
});
