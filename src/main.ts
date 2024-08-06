import "./style.css";
import { treeShakeVueSFC } from "../lib";
import vue_sfc from "./test/vue_sfc.vue?raw";

const fileInput = document.getElementById("selectFile")! as HTMLInputElement;
const outputDiv = document.getElementById("rawCode")!;
const resultCode = document.getElementById("resultCode")!;

fileInput.addEventListener("change", function () {
  if (fileInput.files) {
    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      const contents = e.target!.result as string;
      outputDiv.textContent = contents;

      const { code } = treeShakeVueSFC(contents);
      resultCode.textContent = code;
    };

    reader.readAsText(file);
  }
});

outputDiv.textContent = vue_sfc;
const { code } = treeShakeVueSFC(vue_sfc);
resultCode.textContent = code;
