// Auth Guard
if (localStorage.getItem("isLoggedIn") !== "true") {
  window.location.href = "login";
}

// State for APIs
let marketWatchDataCache = null;
let reportsDataCache = null;

async function getMarketWatchData() {
  const cached = sessionStorage.getItem("marketWatchData");
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      marketWatchDataCache = parsed.Data || parsed || [];
      return marketWatchDataCache;
    } catch (e) {
      console.error("Error parsing cached marketwatch data", e);
    }
  }
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/marketwatch`);
    if (!response.ok) throw new Error("Failed to fetch market data");
    const data = await response.json();
    const parsedData = data.Data || data || [];
    sessionStorage.setItem("marketWatchData", JSON.stringify(parsedData));
    marketWatchDataCache = parsedData;
    return parsedData;
  } catch (e) {
    showToast("Error fetching market watch: " + e.message, "error");
    return [];
  }
}

async function getReportsData(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = sessionStorage.getItem("reportsData");
    if (cached) {
      reportsDataCache = JSON.parse(cached);
      return reportsDataCache;
    }
  }
  try {
    const userId = localStorage.getItem("user_id");
    if (!userId) return [];
    const response = await fetch(`${CONFIG.API_BASE_URL}/reports/${userId}`);
    if (!response.ok) throw new Error("Failed to fetch reports");
    const data = await response.json();
    sessionStorage.setItem("reportsData", JSON.stringify(data));
    reportsDataCache = data;
    return data;
  } catch (e) {
    showToast("Error fetching reports: " + e.message, "error");
    return [];
  }
}

// State
let marketWatchTabs = []; // Array of arrays of scrips
let activeTabIndex = -1;
let orderHistoryList = [];
let currentView = "MarketWatch"; // 'MarketWatch' or 'Reports'

// DOM Elements
const marketWatchBody = document.getElementById("marketWatchBody");
const addScriptModal = document.getElementById("addScriptModal");
const modalOverlay = document.getElementById("modalOverlay");
const searchInput = document.getElementById("scripSearchInput");
const searchResultsBody = document.getElementById("searchResultsBody");
const addSelectedScripBtn = document.getElementById("addSelectedScripBtn");

const orderModal = document.getElementById("orderModal");
const orderTypeSelect = document.getElementById("orderType");
const studentNameInput = document.getElementById("studentName");
const orderScripInput = document.getElementById("orderScrip");
const callTypeSelect = document.getElementById("callType");
const entryPriceInput = document.getElementById("entryPrice");
const target1Input = document.getElementById("target1");
const target2Input = document.getElementById("target2");
const stopLossInput = document.getElementById("stopLoss");
const productTypeSelect = document.getElementById("productType");
const orderDateInput = document.getElementById("orderDate");

const workspaceTabBar = document.getElementById("workspaceTabBar");
const marketWatchContainer = document.getElementById("marketWatchContainer");
const reportsContainer = document.getElementById("reportsContainer");
const navBlankMarketWatchBtn = document.getElementById(
  "navBlankMarketWatchBtn",
);
const navReportsBtn = document.getElementById("navReportsBtn");
const orderHistoryBody = document.getElementById("orderHistoryBody");
const navNseDropdownBtn = document.getElementById("navNseDropdownBtn");
const nseDropdownMenu = document.getElementById("nseDropdownMenu");
let indexDataCache = {};

// Current selection in Add Modal
let selectedScripToAdd = null;
let openedScripClosePrice = 0;

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `px-4 py-2 rounded shadow-lg text-white font-bold transition-all duration-300 opacity-0 translate-y-2 flex items-center gap-2 text-sm z-50`;

  if (type === "error") {
    toast.classList.add("bg-red-600");
    toast.innerHTML = `<span class="material-symbols-outlined text-sm">error</span> ${message}`;
  } else if (type === "success") {
    toast.classList.add("bg-green-600");
    toast.innerHTML = `<span class="material-symbols-outlined text-sm">check_circle</span> ${message}`;
  } else {
    toast.classList.add("bg-blue-600");
    toast.innerHTML = `<span class="material-symbols-outlined text-sm">info</span> ${message}`;
  }

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("opacity-0", "translate-y-2");
  }, 10);

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function saveMarketWatch() {
  localStorage.setItem("marketWatchTabs", JSON.stringify(marketWatchTabs));
}

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  // Clear index cache to force reload with the new INDUSTRY mapping
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith("indexData_") || key === "marketWatchData")) {
      sessionStorage.removeItem(key);
      i--; // adjust index after removal
    }
  }

  // Fetch market data on load
  await getMarketWatchData();

  // Initialize Market Watch from localStorage or default
  const savedTabs = localStorage.getItem("marketWatchTabs");
  if (savedTabs) {
    try {
      const parsed = JSON.parse(savedTabs);
      marketWatchTabs = parsed.map((tab, idx) => {
        if (Array.isArray(tab)) {
          return {
            name: `Market Watch ${idx + 1}`,
            scrips: tab,
            isIndex: false
          };
        }
        return tab;
      });
    } catch (e) {
      console.error("Error parsing saved market watch tabs", e);
      marketWatchTabs = [];
    }
    if (marketWatchTabs.length > 0) {
      activeTabIndex = 0;
      renderWorkspaceTabs();
      renderMarketWatch();
    } else {
      createNewMarketWatchTab();
    }
  } else {
    createNewMarketWatchTab();
  }

  updateNavbarActiveState();

  // Fetch live indices ticker data
  fetchLiveIndices();
  setInterval(fetchLiveIndices, 15000);

  // Logout
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user_id");
    localStorage.removeItem("full_name");
    window.location.href = "home";
  });

  // Event Listeners for Top Navbar
  navBlankMarketWatchBtn.addEventListener("click", () => {
    switchView("MarketWatch");
  });

  navReportsBtn.addEventListener("click", () => {
    switchView("Reports");
  });

  // NSE Dropdown Event Listeners
  if (navNseDropdownBtn && nseDropdownMenu) {
    navNseDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      nseDropdownMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => {
      nseDropdownMenu.classList.add("hidden");
    });

    nseDropdownMenu.querySelectorAll("a").forEach(option => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const indexName = option.getAttribute("data-index");
        openIndexTab(indexName);
        nseDropdownMenu.classList.add("hidden");
      });
    });
  }

  // Event Listeners for Settings Modal
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsBtn = document.getElementById("closeSettingsBtn");
  const profileFullName = document.getElementById("profileFullName");
  const profileUserId = document.getElementById("profileUserId");

  settingsBtn.addEventListener("click", () => {
    profileFullName.innerText = localStorage.getItem("full_name") || "Guest";
    profileUserId.innerText = localStorage.getItem("user_id") || "N/A";
    modalOverlay.classList.remove("hidden");
    settingsModal.classList.remove("hidden");
  });

  closeSettingsBtn.addEventListener("click", () => {
    modalOverlay.classList.add("hidden");
    settingsModal.classList.add("hidden");
  });

  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themeToggleIcon = document.getElementById("themeToggleIcon");
  const themeToggleText = document.getElementById("themeToggleText");

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light-mode");
      if (themeToggleIcon) themeToggleIcon.innerText = "dark_mode";
      if (themeToggleText) themeToggleText.innerText = "Dark Mode";
    } else {
      document.body.classList.remove("light-mode");
      if (themeToggleIcon) themeToggleIcon.innerText = "light_mode";
      if (themeToggleText) themeToggleText.innerText = "Light Mode";
    }
  }

  // Initial theme check (default to dark)
  const currentTheme = localStorage.getItem("theme") || "dark";
  applyTheme(currentTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
      const activeTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
      localStorage.setItem("theme", activeTheme);
      applyTheme(activeTheme);
    });
  }

  // Event Listeners for Add Script Modal
  document
    .getElementById("openAddScriptBtn")
    .addEventListener("click", openAddScriptModal);
  document
    .getElementById("closeAddScriptBtn")
    .addEventListener("click", closeAddScriptModal);
  document
    .getElementById("closeAddScriptBtn2")
    .addEventListener("click", closeAddScriptModal);

  searchInput.addEventListener("input", handleSearch);
  addSelectedScripBtn.addEventListener("click", () => {
    if (selectedScripToAdd && activeTabIndex !== -1) {
      addCompanyToWatchlist(selectedScripToAdd);
      closeAddScriptModal();
    }
  });

  // Set Order Date constraints
  const today = new Date();
  // Offset for local timezone to ensure 'today' is accurate locally
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000);
  const formattedToday = localToday.toISOString().split("T")[0];
  orderDateInput.value = formattedToday;

  const minDate = new Date(localToday);
  minDate.setDate(minDate.getDate() - 15);
  orderDateInput.min = minDate.toISOString().split("T")[0];

  // Event Listeners for Order Modal
  document
    .getElementById("closeOrderModalBtn")
    .addEventListener("click", closeOrderModal);
  document.getElementById("placeOrderBtn").addEventListener("click", () => {
    placeOrder();
  });
  document.getElementById("clearOrderBtn").addEventListener("click", () => {
    entryPriceInput.value = "";
    target1Input.value = "";
    target2Input.value = "";
    stopLossInput.value = "";
  });

  const exportBtn = document.getElementById("exportExcelBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      exportOrderHistoryToExcel();
    });
  }
});

// Workspace Tab Management
function createNewMarketWatchTab(name = null) {
  const tabName = name || `Market Watch ${marketWatchTabs.length + 1}`;
  marketWatchTabs.push({ name: tabName, scrips: [], isIndex: false });
  activeTabIndex = marketWatchTabs.length - 1;

  renderWorkspaceTabs();
  renderMarketWatch();
  saveMarketWatch();
}

function renderWorkspaceTabs() {
  workspaceTabBar.innerHTML = "";
  marketWatchTabs.forEach((tab, index) => {
    const div = document.createElement("div");
    div.className = `workspace-tab flex items-center justify-between gap-2 ${index === activeTabIndex ? "active" : ""}`;

    const span = document.createElement("span");
    span.innerText = tab.name || `Market Watch ${index + 1}`;
    span.onclick = () => {
      switchView("MarketWatch");
      activeTabIndex = index;
      renderWorkspaceTabs();
      renderMarketWatch();
    };

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.className =
      "text-gray-600 hover:text-red-600 font-bold px-1 rounded hover:bg-gray-300 leading-none text-sm";
    closeBtn.title = "Close Tab";
    closeBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent tab click from firing
      deleteMarketWatchTab(index);
    };

    div.appendChild(span);
    div.appendChild(closeBtn);
    workspaceTabBar.appendChild(div);
  });

  // Add Create New Sheet button
  const createBtn = document.createElement("div");
  createBtn.className =
    "workspace-tab flex items-center justify-center cursor-pointer font-bold ml-2 text-[#0997d7] bg-[#1a1a1a] hover:bg-[#0997d7]/10 border border-[#242424] border-b-0 rounded-t-lg transition-colors";
  createBtn.style.padding = "7px 16px";
  createBtn.innerText = "+ Create New Sheet";
  createBtn.onclick = () => {
    createNewMarketWatchTab();
  };
  workspaceTabBar.appendChild(createBtn);
}

function deleteMarketWatchTab(index) {
  marketWatchTabs.splice(index, 1);

  if (marketWatchTabs.length === 0) {
    activeTabIndex = -1;
  } else if (activeTabIndex === index) {
    // If we deleted the active tab, switch to the previous one
    activeTabIndex = Math.max(0, index - 1);
  } else if (activeTabIndex > index) {
    // If we deleted a tab before the active one, shift active index down
    activeTabIndex--;
  }

  renderWorkspaceTabs();
  renderMarketWatch();
  saveMarketWatch();
  updateNavbarActiveState();
}

function updateNavbarActiveState() {
  if (!navBlankMarketWatchBtn || !navNseDropdownBtn || !navReportsBtn) return;

  navBlankMarketWatchBtn.classList.remove("active");
  navNseDropdownBtn.classList.remove("active");
  navReportsBtn.classList.remove("active");

  if (currentView === "Reports") {
    navReportsBtn.classList.add("active");
  } else {
    const activeTab = marketWatchTabs[activeTabIndex];
    if (activeTab && activeTab.isIndex) {
      navNseDropdownBtn.classList.add("active");
    } else {
      navBlankMarketWatchBtn.classList.add("active");
    }
  }
}

function switchView(view) {
  currentView = view;
  if (view === "MarketWatch") {
    marketWatchContainer.classList.remove("hidden");
    reportsContainer.classList.add("hidden");
    workspaceTabBar.classList.remove("hidden");
  } else {
    marketWatchContainer.classList.add("hidden");
    reportsContainer.classList.remove("hidden");
    workspaceTabBar.classList.add("hidden"); // Hide market watch tabs when in reports
    renderOrderHistory();
  }
  updateNavbarActiveState();
}

function renderMarketWatch() {
  marketWatchBody.innerHTML = "";

  if (activeTabIndex === -1 || !marketWatchTabs[activeTabIndex]) return;

  const activeTab = marketWatchTabs[activeTabIndex];

  if (activeTab.isIndex) {
    const indexName = activeTab.indexName;
    const indexData = indexDataCache[indexName];
    if (!indexData) {
      marketWatchBody.innerHTML =
        '<tr><td colspan="10" class="text-center py-4">Loading Index Data...</td></tr>';
      fetchIndexData(indexName).then(() => {
        renderMarketWatch();
      });
      return;
    }

    const removed = activeTab.removedScrips || [];
    const filteredData = indexData.filter(item => !removed.includes(item.Symbol));

    filteredData.forEach((latestData) => {
      const tr = document.createElement("tr");
      const changeVal = parseFloat(latestData.Change_pct);
      const isChangePositive = !isNaN(changeVal) && changeVal >= 0;
      const changeClass = isChangePositive ? "text-profit" : "text-loss";

      const diffVal = parseFloat(latestData.Diff);
      const isDiffPositive = !isNaN(diffVal) && diffVal >= 0;
      const diffClass = isDiffPositive ? "text-profit" : "text-loss";

      const bgPriceClass = isDiffPositive
        ? "bg-profit"
        : "bg-loss";

      tr.innerHTML = `
              <td class="font-bold">${latestData.Symbol}</td>
              <td>${latestData.Industry || ""}</td>
              <td class="${changeClass} text-right">${latestData.Change_pct}</td>
              <td class="${diffClass} text-right">${latestData.Diff}</td>
              <td class="${bgPriceClass} font-bold text-right px-1">${latestData.Close}</td>
              <td class="text-right">${latestData.Open}</td>
              <td class="text-right">${latestData.High}</td>
              <td class="text-right">${latestData.Low}</td>
              <td class="text-right">${latestData.Volume}</td>
              <td class="text-center py-1">
                  <div class="flex gap-1 justify-center">
                      <button class="action-btn buy" onclick="openOrderModal('${latestData.Symbol}', 'Buy', true, '${indexName}')">L</button>
                      <button class="action-btn sell" onclick="openOrderModal('${latestData.Symbol}', 'Sell', true, '${indexName}')">S</button>
                      <button class="action-btn delete" onclick="deleteScripFromWatchlist('${latestData.Symbol}')" title="Remove Scrip">X</button>
                  </div>
              </td>
          `;
      marketWatchBody.appendChild(tr);
    });
    return;
  }

  if (!marketWatchDataCache || marketWatchDataCache.length === 0) {
    marketWatchBody.innerHTML =
      '<tr><td colspan="10" class="text-center py-4">Loading Market Data...</td></tr>';
    return;
  }

  if (!activeTab.scrips) {
    activeTab.scrips = [];
  }

  activeTab.scrips.forEach((savedScrip, index) => {
    const scripSymbol = savedScrip.Symbol || savedScrip.scripCode;
    const latestData = marketWatchDataCache.find(
      (s) => s.Symbol === scripSymbol,
    );

    if (!latestData) return;

    const tr = document.createElement("tr");
    const changeVal = parseFloat(latestData.Change_pct);
    const isChangePositive = !isNaN(changeVal) && changeVal >= 0;
    const changeClass = isChangePositive ? "text-profit" : "text-loss";

    const diffVal = parseFloat(latestData.Diff);
    const isDiffPositive = !isNaN(diffVal) && diffVal >= 0;
    const diffClass = isDiffPositive ? "text-profit" : "text-loss";

    const bgPriceClass = isDiffPositive
      ? "bg-profit"
      : "bg-loss";

    tr.innerHTML = `
            <td class="font-bold">${latestData.Symbol}</td>
            <td>${latestData.Industry}</td>
            <td class="${changeClass} text-right">${latestData.Change_pct}</td>
            <td class="${diffClass} text-right">${latestData.Diff}</td>
            <td class="${bgPriceClass} font-bold text-right px-1">${latestData.Close}</td>
            <td class="text-right">${latestData.Open}</td>
            <td class="text-right">${latestData.High}</td>
            <td class="text-right">${latestData.Low}</td>
            <td class="text-right">${latestData.Volume}</td>
            <td class="text-center py-1">
                <div class="flex gap-1 justify-center">
                    <button class="action-btn buy" onclick="openOrderModal(${index}, 'Buy')">L</button>
                    <button class="action-btn sell" onclick="openOrderModal(${index}, 'Sell')">S</button>
                    <button class="action-btn delete" onclick="deleteScripFromWatchlist(${index})" title="Remove Scrip">X</button>
                </div>
            </td>
        `;
    marketWatchBody.appendChild(tr);
  });
}

function addCompanyToWatchlist(company) {
  if (activeTabIndex === -1) return;
  const activeTab = marketWatchTabs[activeTabIndex];
  if (activeTab.isIndex) {
    alert("Cannot add a scrip to a pre-made index tab.");
    return;
  }
  if (!activeTab.scrips) activeTab.scrips = [];
  const list = activeTab.scrips;
  const companySymbol = company.Symbol || company.scripCode;
  if (!list.find((s) => (s.Symbol || s.scripCode) === companySymbol)) {
    list.push(company);
    renderMarketWatch();
    saveMarketWatch();
  }
}

function deleteScripFromWatchlist(indexOrSymbol) {
  if (activeTabIndex === -1) return;
  const activeTab = marketWatchTabs[activeTabIndex];
  if (activeTab.isIndex) {
    const scripSymbol = indexOrSymbol;
    if (!activeTab.removedScrips) {
      activeTab.removedScrips = [];
    }
    if (!activeTab.removedScrips.includes(scripSymbol)) {
      activeTab.removedScrips.push(scripSymbol);
    }
    renderMarketWatch();
    saveMarketWatch();
    return;
  }
  const index = indexOrSymbol;
  if (!activeTab.scrips) activeTab.scrips = [];
  activeTab.scrips.splice(index, 1);
  renderMarketWatch();
  saveMarketWatch();
}

// Add Script Modal Logic
function openAddScriptModal() {
  if (currentView !== "MarketWatch") {
    alert("Please switch to a Market Watch tab to add a scrip.");
    return;
  }
  const activeTab = marketWatchTabs[activeTabIndex];
  if (activeTab && activeTab.isIndex) {
    alert("Cannot add a scrip to a pre-made index tab.");
    return;
  }
  modalOverlay.classList.remove("hidden");
  addScriptModal.classList.remove("hidden");
  searchInput.value = "";
  handleSearch(); // render all initially
  searchInput.focus();
}

function closeAddScriptModal() {
  modalOverlay.classList.add("hidden");
  addScriptModal.classList.add("hidden");
  selectedScripToAdd = null;
  addSelectedScripBtn.disabled = true;
}

function handleSearch() {
  const term = searchInput.value.toLowerCase();
  const results = (marketWatchDataCache || []).filter(
    (s) =>
      (s.Symbol && s.Symbol.toLowerCase().includes(term)) ||
      (s.Industry && s.Industry.toLowerCase().includes(term)),
  );

  searchResultsBody.innerHTML = "";
  selectedScripToAdd = null;
  addSelectedScripBtn.disabled = true;

  results.forEach((scrip) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="p-2 border-r border-[#262626]">NSE</td>
            <td class="p-2 font-bold">${scrip.Symbol}</td>
        `;

    tr.addEventListener("click", () => {
      Array.from(searchResultsBody.children).forEach((c) => {
        c.classList.remove("selected");
      });
      tr.classList.add("selected");
      selectedScripToAdd = scrip;
      addSelectedScripBtn.disabled = false;
    });

    searchResultsBody.appendChild(tr);
  });
}

function getClosePriceFromCaches(symbol) {
  if (!symbol) return 0;
  const symUpper = symbol.trim().toUpperCase();

  // 1. Search in marketWatchDataCache
  if (marketWatchDataCache) {
    const found = marketWatchDataCache.find(
      (s) => s.Symbol && s.Symbol.trim().toUpperCase() === symUpper
    );
    if (found && found.Close !== undefined) {
      return parseFloat(String(found.Close).replace(/[^0-9.]/g, "")) || 0;
    }
  }

  // 2. Search in indexDataCache
  for (const indexName in indexDataCache) {
    const list = indexDataCache[indexName];
    if (list) {
      const found = list.find(
        (s) => s.Symbol && s.Symbol.trim().toUpperCase() === symUpper
      );
      if (found && found.Close !== undefined) {
        return parseFloat(String(found.Close).replace(/[^0-9.]/g, "")) || 0;
      }
    }
  }
  return 0;
}

// Order Modal Logic
window.openOrderModal = function (indexOrSymbol, type, isIndex = false, indexName = null) {
  if (activeTabIndex === -1) return;
  let scripSymbol = "";

  if (isIndex) {
    scripSymbol = indexOrSymbol;
  } else {
    const index = indexOrSymbol;
    const activeTab = marketWatchTabs[activeTabIndex];
    if (!activeTab || !activeTab.scrips) return;
    const scrip = activeTab.scrips[index];
    if (!scrip) return;
    scripSymbol = scrip.Symbol || scrip.scripCode;
  }

  orderModal.classList.remove("hidden", "buy", "sell");
  orderModal.classList.add(type.toLowerCase());

  modalOverlay.classList.remove("hidden");

  // Auto-fill based on Buy/Sell
  orderTypeSelect.value = type;

  // Auto-fill Symbol
  orderScripInput.value = scripSymbol;

  // Reset/Default other fields
  studentNameInput.value = localStorage.getItem("full_name") || "";
  callTypeSelect.value = type === "Buy" ? "LONG" : "SHORT";
  const closePrice = getClosePriceFromCaches(scripSymbol);
  openedScripClosePrice = closePrice;
  entryPriceInput.value = "";
  target1Input.value = "";
  target2Input.value = "";
  stopLossInput.value = "";

  document.getElementById("orderModalExchangeInfo").innerText =
    `NSE: ${closePrice.toFixed(2)}`;
};

function closeOrderModal() {
  modalOverlay.classList.add("hidden");
  orderModal.classList.add("hidden");
}

async function placeOrder() {
  const type = orderTypeSelect.value;
  const studentName = studentNameInput.value.trim();
  const scrip = orderScripInput.value;
  const callType = callTypeSelect.value;
  const entryPrice = parseFloat(entryPriceInput.value);
  const target1 = parseFloat(target1Input.value);
  const target2 = parseFloat(target2Input.value);
  const stopLoss = parseFloat(stopLossInput.value);
  const productType = productTypeSelect.value;
  const orderDate = orderDateInput.value;

  // --- Validations ---
  if (!studentName) {
    showToast("Validation Error: Student Name is required.", "error");
    return;
  }

  if (isNaN(entryPrice) || entryPrice <= 0) {
    showToast("Validation Error: Entry Price must be greater than 0.", "error");
    return;
  }

  let closePrice = openedScripClosePrice;
  if (!closePrice || isNaN(closePrice) || closePrice <= 0) {
    closePrice = getClosePriceFromCaches(scrip);
  }

  if (!closePrice || isNaN(closePrice) || closePrice <= 0) {
    showToast("Validation Error: Current market price for this symbol is unavailable.", "error");
    return;
  }

  if (callType === "LONG") {
    const maxPrice = closePrice * 1.20;
    if (entryPrice > maxPrice) {
      showToast(
        `Validation Error: For a LONG call, Entry Price cannot be greater than 20% of Close Price (Max: ${maxPrice.toFixed(2)}).`,
        "error",
      );
      return;
    }
  } else if (callType === "SHORT") {
    const minPrice = closePrice * 0.80;
    if (entryPrice < minPrice) {
      showToast(
        `Validation Error: For a SHORT call, Entry Price cannot be lesser than 20% of Close Price (Min: ${minPrice.toFixed(2)}).`,
        "error",
      );
      return;
    }
  }

  if (!orderDate) {
    showToast("Validation Error: Please select an order date.", "error");
    return;
  }

  const selectedDate = new Date(orderDate);
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000);

  // Normalize to midnight for accurate day comparison
  localToday.setUTCHours(0, 0, 0, 0);
  selectedDate.setUTCHours(0, 0, 0, 0);

  const diffTime = localToday - selectedDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 15) {
    showToast(
      "Validation Error: Order date cannot be older than 15 days from today.",
      "error",
    );
    return;
  }
  if (diffDays < 0) {
    showToast("Validation Error: Order date cannot be in the future.", "error");
    return;
  }

  if (isNaN(target1) || isNaN(target2) || isNaN(stopLoss)) {
    showToast(
      "Validation Error: Please enter valid numbers for Targets and Stop Loss.",
      "error",
    );
    return;
  }

  if (type === "Buy") {
    // Long call
    if (stopLoss >= entryPrice) {
      showToast(
        "Validation Error: For a Long call, Stop Loss must be less than Entry Price.",
        "error",
      );
      return;
    }
    if (target1 <= entryPrice) {
      showToast(
        "Validation Error: For a Long call, Target 1 must be greater than Entry Price.",
        "error",
      );
      return;
    }
    if (target2 <= target1) {
      showToast(
        "Validation Error: For a Long call, Target 2 must be greater than Target 1.",
        "error",
      );
      return;
    }

    const diffPercent = ((target1 - entryPrice) / entryPrice) * 100;
    if (diffPercent < 5 || diffPercent > 10) {
      const minTarget = (entryPrice + entryPrice * 0.05).toFixed(2);
      showToast(
        `Validation Error: Difference between Entry Price and Target 1 must be between 5% and 10%. (Minimum target should be ₹${minTarget})`,
        "error",
      );
      return;
    }
  } else {
    // Sell / Short call
    if (stopLoss <= entryPrice) {
      showToast(
        "Validation Error: For a Short call, Stop Loss must be greater than Entry Price.",
        "error",
      );
      return;
    }
    if (target1 >= entryPrice) {
      showToast(
        "Validation Error: For a Short call, Target 1 must be less than Entry Price.",
        "error",
      );
      return;
    }
    if (target2 >= target1) {
      showToast(
        "Validation Error: For a Short call, Target 2 must be less than Target 1.",
        "error",
      );
      return;
    }

    const diffPercent = ((entryPrice - target1) / entryPrice) * 100;
    if (diffPercent < 5 || diffPercent > 10) {
      const maxTarget = (entryPrice - entryPrice * 0.05).toFixed(2);
      showToast(
        `Validation Error: Difference between Entry Price and Target 1 must be between 5% and 10%. (Minimum target should be ₹${maxTarget})`,
        "error",
      );
      return;
    }
  }
  // --- End Validations ---

  const apiPayload = {
    user_id: localStorage.getItem("user_id"),
    call_date: orderDate,
    student_name: studentName,
    symbol: scrip,
    call_type: callType,
    entry_price: entryPrice.toFixed(2),
    target1: target1.toFixed(2),
    target2: target2.toFixed(2),
    stoploss: stopLoss.toFixed(2),
  };

  const placeBtn = document.getElementById("placeOrderBtn");
  const originalText = placeBtn.innerText;
  placeBtn.innerText = "Submitting...";
  placeBtn.disabled = true;

  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/submit_call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiPayload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to submit order to API");
    }

    const responseData = await response.json();

    // Refresh reports data in background
    getReportsData(true).then(() => {
      if (currentView === "Reports") {
        renderOrderHistory();
      }
    });

    showToast(
      `Backend Response: ${responseData.message || "Order placed successfully"} for ${scrip}`,
      "success",
    );
    closeOrderModal();
  } catch (error) {
    showToast("API Error: " + error.message, "error");
  } finally {
    placeBtn.innerText = originalText;
    placeBtn.disabled = false;
  }
}

async function renderOrderHistory() {
  orderHistoryBody.innerHTML =
    '<tr><td colspan="11" class="text-center py-4 text-gray-500">Loading...</td></tr>';

  const reports = await getReportsData();

  orderHistoryBody.innerHTML = "";
  if (!reports || reports.length === 0) {
    orderHistoryBody.innerHTML = `<tr><td colspan="11" class="text-center py-4 text-gray-500">No orders found.</td></tr>`;
    return;
  }

  reports.forEach((order) => {
    const tr = document.createElement("tr");
    const callTypeUpper = String(order.Call_Type || "").toUpperCase();
    const isLong = callTypeUpper === "LONG" || callTypeUpper === "BUY";
    const typeClass = isLong
      ? "text-profit font-bold"
      : "text-loss font-bold";

    tr.innerHTML = `
            <td>${order.DOA || "-"}</td>
            <td class="font-bold">${order.Symbol || "-"}</td>
            <td class="${typeClass}">${order.Call_Type || "-"}</td>
            <td class="text-right">${order.Entry_Price || "-"}</td>
            <td class="text-right">${order.Target1 || "-"}</td>
            <td class="text-right">${order.Target2 || "-"}</td>
            <td class="text-right">${order.Stoploss || "-"}</td>
            <td class="text-yellow-500 font-bold">${order.Status || "-"}</td>
            <td class="text-right">${order.Risk || "-"}</td>
            <td class="text-right">${order.Reward || "-"}</td>
            <td>${order.StatusDate || "-"}</td>
        `;
    orderHistoryBody.appendChild(tr);
  });
}

function exportOrderHistoryToExcel() {
  const data = reportsDataCache;
  if (!data || data.length === 0) {
    showToast("No order history data available to export.", "error");
    return;
  }

  const headers = [
    "DOA",
    "Symbol",
    "Call Type",
    "Entry Price",
    "Target 1",
    "Target 2",
    "Stop Loss",
    "Status",
    "Risk",
    "Reward",
    "Status Date"
  ];

  const rows = data.map(order => [
    order.DOA || "-",
    order.Symbol || "-",
    order.Call_Type || "-",
    order.Entry_Price || "0",
    order.Target1 || "0",
    order.Target2 || "0",
    order.Stoploss || "0",
    order.Status || "-",
    order.Risk || "0",
    order.Reward || "0",
    order.StatusDate || "-"
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `Order_History_${dateStr}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast("Order history exported successfully.", "success");
}

// Simple Drag to Move implementation for Modal Title Bar
const addScriptTitleBar = document.getElementById("addScriptTitleBar");
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

addScriptTitleBar.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;
  if (
    e.target === addScriptTitleBar ||
    e.target.parentNode === addScriptTitleBar
  ) {
    isDragging = true;
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    setTranslate(currentX, currentY, addScriptModal);
  }
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
}

function setTranslate(xPos, yPos, el) {
  // Because it has translate-x-1/2 translate-y-1/2, we need to adjust
  el.style.transform = `translate(calc(-50% + ${xPos}px), calc(-50% + ${yPos}px))`;
}

// Index Report Data fetching with sessionStorage cache and url fallback
async function fetchIndexData(indexName) {
  const cacheKey = `indexData_${indexName}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      indexDataCache[indexName] = JSON.parse(cached);
      return indexDataCache[indexName];
    } catch (e) {
      console.error("Failed to parse cached index data", e);
    }
  }

  try {
    let response;
    try {
      response = await fetch(`${CONFIG.API_BASE_URL}/index-reports/${indexName}`);
      if (!response.ok) throw new Error("Status " + response.status);
    } catch (error) {
      console.warn("Fallback to /index-data/ because /index-reports/ failed", error);
      response = await fetch(`${CONFIG.API_BASE_URL}/index-data/${indexName}`);
    }

    if (!response.ok) throw new Error("Failed to fetch from fallback too");
    const rawData = await response.json();
    
    // Normalize to standard marketWatchCache schema
    const mapped = rawData.map(item => {
      const open = parseFloat(item.OPEN_PRICE) || 0;
      const close = parseFloat(item.CLOSE_PRICE) || 0;
      const diff = (close - open).toFixed(2);
      return {
        Symbol: item.SYMBOL,
        Industry: item.INDUSTRY,
        Change_pct: item.PCT_CHNG || "0.00%",
        Diff: diff,
        Close: item.CLOSE_PRICE,
        Open: item.OPEN_PRICE,
        High: item.HIGH_PRICE,
        Low: item.LOW_PRICE,
        Volume: item.TTL_TRD_QNTY
      };
    });

    indexDataCache[indexName] = mapped;
    sessionStorage.setItem(cacheKey, JSON.stringify(mapped));
    return mapped;
  } catch (err) {
    console.error("Error fetching index data for " + indexName, err);
    showToast("Failed to fetch index data for " + indexName, "error");
    return [];
  }
}

function openIndexTab(indexName) {
  const tabName = indexName.toUpperCase();
  const existingIndex = marketWatchTabs.findIndex(tab => tab.name && tab.name.toUpperCase() === tabName);

  if (existingIndex !== -1) {
    activeTabIndex = existingIndex;
    switchView("MarketWatch");
    renderWorkspaceTabs();
    renderMarketWatch();
    return;
  }

  marketWatchTabs.push({
    name: tabName,
    scrips: [],
    isIndex: true,
    indexName: indexName.toLowerCase()
  });

  activeTabIndex = marketWatchTabs.length - 1;
  switchView("MarketWatch");
  renderWorkspaceTabs();
  renderMarketWatch();
  saveMarketWatch();
}

async function fetchLiveIndices() {
  console.log("fetchLiveIndices: starting fetch...");
  const niftyEl = document.getElementById("niftyTicker");
  const sensexEl = document.getElementById("sensexTicker");
  const bankniftyEl = document.getElementById("bankniftyTicker");
  if (!niftyEl && !sensexEl && !bankniftyEl) return;

  let niftyData = null;
  let sensexData = null;
  let bankniftyData = null;

  // Strictly fetch indices from TradingView Live Scanner API (Real-time, No Delay)
  try {
    const response = await fetch('https://scanner.tradingview.com/india/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: JSON.stringify({
        symbols: { tickers: ["BSE:SENSEX", "NSE:NIFTY", "NSE:BANKNIFTY"] },
        columns: ["close", "change"]
      })
    });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        json.data.forEach(item => {
          if (item.s === "NSE:NIFTY") niftyData = { close: item.d[0], diff: item.d[1] };
          if (item.s === "BSE:SENSEX") sensexData = { close: item.d[0], diff: item.d[1] };
          if (item.s === "NSE:BANKNIFTY") bankniftyData = { close: item.d[0], diff: item.d[1] };
        });
      }
    }
  } catch (err) {
    console.error("Failed to fetch live indices from TradingView:", err);
  }

  // 5. Update UI
  if (niftyData && niftyEl) {
    const priceVal = niftyData.close.toFixed(2);
    const diffVal = niftyData.diff.toFixed(2);
    const diffSign = niftyData.diff >= 0 ? "+" : "";
    niftyEl.innerText = `NIFTY ${priceVal} (${diffSign}${diffVal})`;
    niftyEl.className = niftyData.diff >= 0 ? "text-profit font-semibold" : "text-loss font-semibold";
  }

  if (sensexData && sensexEl) {
    const priceVal = sensexData.close.toFixed(2);
    const diffVal = sensexData.diff.toFixed(2);
    const diffSign = sensexData.diff >= 0 ? "+" : "";
    sensexEl.innerText = `SENSEX ${priceVal} (${diffSign}${diffVal})`;
    sensexEl.className = sensexData.diff >= 0 ? "text-profit font-semibold" : "text-loss font-semibold";
  }

  if (bankniftyData && bankniftyEl) {
    const priceVal = bankniftyData.close.toFixed(2);
    const diffVal = bankniftyData.diff.toFixed(2);
    const diffSign = bankniftyData.diff >= 0 ? "+" : "";
    bankniftyEl.innerText = `BANKNIFTY ${priceVal} (${diffSign}${diffVal})`;
    bankniftyEl.className = bankniftyData.diff >= 0 ? "text-profit font-semibold" : "text-loss font-semibold";
  }
}

// Removed fetchYahooIndex in favor of TradingView live scanner

