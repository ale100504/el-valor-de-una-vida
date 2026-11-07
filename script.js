
document.addEventListener("DOMContentLoaded", () => {

  const header = document.getElementById("siteHeader");
  const progressBar = document.getElementById("progressBar");

  // Barra de progreso y navegación
  function updateScroll() {
    const scrollTop = window.scrollY;

    const scrollableHeight =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const progress = scrollableHeight > 0
      ? (scrollTop / scrollableHeight) * 100
      : 0;

    progressBar.style.width = `${progress}%`;

    header.classList.toggle("scrolled", scrollTop > 50);
  }

  window.addEventListener("scroll", updateScroll, {
    passive: true
  });

  window.addEventListener("resize", updateScroll);

  updateScroll();

  // Aparición progresiva de elementos
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -30px 0px"
    }
  );

  document.querySelectorAll(".reveal").forEach(element => {
    revealObserver.observe(element);
  });

  // Animación del gráfico de pobreza
  const povertyChart = document.getElementById("povertyChart");

  if (povertyChart) {
    const chartObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.25
      }
    );

    chartObserver.observe(povertyChart);
  }

  // Desplazamiento suave para enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const targetId = link.getAttribute("href");
      const target = document.querySelector(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });


  
    // ==================================================
    // SECUENCIA 2 — ANIMACIONES AL DESPLAZARSE
    // ==================================================

    // Anima elementos una sola vez al entrar en pantalla.
    function animateWhenVisible(selector, callback) {
    const elements = document.querySelectorAll(selector);

    if (!elements.length) return;

    const observer = new IntersectionObserver(
        (entries, currentObserver) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            callback(entry.target);
            currentObserver.unobserve(entry.target);
        });
        },
        {
        threshold: 0.15,
        rootMargin: "0px 0px -40px 0px"
        }
    );

    elements.forEach(element => observer.observe(element));
    }

    // Comparación entre zonas urbanas y rurales.
    animateWhenVisible(".rural-comparison", element => {
    element.classList.add("animated");
    });

    // Barras de pobreza por departamento.
    animateWhenVisible("#departmentChart", element => {
    element.classList.add("animated");
    });

    // Indicador circular del índice de Gini.
    animateWhenVisible("#giniRing", element => {
    const value = Number(
        element.style.getPropertyValue("--gini")
    ) || 0;

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
        element.style.setProperty("--ring-progress", `${value}%`);
        return;
    }

    const duration = 1500;
    const start = performance.now();

    function drawFrame(now) {
        const elapsed = Math.min((now - start) / duration, 1);

        // Movimiento suavizado.
        const eased = 1 - Math.pow(1 - elapsed, 3);
        const current = value * eased;

        element.style.setProperty(
        "--ring-progress",
        `${current}%`
        );

        if (elapsed < 1) {
        requestAnimationFrame(drawFrame);
        }
    }

    requestAnimationFrame(drawFrame);
    });


    // ==================================================
    // SECUENCIA 3 — GRÁFICOS Y ANIMACIONES
    // ==================================================

    // GRÁFICO DE LÍNEA DEL PBI
    const gdpSvg = document.getElementById("gdpChart");

    if (gdpSvg) {
    const values = [
        { year: "2020", value: -10.9 },
        { year: "2021", value: 13.4 },
        { year: "2022", value: 2.8 },
        { year: "2023", value: -0.4 },
        { year: "2024", value: 3.5 },
        { year: "2025", value: 3.4 }
    ];

    const SVG_NS = "http://www.w3.org/2000/svg";
    const left = 95;
    const right = 935;
    const top = 55;
    const bottom = 365;
    const minValue = -15;
    const maxValue = 15;

    function svgElement(tag, attributes, parent = gdpSvg) {
        const node = document.createElementNS(SVG_NS, tag);

        Object.entries(attributes).forEach(([key, value]) => {
        node.setAttribute(key, String(value));
        });

        parent.appendChild(node);
        return node;
    }

    function xScale(index) {
        return left + index * (right - left) / (values.length - 1);
    }

    function yScale(value) {
        return bottom -
        ((value - minValue) / (maxValue - minValue)) *
        (bottom - top);
    }

    // Líneas horizontales y etiquetas
    [-15, -10, -5, 0, 5, 10, 15].forEach(value => {
        const y = yScale(value);

        svgElement("line", {
        x1: left,
        y1: y,
        x2: right,
        y2: y,
        class: value === 0 ? "gdp-zero-line" : "gdp-grid-line"
        });

        const label = svgElement("text", {
        x: left - 18,
        y: y + 5,
        "text-anchor": "end",
        class: "gdp-axis-label"
        });

        label.textContent = `${value} %`;
    });

    const points = values.map((item, index) => ({
        x: xScale(index),
        y: yScale(item.value),
        ...item
    }));

    // Curva cúbica suave que pasa por todos los datos.
    // Utiliza puntos de control de Catmull-Rom.
    function smoothPath(items) {
        let path = `M ${items[0].x} ${items[0].y}`;

        for (let i = 0; i < items.length - 1; i++) {
        const p0 = items[Math.max(0, i - 1)];
        const p1 = items[i];
        const p2 = items[i + 1];
        const p3 = items[Math.min(items.length - 1, i + 2)];

        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;

        path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
        }

        return path;
    }

    const curve = svgElement("path", {
        d: smoothPath(points),
        class: "gdp-line"
    });

    const pointElements = [];

    points.forEach(point => {
        const circle = svgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: 7,
        class: point.value < 0
            ? "gdp-point negative"
            : "gdp-point"
        });

        const label = svgElement("text", {
        x: point.x,
        y: point.value > 11 ? point.y + 32 : point.y - 20,
        "text-anchor": "middle",
        class: point.value < 0
            ? "gdp-value-label negative"
            : "gdp-value-label"
        });

        label.textContent =
        `${point.value > 0 ? "+" : ""}${point.value.toFixed(1).replace(".", ",")} %`;

        const year = svgElement("text", {
        x: point.x,
        y: 410,
        "text-anchor": "middle",
        class: "gdp-axis-label"
        });

        year.textContent = point.year;

        pointElements.push({ circle, label });
    });

    // La curva se revela al llegar a ella.
    const curveLength = curve.getTotalLength();

    curve.style.strokeDasharray = `${curveLength}`;
    curve.style.strokeDashoffset = `${curveLength}`;

    pointElements.forEach(({ circle, label }) => {
        circle.style.opacity = "0";
        label.style.opacity = "0";
    });

    const gdpObserver = new IntersectionObserver(
        (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
            ).matches;

            curve.style.transition = reduceMotion
            ? "none"
            : "stroke-dashoffset 2s ease";

            curve.style.strokeDashoffset = "0";

            pointElements.forEach(({ circle, label }, index) => {
            const delay = reduceMotion ? 0 : index * 220;

            circle.style.transition = reduceMotion
                ? "none"
                : `opacity .35s ease ${delay}ms`;

            label.style.transition = reduceMotion
                ? "none"
                : `opacity .35s ease ${delay}ms`;

            circle.style.opacity = "1";
            label.style.opacity = "1";
            });

            observer.unobserve(entry.target);
        });
        },
        { threshold: 0.25 }
    );

    gdpObserver.observe(gdpSvg);
    }

    // SECTORES ECONÓMICOS
    animateWhenVisible("#sectorChart", element => {
    element.classList.add("animated");

    element.querySelectorAll(".sector-fill").forEach(bar => {
        const value = Number(
        bar.style.getPropertyValue("--sector")
        );

        // El gráfico utiliza una escala máxima de 7 %.
        bar.style.width = `${Math.min(100, value / 7 * 100)}%`;
    });
    });

    // POBREZA FRENTE A LA PREPANDEMIA
    animateWhenVisible("#recoveryChart", element => {
    element.classList.add("animated");

    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 850;
    const chartHeight = isMobile ? 225 : isTablet ? 270 : 330;

    element.querySelectorAll(".recovery-column").forEach(bar => {
        const value = Number(
        bar.style.getPropertyValue("--poverty")
        );

        bar.style.height = `${value / 30 * chartHeight}px`;
    });
    });


    // ==================================================
    // SECUENCIA 4 — MYPE
    // ==================================================

    // 1. CONTADORES ANIMADOS

    const mypeCounters = document.querySelectorAll(
    ".mype-stat-number[data-count]"
    );

    const counterObserver = new IntersectionObserver(
    (entries, observer) => {
        entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.count);
        const format = element.dataset.format;

        const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        const duration = reducedMotion ? 0 : 1800;
        const start = performance.now();

        function formatCounter(value) {
            if (format === "integer") {
            return Math.round(value).toLocaleString("es-PE");
            }

            if (format === "percent") {
            return value.toLocaleString("es-PE", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }) + " %";
            }

            if (format === "millions") {
            return value.toLocaleString("es-PE", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            }) + " millones";
            }

            return String(value);
        }

        function updateCounter(now) {
            const progress = duration === 0
            ? 1
            : Math.min((now - start) / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);
            element.textContent = formatCounter(target * eased);

            if (progress < 1) {
            requestAnimationFrame(updateCounter);
            }
        }

        requestAnimationFrame(updateCounter);
        observer.unobserve(element);
        });
    },
    { threshold: 0.25 }
    );

    mypeCounters.forEach(counter => {
    counterObserver.observe(counter);
    });


    // 2. GRÁFICO CIRCULAR DE LAS CINCO ACTIVIDADES

    const mypeDonut = document.getElementById("mypeDonut");

    if (mypeDonut) {
    const sectors = [
        { value: 44.1, color: "#c8a66d" },
        { value: 41.4, color: "#5d829a" },
        { value: 8.5, color: "#6e9d80" },
        { value: 3.8, color: "#b65c5a" },
        { value: 2.2, color: "#a49b8b" }
    ];

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    function drawMypeDonut(progress) {
        let start = 0;
        const segments = [];

        sectors.forEach(sector => {
        const end = start + sector.value * progress;

        segments.push(
            `${sector.color} ${start}% ${end}%`
        );

        start = end;
        });

        if (start < 100) {
        segments.push(`#d9d8d2 ${start}% 100%`);
        }

        mypeDonut.style.background =
        `conic-gradient(${segments.join(", ")})`;
    }

    drawMypeDonut(0);

    const donutObserver = new IntersectionObserver(
        (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const duration = reducedMotion ? 0 : 1700;
            const start = performance.now();

            function animateDonut(now) {
            const progress = duration === 0
                ? 1
                : Math.min((now - start) / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);
            drawMypeDonut(eased);

            if (progress < 1) {
                requestAnimationFrame(animateDonut);
            }
            }

            requestAnimationFrame(animateDonut);
            observer.unobserve(entry.target);
        });
        },
        { threshold: 0.25 }
    );

    donutObserver.observe(mypeDonut);
    }


    // 3. APARICIÓN DE LA CADENA ECONÓMICA

    const mypeChain = document.getElementById("mypeChain");

    if (mypeChain) {
    const chainNodes = mypeChain.querySelectorAll(
        ".mype-chain-node"
    );

    chainNodes.forEach((node, index) => {
        node.style.transitionDelay = `${index * 150}ms`;
    });
    }


    // ==================================================
    // SECUENCIA 5 — SIMULACIÓN DE FINANCIAMIENTO
    // ==================================================

    const financeComposition = document.getElementById(
    "financeComposition"
    );

    if (financeComposition) {

    // Datos hipotéticos del ejemplo
    const loanAmount = 10000;
    const annualEffectiveRate = 0.266;
    const months = 12;

    // Conversión de TEA a tasa efectiva mensual
    const monthlyRate =
        Math.pow(1 + annualEffectiveRate, 1 / 12) - 1;

    // Cuota fija de un préstamo amortizable
    const monthlyPayment =
        loanAmount * monthlyRate /
        (1 - Math.pow(1 + monthlyRate, -months));

    const totalPayment = monthlyPayment * months;
    const totalInterest = totalPayment - loanAmount;

    const principalPercentage =
        loanAmount / totalPayment * 100;

    const interestPercentage =
        totalInterest / totalPayment * 100;

    // Formato monetario peruano
    function formatSoles(value) {
        return "S/ " + value.toLocaleString("es-PE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
        });
    }

    function formatPercentage(value) {
        return value.toLocaleString("es-PE", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
        }) + " %";
    }

    // Mostrar resultados
    document.getElementById(
        "financeMonthlyPayment"
    ).textContent = formatSoles(monthlyPayment);

    document.getElementById(
        "financeTotalPayment"
    ).textContent = formatSoles(totalPayment);

    document.getElementById(
        "financeTotalInterest"
    ).textContent = formatSoles(totalInterest);

    document.getElementById(
        "financePrincipalPercent"
    ).textContent = formatPercentage(principalPercentage);

    document.getElementById(
        "financeInterestPercent"
    ).textContent = formatPercentage(interestPercentage);

    // Composición visual del total pagado
    const principalBar = financeComposition.querySelector(
        ".finance-principal-part"
    );

    const interestBar = financeComposition.querySelector(
        ".finance-interest-part"
    );

    const compositionObserver = new IntersectionObserver(
        (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            principalBar.style.width =
            `${principalPercentage}%`;

            interestBar.style.width =
            `${interestPercentage}%`;

            observer.unobserve(entry.target);
        });
        },
        { threshold: 0.35 }
    );

    compositionObserver.observe(financeComposition);
    }



    // ==================================================
    // SECUENCIA 6 — ACTORES ECONÓMICOS Y MERCADO
    // ==================================================

    // Activar la red económica cuando aparece en pantalla.
    animateWhenVisible("#actorsNetwork", element => {
    element.classList.add("animated");
    });

    // Activar las curvas de oferta y demanda.
    animateWhenVisible(".market-chart-panel", element => {
    element.classList.add("animated");
    });

    // Movimiento progresivo de los elementos del ejemplo.
    animateWhenVisible(".market-example-visual", element => {
    const stages = element.querySelectorAll(
        ".market-example-stage"
    );

    stages.forEach((stage, index) => {
        stage.style.transition =
        "opacity .7s ease, transform .7s ease";

        stage.style.transitionDelay = `${index * 400}ms`;
    });

    element.classList.add("animated");
    });



    
    // ==================================================
    // SECUENCIA 7 — ECONOMÍA FAMILIAR
    // ==================================================

    // 1. INDICADORES DE INCLUSIÓN FINANCIERA

    animateWhenVisible("#householdInclusion", element => {
    const bars = element.querySelectorAll(".household-stat-fill");

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    bars.forEach((bar, index) => {
        const value = Number(
        bar.style.getPropertyValue("--share")
        );

        if (reducedMotion) {
        bar.style.transition = "none";
        } else {
        bar.style.transitionDelay = `${index * 180}ms`;
        }

        bar.style.width = `${value}%`;
    });
    });


    // 2. GRÁFICO CIRCULAR DEL PRESUPUESTO

    const familyBudgetDonut = document.getElementById(
    "familyBudgetDonut"
    );

    if (familyBudgetDonut) {

    const budgetCategories = [
        { name: "Alimentación", amount: 850, color: "#c8a66d" },
        { name: "Vivienda y servicios", amount: 700, color: "#5d829a" },
        { name: "Transporte", amount: 350, color: "#6e9d80" },
        { name: "Educación y salud", amount: 400, color: "#b65c5a" },
        { name: "Ahorro", amount: 200, color: "#a49b8b" }
    ];

    const totalBudget = budgetCategories.reduce(
        (sum, category) => sum + category.amount,
        0
    );

    function drawFamilyBudget(progress) {
        const completed = totalBudget * progress;

        let accumulated = 0;
        const segments = [];

        budgetCategories.forEach(category => {
        const start = accumulated;
        const end = accumulated + category.amount;

        const visibleEnd = Math.min(
            end,
            Math.max(start, completed)
        );

        if (visibleEnd > start) {
            segments.push(
            `${category.color} ${start / totalBudget * 100}% ` +
            `${visibleEnd / totalBudget * 100}%`
            );
        }

        accumulated = end;
        });

        const remainingStart = progress * 100;

        if (remainingStart < 100) {
        segments.push(
            `#dedbd2 ${remainingStart}% 100%`
        );
        }

        familyBudgetDonut.style.background =
        `conic-gradient(${segments.join(", ")})`;
    }

    drawFamilyBudget(0);

    const familyBudgetObserver = new IntersectionObserver(
        (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const reducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
            ).matches;

            const duration = reducedMotion ? 0 : 1800;
            const startTime = performance.now();

            function animateFamilyBudget(now) {
            const progress = duration === 0
                ? 1
                : Math.min((now - startTime) / duration, 1);

            const eased = 1 - Math.pow(1 - progress, 3);

            drawFamilyBudget(eased);

            if (progress < 1) {
                requestAnimationFrame(animateFamilyBudget);
            }
            }

            requestAnimationFrame(animateFamilyBudget);
            observer.unobserve(entry.target);
        });
        },
        { threshold: 0.25 }
    );

    familyBudgetObserver.observe(familyBudgetDonut);
    }


    // 3. APARICIÓN DEL EJEMPLO DE PODER ADQUISITIVO

    animateWhenVisible(".purchasing-comparison", element => {
    const products = element.querySelectorAll(
        ".purchasing-products span"
    );

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    products.forEach((product, index) => {
        if (reducedMotion) {
        product.style.opacity = "1";
        product.style.transform = "scale(1)";
        return;
        }

        product.animate(
        [
            { opacity: 0, transform: "scale(.4)" },
            { opacity: 1, transform: "scale(1)" }
        ],
        {
            duration: 450,
            delay: index * 65,
            easing: "ease-out",
            fill: "both"
        }
        );
    });
    });


    
    // ==================================================
    // SECUENCIA 8 — ECONOMÍA GLOBAL
    // ==================================================

    // 1. CONEXIONES INTERNACIONALES

    animateWhenVisible("#globalNetwork", element => {
    element.classList.add("animated");
    });


    // 2. COMPOSICIÓN DE EXPORTACIONES

    const globalExportBar = document.getElementById(
    "globalExportBar"
    );

    if (globalExportBar) {
    const miningPart = globalExportBar.querySelector(
        ".global-export-mining"
    );

    const otherPart = globalExportBar.querySelector(
        ".global-export-other"
    );

    const exportObserver = new IntersectionObserver(
        (entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            miningPart.style.width = "72.7%";
            otherPart.style.width = "27.3%";

            observer.unobserve(entry.target);
        });
        },
        { threshold: 0.3 }
    );

    exportObserver.observe(globalExportBar);
    }


    // 3. SUAVE MOVIMIENTO DE LA IMAGEN FINAL

    const verFinale = document.getElementById("verFinale");

    if (verFinale) {
    const finaleImage = verFinale.querySelector(
        ".ver-finale-image"
    );

    const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    if (!reducedMotion && finaleImage) {
        const finaleObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            finaleImage.animate(
                [
                { transform: "scale(1.08)" },
                { transform: "scale(1)" }
                ],
                {
                duration: 6000,
                easing: "ease-out",
                fill: "forwards"
                }
            );

            observer.unobserve(entry.target);
            });
        },
        { threshold: 0.15 }
        );

        finaleObserver.observe(verFinale);
    }
    }

});
