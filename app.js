const copy = {
  en: {
    status: (remaining) => `${remaining} OPENING${remaining === 1 ? "" : "S"} LEFT TODAY`,
    eyebrow: "A PORTAL FOR THE CURIOUS",
    headlineTop: "Step through.",
    headlineEm: "See what unfolds.",
    intro: "One small door. An unexpected idea on the other side.",
    tapHint: "TAP TO OPEN",
    discover: "DISCOVER ANOTHER",
    types: { task: "TODAY'S DOOR", thought: "DEEP THOUGHT", phenomenon: "COSMIC NOTE" },
    prompts: { task: "A SMALL ACTION CAN SHIFT A DAY", thought: "A QUESTION WORTH CARRYING", phenomenon: "THE UNIVERSE IS STRANGER THAN IT LOOKS" },
    locked: "TODAY'S THREE DOORS ARE OPEN. COME BACK AFTER MIDNIGHT.",
    lockedButton: "BACK AFTER MIDNIGHT",
    ariaOpen: "Open The Door",
    footerCount: "75 WAYS IN"
  },
  hi: {
    status: (remaining) => `आज ${remaining} बार और खोल सकते हैं`,
    eyebrow: "जिज्ञासु मन के लिए एक पोर्टल",
    headlineTop: "अंदर आइए।",
    headlineEm: "देखिए क्या खुलता है।",
    intro: "एक छोटा-सा दरवाज़ा। दूसरी ओर एक अप्रत्याशित विचार।",
    tapHint: "खोलने के लिए टैप करें",
    discover: "एक और खोजें",
    types: { task: "आज का दरवाज़ा", thought: "गहरा विचार", phenomenon: "ब्रह्मांड की बात" },
    prompts: { task: "एक छोटा कदम पूरा दिन बदल सकता है", thought: "एक सवाल जिसे साथ रखना चाहिए", phenomenon: "ब्रह्मांड जितना दिखता है, उससे कहीं अजीब है" },
    locked: "आज के तीनों दरवाज़े खुल चुके हैं। आधी रात के बाद फिर आइए।",
    lockedButton: "आधी रात के बाद मिलते हैं",
    ariaOpen: "दरवाज़ा खोलें",
    footerCount: "75 रास्ते"
  }
};

const DAILY_LIMIT = 3;
const cards = window.doorCards;
const state = {
  language: "en",
  current: null,
  previousIndex: -1,
  dailyOpens: 0,
  isOpen: false,
  isLocked: false
};

const doorButton = document.querySelector("#doorButton");
const discoverButton = document.querySelector("#discoverButton");
const revealWrap = document.querySelector("#revealWrap");
const cardType = document.querySelector("#cardType");
const cardCount = document.querySelector("#cardCount");
const cardText = document.querySelector("#cardText");
const cardPrompt = document.querySelector("#cardPrompt");
const statusLabel = document.querySelector("#statusLabel");
const tapHint = document.querySelector("#tapHint");
const lockMessage = document.querySelector("#lockMessage");
const footerCount = document.querySelector("#footerCount");

function dayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function readUsage() {
  try {
    const saved = JSON.parse(localStorage.getItem("the-door-usage") || "null");
    if (saved && saved.day === dayKey()) return saved.opens || 0;
  } catch (error) {
    // Private browsing or blocked storage should not stop the experience.
  }
  return 0;
}

function saveUsage() {
  try {
    localStorage.setItem("the-door-usage", JSON.stringify({ day: dayKey(), opens: state.dailyOpens }));
  } catch (error) {
    // The session still works when persistent storage is unavailable.
  }
}

function scheduleMidnightReset() {
  const next = new Date();
  next.setHours(24, 0, 2, 0);
  window.setTimeout(() => window.location.reload(), Math.max(1000, next.getTime() - Date.now()));
}

function chooseCard() {
  let index;
  do {
    index = Math.floor(Math.random() * cards.length);
  } while (cards.length > 1 && index === state.previousIndex);
  state.previousIndex = index;
  state.current = cards[index];
}

function updateStatus() {
  const lang = copy[state.language];
  const remaining = Math.max(0, DAILY_LIMIT - state.dailyOpens);
  statusLabel.textContent = lang.status(remaining);
  footerCount.textContent = lang.footerCount;
  cardCount.textContent = `${state.dailyOpens} / ${DAILY_LIMIT} TODAY`;
}

function renderCard() {
  const item = state.current;
  const lang = copy[state.language];
  cardType.textContent = lang.types[item.type];
  cardText.textContent = item[state.language];
  cardPrompt.textContent = lang.prompts[item.type];
  updateStatus();
}

function setLockedUI() {
  const lang = copy[state.language];
  state.isLocked = state.dailyOpens >= DAILY_LIMIT;
  doorButton.classList.toggle("is-locked", state.isLocked);
  doorButton.disabled = state.isLocked;
  discoverButton.disabled = state.isLocked;
  lockMessage.hidden = !state.isLocked;
  lockMessage.textContent = lang.locked;
  tapHint.hidden = state.isLocked;
  if (state.isLocked) {
    doorButton.setAttribute("aria-label", lang.lockedButton);
    discoverButton.querySelector("[data-i18n='discover']").textContent = lang.lockedButton;
  } else {
    doorButton.setAttribute("aria-label", state.isOpen ? lang.discover : lang.ariaOpen);
    discoverButton.querySelector("[data-i18n='discover']").textContent = lang.discover;
  }
  updateStatus();
}

function openDoor() {
  if (state.isOpen || state.isLocked || state.dailyOpens >= DAILY_LIMIT) {
    setLockedUI();
    return;
  }
  state.isOpen = true;
  state.dailyOpens += 1;
  saveUsage();
  chooseCard();
  renderCard();
  doorButton.classList.add("is-opening");
  doorButton.setAttribute("aria-label", copy[state.language].discover);
  window.setTimeout(() => revealWrap.classList.add("is-visible"), 520);
  window.setTimeout(() => setLockedUI(), 850);
}

function discoverAnother() {
  if (state.isLocked || state.dailyOpens >= DAILY_LIMIT) {
    setLockedUI();
    return;
  }
  revealWrap.classList.remove("is-visible");
  doorButton.classList.remove("is-opening");
  state.isOpen = false;
  window.setTimeout(openDoor, 460);
}

function setLanguage(language) {
  state.language = language;
  document.documentElement.lang = language === "hi" ? "hi" : "en";
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (copy[language][key] && typeof copy[language][key] === "string") node.textContent = copy[language][key];
  });
  document.querySelectorAll(".language-button").forEach((button) => {
    const active = button.dataset.language === language;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updateStatus();
  setLockedUI();
  if (state.current) renderCard();
}

doorButton.addEventListener("click", openDoor);
discoverButton.addEventListener("click", discoverAnother);
document.querySelectorAll(".language-button").forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

state.dailyOpens = readUsage();
setLanguage("en");
scheduleMidnightReset();