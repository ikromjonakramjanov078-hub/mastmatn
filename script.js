
"use strict";

// MAST MATN — Drunk Text Converter
// Muallif: AKRAMJONOVA JADRA MARATOVNA

const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const emptyState = document.getElementById("emptyState");
const charCount = document.getElementById("charCount");
const convertBtn = document.getElementById("convertBtn");
const copyBtn = document.getElementById("copyBtn");
const againBtn = document.getElementById("againBtn");
const clearBtn = document.getElementById("clearBtn");
const emojiToggle = document.getElementById("emojiToggle");
const feedback = document.getElementById("feedback");
const resultBadge = document.getElementById("resultBadge");
const levelButtons = document.querySelectorAll(".level");
const exampleButtons = document.querySelectorAll("[data-example]");

let currentLevel = "medium";
let lastOutput = "";
let feedbackTimeout = null;

const emojis = [
  "😂", "🤣", "🥴", "🤪", "😵",
  "🍹", "✨", "💫", "🙃", "😜",
  "🥳", "💛", "🔥", "😹", "🫠"
];

const levelSettings = {
  easy: {
    repeatChance: 0.13,
    swapChance: 0.08,
    caseChance: 0.18,
    emojiChance: 0.12,
    maxRepeat: 1,
    emojiCount: 1
  },

  medium: {
    repeatChance: 0.29,
    swapChance: 0.18,
    caseChance: 0.38,
    emojiChance: 0.28,
    maxRepeat: 3,
    emojiCount: 2
  },

  crazy: {
    repeatChance: 0.48,
    swapChance: 0.32,
    caseChance: 0.58,
    emojiChance: 0.48,
    maxRepeat: 4,
    emojiCount: 3
  }
};

// Tasodifiy son.
function randomNumber(max) {
  return Math.floor(Math.random() * max);
}

// Berilgan ehtimollik asosida hodisa sodir bo‘lishi.
function chance(probability) {
  return Math.random() < probability;
}

// Tasodifiy emoji tanlash.
function randomEmoji() {
  return emojis[randomNumber(emojis.length)];
}

// Matn ichidagi harflarni katta-kichik qilib aralashtirish.
function mixCase(character, probability) {
  if (!/\p{L}/u.test(character)) {
    return character;
  }

  if (!chance(probability)) {
    return character;
  }

  return chance(0.5)
    ? character.toLocaleUpperCase("uz-UZ")
    : character.toLocaleLowerCase("uz-UZ");
}

// Harfni bir necha marta takrorlash.
function stretchCharacter(character, settings) {
  if (!/\p{L}/u.test(character)) {
    return character;
  }

  if (!chance(settings.repeatChance)) {
    return character;
  }

  const repetitions = 1 + randomNumber(settings.maxRepeat);
  return character.repeat(repetitions + 1);
}

// So‘z ichidagi ayrim qo‘shni harflarning o‘rnini almashtirish.
function scrambleWord(word, settings) {
  const characters = Array.from(word);

  if (characters.length < 3 || !chance(settings.swapChance)) {
    return characters.join("");
  }

  // Faqat harflardan tashkil topgan so‘zlarni o‘zgartiramiz.
  if (!characters.every(character => /\p{L}/u.test(character))) {
    return characters.join("");
  }

  const index = randomNumber(characters.length - 1);

  [characters[index], characters[index + 1]] = [
    characters[index + 1],
    characters[index]
  ];

  return characters.join("");
}

// Bitta so‘zni o‘zgartirish.
function transformWord(word, settings) {
  if (!word || !word.trim()) {
    return word;
  }

  // Tinish belgilarini so‘zdan ajratib olamiz.
  const match = word.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}]+)([^\p{L}\p{N}]*)$/u);

  if (!match) {
    return word;
  }

  const prefix = match[1];
  let core = match[2];
  const suffix = match[3];

  // Raqamlarni o‘zgartirmaymiz.
  if (!/\p{L}/u.test(core)) {
    return word;
  }

  core = scrambleWord(core, settings);

  const characters = Array.from(core);
  let result = "";

  for (const character of characters) {
    const mixed = mixCase(character, settings.caseChance);
    result += stretchCharacter(mixed, settings);
  }

  // Ba’zan so‘z oxiridagi unli harfni yana cho‘zish.
  if (
    result.length > 1 &&
    chance(settings.repeatChance) &&
    /\p{L}/u.test(result)
  ) {
    const lastCharacter = Array.from(result).pop();

    if (/[aeiouo‘aouAEIOUO‘]/iu.test(lastCharacter)) {
      result += lastCharacter.repeat(1 + randomNumber(settings.maxRepeat));
    }
  }

  return prefix + result + suffix;
}

// Matnni umumiy o‘zgartirish.
function convertText(text) {
  const settings = levelSettings[currentLevel];

  if (!text.trim()) {
    showFeedback("Avval matn yoz! ✍️", true);
    inputText.focus();
    return "";
  }

  // Bo‘shliqlar va yangi satrlarni saqlab qolamiz.
  const parts = text.split(/(\s+)/u);

  let converted = parts.map(part => {
    if (/^\s+$/u.test(part)) {
      return part;
    }

    let result = transformWord(part, settings);

    // Ayrim so‘zlar orasiga tasodifiy emoji qo‘shish.
    if (emojiToggle.checked && chance(settings.emojiChance)) {
      result += " " + randomEmoji();
    }

    return result;
  }).join("");

  // Matn oxiriga ba'zan emoji qo‘shamiz.
  if (emojiToggle.checked && chance(0.65)) {
    converted += " " + randomEmoji();
  }

  // Maksimal rejimda ba'zan qo‘shimcha emoji.
  if (
    emojiToggle.checked &&
    currentLevel === "crazy" &&
    chance(0.65)
  ) {
    converted += " " + randomEmoji();
  }

  return converted;
}

// Natijani ko‘rsatish.
function renderResult(text) {
  lastOutput = text;
  outputText.textContent = text;
  emptyState.style.display = text ? "none" : "flex";

  copyBtn.disabled = !text;
  againBtn.disabled = !inputText.value.trim();

  resultBadge.textContent = text ? "TAYYOR ✓" : "KUTILMOQDA";

  outputText.classList.remove("pop");

  if (text) {
    void outputText.offsetWidth;
    outputText.classList.add("pop");
  }
}

// Xabar ko‘rsatish.
function showFeedback(text, isError = false) {
  clearTimeout(feedbackTimeout);

  feedback.textContent = text;
  feedback.style.color = isError ? "#ff8b65" : "#ffd21f";

  feedbackTimeout = setTimeout(() => {
    feedback.textContent = "";
  }, 3000);
}

// Belgilar hisoblagichi.
function updateCharacterCount() {
  charCount.textContent = `${inputText.value.length} / 3000 belgi`;

  if (inputText.value.length >= 2800) {
    charCount.style.color = "#ffd21f";
  } else {
    charCount.style.color = "";
  }

  againBtn.disabled = !inputText.value.trim();
}

inputText.addEventListener("input", updateCharacterCount);

// Darajani tanlash.
levelButtons.forEach(button => {
  button.addEventListener("click", () => {
    currentLevel = button.dataset.level;

    levelButtons.forEach(item => {
      const selected = item === button;

      item.classList.toggle("selected", selected);
      item.setAttribute("aria-pressed", String(selected));
    });

    const names = {
      easy: "Yengil daraja tanlandi 🥂",
      medium: "O‘rtacha daraja tanlandi 🍹",
      crazy: "Maksimal jinnilik yoqildi 🤪"
    };

    showFeedback(names[currentLevel]);
  });

  button.setAttribute(
    "aria-pressed",
    String(button.dataset.level === currentLevel)
  );
});

// Asosiy o‘zgartirish tugmasi.
convertBtn.addEventListener("click", () => {
  const result = convertText(inputText.value);

  if (result) {
    renderResult(result);
    showFeedback("Matning tayyor! Qani, kulgini boshlaymiz! 😂");
  }
});

// Qayta o‘zgartirish — har safar yangi tasodifiy natija.
againBtn.addEventListener("click", () => {
  if (!inputText.value.trim()) {
    showFeedback("Avval matn yoz! ✍️", true);
    return;
  }

  const result = convertText(inputText.value);

  if (result) {
    renderResult(result);
    showFeedback("Yangi variant tayyor! 🤪");
  }
});

// Natijani nusxalash.
async function copyResult() {
  if (!lastOutput) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(lastOutput);
    } else {
      // Faylni to‘g‘ridan-to‘g‘ri ochganda zaxira usuli.
      const temporary = document.createElement("textarea");
      temporary.value = lastOutput;
      temporary.setAttribute("readonly", "");
      temporary.style.position = "fixed";
      temporary.style.left = "-9999px";

      document.body.appendChild(temporary);
      temporary.select();

      const copied = document.execCommand("copy");
      temporary.remove();

      if (!copied) {
        throw new Error("Nusxalash amalga oshmadi");
      }
    }

    showFeedback("Nusxalandi! Endi do‘stlaringga yubor! 📋");
  } catch (error) {
    showFeedback(
      "Nusxalash ishlamadi. Natijani belgilab, Ctrl+C bos.",
      true
    );
  }
}

copyBtn.addEventListener("click", copyResult);

// Tozalash.
clearBtn.addEventListener("click", () => {
  inputText.value = "";
  renderResult("");
  updateCharacterCount();
  showFeedback("Hammasi tozalandi! ✨");
  inputText.focus();
});

// Namuna matnlarni tanlash.
exampleButtons.forEach(button => {
  button.addEventListener("click", () => {
    inputText.value = button.dataset.example;
    updateCharacterCount();

    showFeedback("Namuna joylandi! Endi matnni o‘zgartir! 🍹");
    inputText.focus();
  });
});

// Boshlang‘ich holat.
renderResult("");
updateCharacterCount();
