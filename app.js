let db;
const request = indexedDB.open("QuceDB", 1);

request.onupgradeneeded = e => {
  db = e.target.result;
  db.createObjectStore("scores", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = e => {
  db = e.target.result;
  displayScores();
};

const addBtn = document.getElementById("addBtn");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const searchInput = document.getElementById("search");
const exportBtn = document.getElementById("exportCsv");

addBtn.onclick = () => modal.classList.remove("hidden");
cancelBtn.onclick = () => modal.classList.add("hidden");

saveBtn.onclick = () => {
  const title = document.getElementById("title").value.trim();
  const mode = document.getElementById("mode").value.trim();
  const style = document.getElementById("style").value.trim();
  const school = document.getElementById("school").value.trim();
  const note = document.getElementById("note").value.trim();
  const file = document.getElementById("imageInput").files[0];

  if (!title) { alert("請輸入曲牌名稱"); return; }

  const reader = new FileReader();
  reader.onload = function() {
    const imgData = reader.result;
    const tx = db.transaction("scores", "readwrite");
    tx.objectStore("scores").add({ title, mode, style, school, note, imgData });
    tx.oncomplete = () => {
      modal.classList.add("hidden");
      clearInputs();
      displayScores();
    };
  };
  if (file) reader.readAsDataURL(file);
  else reader.onload();
};

function clearInputs() {
  ["title","mode","style","school","note","imageInput"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

function displayScores(filter="") {
  const tx = db.transaction("scores", "readonly");
  const store = tx.objectStore("scores");
  const req = store.getAll();
  req.onsuccess = () => {
    const list = document.getElementById("scoreList");
    list.innerHTML = "";
    req.result
      .filter(s => s.title.includes(filter) || s.mode.includes(filter) || s.school.includes(filter))
      .forEach(s => {
        const div = document.createElement("div");
        div.className = "score-item";
        div.innerHTML = `
          <h3>${s.title}</h3>
          <p>${s.mode}｜${s.style}｜${s.school}</p>
          ${s.imgData ? <img src="${s.imgData}" alt="${s.title}"> : ""}
          <p>${s.note || ""}</p>`;
        list.appendChild(div);
      });
  };
}

searchInput.oninput = e => displayScores(e.target.value);

exportBtn.onclick = () => {
  const tx = db.transaction("scores", "readonly");
  const store = tx.objectStore("scores");
  const req = store.getAll();
  req.onsuccess = () => {
    const rows = [["曲牌","工調","板式","流派","備註"]];
    req.result.forEach(s => rows.push([s.title,s.mode,s.style,s.school,s.note]));
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "曲冊.csv";
    a.click();
  };
};