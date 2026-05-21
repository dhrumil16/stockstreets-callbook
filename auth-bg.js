document.addEventListener("DOMContentLoaded", () => {
  // Create background container
  const bgContainer = document.createElement("div");
  bgContainer.className = "chart-bg-container";

  // Create SVG for trend line
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", "chart-svg");
  svg.setAttribute("viewBox", "0 0 1000 500");
  svg.setAttribute("preserveAspectRatio", "none");

  // Create path for trend line going up
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("class", "trend-path");
  // A path rising from bottom-left to top-right with curves
  path.setAttribute("d", "M -50 460 C 200 420, 300 280, 500 260 S 800 120, 1050 40");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", "#0997d7");
  path.setAttribute("stroke-width", "3");

  svg.appendChild(path);
  bgContainer.appendChild(svg);

  // Generate candles
  const totalCandles = 28;
  for (let i = 0; i < totalCandles; i++) {
    const candle = document.createElement("div");
    
    // Spacing from left
    const leftPercent = (i / (totalCandles - 1)) * 96 + 2; // Keep away from extreme edges
    candle.style.left = `${leftPercent}%`;
    
    // Trend base height (climbs from left to right)
    const baseHeightPercent = 10 + (i / (totalCandles - 1)) * 72; // 10% to 82%
    const randomVariation = (Math.random() - 0.4) * 12; // Add noise
    const finalBottom = Math.max(8, Math.min(88, baseHeightPercent + randomVariation));
    
    // Decide if green (bullish) or red (bearish)
    const isGreen = Math.random() < 0.8;
    candle.className = `candle ${isGreen ? 'green' : 'red'}`;

    // Dimensions
    const bodyHeight = Math.floor(Math.random() * 45) + 15; // 15px to 60px
    const wickExtension = Math.floor(Math.random() * 25) + 10; // 10px to 35px
    const totalWickHeight = bodyHeight + wickExtension;

    // Create wick
    const wick = document.createElement("div");
    wick.className = "candle-wick";

    // Create body
    const body = document.createElement("div");
    body.className = "candle-body";
    body.style.height = `${bodyHeight}px`;

    // Animating heights dynamically for high tech feel
    const animDuration = (Math.random() * 3 + 3).toFixed(2); // 3s to 6s
    const animDelay = (Math.random() * 3).toFixed(2); // 0s to 3s
    const animType = Math.random() < 0.5 ? 'fluctuateHeight' : 'fluctuateHeightAlt';
    body.style.animationName = animType;
    body.style.animationDuration = `${animDuration}s`;
    body.style.animationDelay = `${animDelay}s`;
    body.style.animationTimingFunction = "ease-in-out";
    body.style.animationIterationCount = "infinite";

    // Set position and composition
    candle.style.bottom = `${finalBottom}%`;
    candle.style.height = `${totalWickHeight}px`;
    
    candle.appendChild(wick);
    candle.appendChild(body);
    bgContainer.appendChild(candle);
  }

  // Prepend to body so it is behind other elements
  document.body.prepend(bgContainer);

  // 1. Mouse Spotlight Tracking on Cards
  document.addEventListener("mousemove", (e) => {
    const cards = document.querySelectorAll(".glass-card, .option-card");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty("--mouse-x", `${x}px`);
      card.style.setProperty("--mouse-y", `${y}px`);
    });
  });

  // 2. Reactive Candles when Typing/Focusing Inputs
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("focus", () => {
      bgContainer.classList.add("active");
    });
    input.addEventListener("blur", () => {
      // Small timeout to allow activeElement to shift to another input smoothly
      setTimeout(() => {
        if (!document.activeElement || document.activeElement.tagName !== "INPUT") {
          bgContainer.classList.remove("active");
        }
      }, 50);
    });
  });

  // 3. Floating Tickers
  const tickers = [
    { symbol: "NIFTY 50", val: "24,201.30", change: "+1.25%", up: true },
    { symbol: "BANK NIFTY", val: "52,890.45", change: "+0.82%", up: true },
    { symbol: "SENSEX", val: "79,485.20", change: "-0.15%", up: false }
  ];

  tickers.forEach((tickerData, index) => {
    const badge = document.createElement("div");
    badge.className = "floating-ticker";
    
    // Position randomly across screen sections horizontally
    const topPercent = 12 + Math.random() * 55; // 12% to 67%
    const leftPercent = 5 + (index * 32) + Math.random() * 10; // spaced out horizontally
    badge.style.top = `${topPercent}%`;
    badge.style.left = `${leftPercent}%`;
    
    // Random animation duration/delay
    const animDuration = (12 + Math.random() * 6).toFixed(1);
    const animDelay = (Math.random() * -10).toFixed(1); // negative delay to start immediately
    badge.style.animationDuration = `${animDuration}s`;
    badge.style.animationDelay = `${animDelay}s`;
    
    badge.innerHTML = `
      <span class="ticker-symbol">${tickerData.symbol}</span>
      <span class="ticker-val">${tickerData.val}</span>
      <span class="ticker-change ${tickerData.up ? 'up' : 'down'}">${tickerData.up ? '▲' : '▼'} ${tickerData.change}</span>
    `;
    bgContainer.appendChild(badge);
  });

  // 4. Floating Particle System
  const totalParticles = 20;
  for (let i = 0; i < totalParticles; i++) {
    const particle = document.createElement("div");
    particle.className = "bg-particle";
    
    const left = Math.random() * 100;
    const size = (Math.random() * 2 + 1.5).toFixed(1);
    const duration = (Math.random() * 14 + 10).toFixed(1);
    const delay = (Math.random() * -20).toFixed(1);
    const opacity = (Math.random() * 0.25 + 0.08).toFixed(2);
    
    particle.style.left = `${left}%`;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.setProperty("--d", `${duration}s`);
    particle.style.setProperty("--op", opacity);
    particle.style.animationDelay = `${delay}s`;
    
    bgContainer.appendChild(particle);
  }
});
