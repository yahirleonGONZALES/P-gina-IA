/* ==========================================================================
   NEXA AI — Script Principal Interactivo
   Efectos visuales, simulador de inferencia de IA y animaciones interactivas
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Iconos de Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // 1. Red Neuronal Dinámica (Interactive Canvas)
  initNeuralCanvas();

  // 2. Navegación Móvil y Efecto Scroll en Navbar
  initNavigation();

  // 3. Playground Interactivo de IA
  initPlayground();

  // 4. Pestañas de Código de API
  initCodeTabs();

  // 5. Animación de Contadores Numéricos
  initStatsCounters();

  // 6. Conmutador de Facturación (Precios Mensual / Anual)
  initPricingToggle();

  // 7. Acordeón de FAQ
  initFaqAccordion();

  // 8. Efecto 3D Tilt en Tarjetas
  initTiltCards();

  // 9. Formulario CTA y Sistema de Toast
  initCtaForm();
});

/* ==========================================================================
   1. CANVAS DE REDES NEURONALES (ALTO RENDIMIENTO - GPU FRIENDLY)
   ========================================================================== */
function initNeuralCanvas() {
  const canvas = document.getElementById('neuralCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height;
  let particles = [];
  const particleCount = window.innerWidth < 768 ? 24 : 44;
  const maxDistance = 125;
  const maxDistSq = maxDistance * maxDistance;

  let mouse = {
    x: null,
    y: null,
    radius: 140,
    radiusSq: 140 * 140
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  }, { passive: true });

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      initParticles();
    }, 150);
  }, { passive: true });

  resize();

  class Particle {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.6;
      this.vy = (Math.random() - 0.5) * 0.6;
      this.radius = Math.random() * 1.8 + 1;
      this.color = Math.random() > 0.4 ? 'rgba(99, 102, 241, 0.75)' : 'rgba(6, 182, 212, 0.75)';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx = -this.vx;
      if (this.y < 0 || this.y > height) this.vy = -this.vy;

      // Interacción con cursor optimizada con distSq
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouse.radiusSq && distSq > 0) {
          const dist = Math.sqrt(distSq);
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= (dx / dist) * force * 1.2;
          this.y -= (dy / dist) * force * 1.2;
        }
      }
    }

    draw() {
      // Dibujado ultrarrápido sin shadowBlur (cero lag de rasterizado en GPU)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  initParticles();

  let animId;
  function animate() {
    ctx.clearRect(0, 0, width, height);

    // Conectar partículas entre sí (filtrado previo por distSq para saltar Math.sqrt innecesarios)
    const len = particles.length;
    for (let i = 0; i < len; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < len; j++) {
        const p2 = particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < maxDistSq) {
          const alpha = (1 - Math.sqrt(distSq) / maxDistance) * 0.22;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
      }
    }

    // Conexión al cursor
    if (mouse.x !== null && mouse.y !== null) {
      for (let i = 0; i < len; i++) {
        const p = particles[i];
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < mouse.radiusSq) {
          const alpha = (1 - Math.sqrt(distSq) / mouse.radius) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }
    }

    // Actualizar y dibujar partículas
    for (let i = 0; i < len; i++) {
      particles[i].update();
      particles[i].draw();
    }

    animId = requestAnimationFrame(animate);
  }

  animId = requestAnimationFrame(animate);

  // Pausar canvas cuando la pestaña está en segundo plano para ahorrar batería/GPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animId);
    } else {
      animId = requestAnimationFrame(animate);
    }
  });
}

/* ==========================================================================
   2. NAVEGACIÓN Y SCROLL FLUIDO 1:1
   ========================================================================== */
function initNavigation() {
  const navbar = document.querySelector('.navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  // Scroll suave exclusivo para clics en enlaces de anclaje (no interfiere con la rueda)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        if (history.pushState) {
          history.pushState(null, '', targetId);
        }
      }
    });
  });

  // Control pasivo del navbar al hacer scroll (cero recálculo de estilos en línea)
  let isScrolled = false;
  window.addEventListener('scroll', () => {
    const shouldBeScrolled = window.scrollY > 40;
    if (shouldBeScrolled !== isScrolled) {
      isScrolled = shouldBeScrolled;
      navbar.classList.toggle('scrolled', isScrolled);
    }
  }, { passive: true });

  // Toggle menú responsive
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      if (navMenu.classList.contains('open')) {
        mobileToggle.innerHTML = '<i data-lucide="x"></i>';
      } else {
        mobileToggle.innerHTML = '<i data-lucide="menu"></i>';
      }
      if (window.lucide) lucide.createIcons();
    });

    // Cerrar menú al hacer clic en enlaces
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileToggle.innerHTML = '<i data-lucide="menu"></i>';
        if (window.lucide) lucide.createIcons();
      });
    });
  }
}

/* ==========================================================================
   3. SIMULADOR INTERACTIVO DE IA (PLAYGROUND)
   ========================================================================== */
function initPlayground() {
  const promptInput = document.getElementById('promptInput');
  const generateBtn = document.getElementById('generateBtn');
  const generateBtnText = document.getElementById('generateBtnText');
  const outputCode = document.getElementById('outputCode');
  const tokenCountEl = document.getElementById('tokenCount');
  const responseTimeEl = document.getElementById('responseTime');
  const copyOutputBtn = document.getElementById('copyOutputBtn');
  const clearBtn = document.getElementById('clearBtn');
  const presetChips = document.querySelectorAll('.preset-chip');

  const presetData = {
    code: {
      prompt: "Crea una función asíncrona en TypeScript con reintentos exponenciales y manejo de excepciones.",
      response: `/**
 * Ejecuta una tarea asíncrona con algoritmo de retroceso exponencial (Exponential Backoff)
 */
export async function retryWithBackoff<T>(
  task: () => Promise<T>,
  maxRetries = 4,
  initialDelayMs = 300,
  factor = 2
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await task();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw new Error(\`[NEXA-CORE]: Fallo tras \${maxRetries} reintentos: \${(error as Error).message}\`);
      }
      
      const jitter = Math.random() * 100;
      const delay = initialDelayMs * Math.pow(factor, attempt - 1) + jitter;
      
      console.warn(\`Reintentando operación (Intento \${attempt}/\${maxRetries}) en \${delay.toFixed(0)}ms...\`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}`
    },
    marketing: {
      prompt: "Diseña un plan de lanzamiento para un producto B2B de inteligencia artificial.",
      response: `[ESTRATEGIA DE LANZAMIENTO NEXA B2B — FASE 1: ACTIVACIÓN]

1. Tesis de Posicionamiento:
   "La primera API de inferencia neuronal con garantía de latencia sub-25ms y privacidad Zero-Knowledge certificada."

2. Calendario de Tracción (4 Semanas):
   • Semana 1: Programa de Acceso Temprano (Alpha privada para 100 CTOs en FinTech & Health).
   • Semana 2: Campaña "Open Benchmarks" en GitHub & Hacker News (Comparativas directas de throughput vs modelos líderes).
   • Semana 3: Evento Virtual de Desarrolladores + SDK Hackathon con \$25,000 en créditos de inferencia.
   • Semana 4: Apertura General con nivel gratuito generoso (50k tokens) para impulsar la adopción viral.

3. Métricas Clave (KPIs):
   • Conversión de registro a primera llamada API: > 38%
   • Retención de cohorte a 30 días: > 62%
   • Net Promoter Score (NPS): > 75`
    },
    data: {
      prompt: "Escribe un script en Python para detectar anomalías en series temporales financieras.",
      response: `import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def detect_financial_anomalies(df: pd.DataFrame, contamination_rate: float = 0.02) -> pd.DataFrame:
    """
    Identifica picos irregulares de volumen y volatilidad utilizando Isolation Forest.
    """
    df = df.copy()
    
    # Ingeniería de características financieras
    df['returns'] = df['close'].pct_change()
    df['volatility_7d'] = df['returns'].rolling(window=7).std()
    df['volume_zscore'] = (df['volume'] - df['volume'].rolling(20).mean()) / df['volume'].rolling(20).std()
    
    clean_data = df.dropna()
    features = ['returns', 'volatility_7d', 'volume_zscore']
    
    # Ajuste de modelo no supervisado
    model = IsolationForest(n_estimators=150, contamination=contamination_rate, random_state=42)
    clean_data['anomaly_score'] = model.fit_predict(clean_data[features])
    
    # -1 indica anomalía detectada
    anomalies = clean_data[clean_data['anomaly_score'] == -1]
    print(f"[NEXA Insights]: Se detectaron {len(anomalies)} anomalías críticas en la serie.")
    return clean_data`
    },
    sql: {
      prompt: "Diseña una consulta SQL jerárquica con CTE recursiva para calcular el valor de vida útil del cliente (LTV).",
      response: `WITH RECURSIVE CustomerTiers AS (
  -- Miembros base iniciales
  SELECT 
    user_id,
    referred_by_id,
    1 AS hierarchy_level,
    total_spent
  FROM users
  WHERE referred_by_id IS NULL
  
  UNION ALL
  
  -- Jerarquía de referidos multinivel recursiva
  SELECT 
    u.user_id,
    u.referred_by_id,
    ct.hierarchy_level + 1,
    u.total_spent
  FROM users u
  INNER JOIN CustomerTiers ct ON u.referred_by_id = ct.user_id
)
SELECT 
  hierarchy_level,
  COUNT(DISTINCT user_id) AS total_users,
  ROUND(AVG(total_spent), 2) AS avg_customer_spend,
  ROUND(SUM(total_spent), 2) AS collective_ltv_revenue,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY total_spent) AS p95_spender
FROM CustomerTiers
GROUP BY hierarchy_level
ORDER BY hierarchy_level ASC;`
    }
  };

  let isGenerating = false;
  let typingInterval = null;

  // Manejador de chips de sugerencia
  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const presetKey = chip.getAttribute('data-preset');
      if (presetData[presetKey]) {
        promptInput.value = presetData[presetKey].prompt;
        triggerGeneration(presetData[presetKey].response);
      }
    });
  });

  // Botón Generar
  generateBtn.addEventListener('click', () => {
    if (isGenerating) return;
    const currentPrompt = promptInput.value.trim();
    if (!currentPrompt) return;

    // Buscar si coincide con un preset, de lo contrario generar una respuesta inteligente personalizada
    let responseText = "";
    const activeChip = document.querySelector('.preset-chip.active');
    const chipKey = activeChip ? activeChip.getAttribute('data-preset') : null;

    if (chipKey && presetData[chipKey] && presetData[chipKey].prompt === currentPrompt) {
      responseText = presetData[chipKey].response;
    } else {
      responseText = `// [NEXA CORE 4.5]: Respuesta generada para: "${currentPrompt}"
// Optimizado para alta velocidad y coherencia contextual

export async function processNexaInference(contextPayload: Record<string, unknown>) {
  const telemetry = {
    timestamp: new Date().toISOString(),
    status: "OPTIMIZED",
    tokensProcessed: 480,
    entropyScore: 0.994
  };

  // Ejecución de pipeline cognitivo
  const result = await Promise.resolve({
    analysis: "Evaluación completada con éxito. Parámetros alineados.",
    payload: contextPayload,
    telemetry
  });

  return result;
}`;
    }

    triggerGeneration(responseText);
  });

  function triggerGeneration(textToStream) {
    if (isGenerating) clearInterval(typingInterval);
    isGenerating = true;

    // Estado del botón
    generateBtn.disabled = true;
    generateBtnText.textContent = "Procesando...";
    outputCode.innerHTML = `<span class="cursor-blink"></span>`;

    const startTime = performance.now();
    let index = 0;
    const speed = 12; // milisegundos por fragmento

    typingInterval = setInterval(() => {
      if (index < textToStream.length) {
        // Añadir varios caracteres por tick para fluidez tipo streaming
        const chunkSize = Math.min(3, textToStream.length - index);
        const chunk = textToStream.substring(index, index + chunkSize);
        
        // Mantener el cursor parpadeante al final
        outputCode.textContent = textToStream.substring(0, index + chunkSize);
        outputCode.innerHTML = escapeHtml(outputCode.textContent) + `<span class="cursor-blink"></span>`;
        index += chunkSize;
      } else {
        clearInterval(typingInterval);
        isGenerating = false;
        outputCode.innerHTML = escapeHtml(textToStream);
        generateBtn.disabled = false;
        generateBtnText.textContent = "Generar";

        const endTime = performance.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(2);
        const estimatedTokens = Math.round(textToStream.length / 3.8);

        tokenCountEl.textContent = `${estimatedTokens} tokens`;
        responseTimeEl.textContent = `${durationSec}s`;
      }
    }, speed);
  }

  // Copiar salida
  copyOutputBtn.addEventListener('click', () => {
    const text = outputCode.innerText.replace('▌', '').trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      showToast("¡Código copiado al portapapeles!");
    });
  });

  // Limpiar
  clearBtn.addEventListener('click', () => {
    if (isGenerating) clearInterval(typingInterval);
    isGenerating = false;
    promptInput.value = "";
    outputCode.textContent = 'Ingresa una instrucción y haz clic en "Generar"...';
    tokenCountEl.textContent = "0 tokens";
    responseTimeEl.textContent = "0.00s";
    generateBtn.disabled = false;
    generateBtnText.textContent = "Generar";
  });

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}

/* ==========================================================================
   4. PESTAÑAS DE CÓDIGO DE API PARA DESARROLLADORES
   ========================================================================== */
function initCodeTabs() {
  const tabs = document.querySelectorAll('.code-tab');
  const codeSnippet = document.getElementById('codeSnippet');
  const langLabel = document.getElementById('currentLangLabel');
  const copyBtn = document.getElementById('copyCodeSnippetBtn');

  const codeSnippets = {
    python: `# Instalar: pip install nexa-ai
from nexa import NexaClient

client = NexaClient(api_key="nexa_live_key_99x")

stream = client.chat.create(
    model="nexa-core-4.5-ultra",
    messages=[{"role": "user", "content": "Genera un pipeline CI/CD en GitHub Actions"}],
    stream=True
)

for chunk in stream:
    print(chunk.delta.content, end="", flush=True)`,

    typescript: `// Instalar: npm i @nexa-ai/sdk
import { NexaClient } from "@nexa-ai/sdk";

const client = new NexaClient({ apiKey: "nexa_live_key_99x" });

const stream = await client.chat.stream({
  model: "nexa-core-4.5-ultra",
  messages: [{ role: "user", content: "Genera un pipeline CI/CD en GitHub Actions" }],
  temperature: 0.2
});

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}`,

    curl: `# Petición cURL estándar con Streaming SSE
curl https://api.nexa.ai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer nexa_live_key_99x" \\
  -d '{
    "model": "nexa-core-4.5-ultra",
    "stream": true,
    "messages": [
      {"role": "user", "content": "Genera un pipeline CI/CD en GitHub Actions"}
    ]
  }'`
  };

  const langNames = {
    python: 'Python 3.11+',
    typescript: 'Node.js / Bun',
    curl: 'Terminal Bash / cURL'
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const lang = tab.getAttribute('data-lang');
      if (codeSnippets[lang]) {
        codeSnippet.textContent = codeSnippets[lang];
        langLabel.textContent = langNames[lang];
      }
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const code = codeSnippet.innerText;
      navigator.clipboard.writeText(code).then(() => {
        showToast("¡Ejemplo de API copiado con éxito!");
      });
    });
  }
}

/* ==========================================================================
   5. CONTADORES NUMÉRICOS ANIMADOS EN SCROLL
   ========================================================================= */
function initStatsCounters() {
  const statNumbers = document.querySelectorAll('.stat-number');
  let animated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        statNumbers.forEach(numEl => {
          const target = parseInt(numEl.getAttribute('data-target'), 10);
          const duration = 1800; // ms
          const stepTime = 25;
          const steps = duration / stepTime;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              numEl.textContent = target;
              clearInterval(timer);
            } else {
              numEl.textContent = Math.floor(current);
            }
          }, stepTime);
        });
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    observer.observe(statsSection);
  }
}

/* ==========================================================================
   6. CONMUTADOR DE FACTURACIÓN (MENSUAL / ANUAL)
   ========================================================================== */
function initPricingToggle() {
  const toggle = document.getElementById('billingToggle');
  const amounts = document.querySelectorAll('.pricing-card .amount');
  const monthlyLabel = document.getElementById('monthlyLabel');
  const annualLabel = document.getElementById('annualLabel');

  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const isYearly = toggle.checked;

    if (isYearly) {
      monthlyLabel.classList.remove('active');
      annualLabel.classList.add('active');
    } else {
      monthlyLabel.classList.add('active');
      annualLabel.classList.remove('active');
    }

    amounts.forEach(amount => {
      const targetVal = isYearly 
        ? amount.getAttribute('data-yearly') 
        : amount.getAttribute('data-monthly');

      // Animación suave del cambio de precio
      amount.style.transform = 'scale(0.8)';
      amount.style.opacity = '0';

      setTimeout(() => {
        amount.textContent = targetVal;
        amount.style.transform = 'scale(1)';
        amount.style.opacity = '1';
      }, 150);
    });
  });
}

/* ==========================================================================
   7. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Cerrar otros
      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('active');
        }
      });

      // Toggle actual
      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   8. EFECTO 3D TILT EN TARJETAS (ACELERADO POR HARDWARE)
   ========================================================================== */
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');

  cards.forEach(card => {
    let rect = null;
    let rafId = null;

    card.addEventListener('mouseenter', () => {
      rect = card.getBoundingClientRect();
    }, { passive: true });

    card.addEventListener('mousemove', (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(800px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`;
      });
    }, { passive: true });

    card.addEventListener('mouseleave', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rect = null;
      card.style.transform = '';
    }, { passive: true });
  });
}

/* ==========================================================================
   9. FORMULARIO CTA Y SISTEMA TOAST
   ========================================================================== */
function initCtaForm() {
  const form = document.getElementById('newsletterForm');
  const emailInput = document.getElementById('emailInput');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      if (!email) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Procesando...</span>`;

      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        emailInput.value = "";
        showToast("¡Listo! Te enviamos una invitación de acceso prioritario.");
        if (window.lucide) lucide.createIcons();
      }, 900);
    });
  }
}

// Sistema de Notificación Toast
let toastTimeout;
function showToast(message) {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}
