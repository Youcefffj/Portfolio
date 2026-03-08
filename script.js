/* ========== CONFIG & GITHUB DATA ========== */
let config = null;
let githubRepos = [];

const FALLBACK_CONFIG = {
    github_username: 'Youcefffj',
    status: { auto: true, fallback: ['Stardust', 'LexIA v2'] },
    terminal: [
        { type: 'command', text: 'whoami' },
        { type: 'output', text: 'Youcef Yaich \u2014 Cybersecurity Engineer & AI Enthusiast' },
        { type: 'command', text: 'skills --list' },
        { type: 'output', text: '[ Cybersecurity \u00b7 Data Security \u00b7 LLM Security \u00b7 AI/ML \u00b7 DevOps \u00b7 Full-Stack ]' },
        { type: 'command', text: 'status' },
        { type: 'output', text: '__STATUS__' }
    ],
    projects: [
        {
            title: 'Stardust \u2014 Social Deduction Game',
            desc: 'Social deduction game inspired by Blood on the Clocktower with proximity voice chat, built on Source 2.',
            tags: ['C#', 's&box', 'Source 2'],
            badge: { text: 'In Development', type: 'wip' },
            repo: '', pinned: true
        },
        {
            title: 'IoT \u2014 Automated Aquarium',
            desc: 'Embedded system managing temperature, water level, and feeding via sensors and mobile app control.',
            tags: ['Arduino', 'Sensors', 'Mobile App'],
            badge: null, repo: '', pinned: true
        }
    ]
};

async function loadConfig() {
    try {
        const res = await fetch('config.json');
        config = await res.json();
    } catch (e) {
        console.warn('Could not load config.json, using fallback');
        config = FALLBACK_CONFIG;
    }
}

async function fetchGitHubRepos() {
    if (!config || !config.github_username) return;
    try {
        const res = await fetch(
            'https://api.github.com/users/' + encodeURIComponent(config.github_username)
            + '/repos?sort=pushed&per_page=100'
        );
        if (!res.ok) return;
        githubRepos = await res.json();
    } catch (e) {
        console.warn('GitHub API unavailable:', e.message);
    }
}

function findRepo(repoName) {
    if (!repoName || !githubRepos.length) return null;
    return githubRepos.find(r => r.name.toLowerCase() === repoName.toLowerCase()) || null;
}

// Cache for repo languages
const repoLanguages = {};

async function fetchRepoLanguages(owner, repoName) {
    const key = repoName.toLowerCase();
    if (repoLanguages[key]) return repoLanguages[key];
    try {
        const res = await fetch('https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repoName) + '/languages');
        if (!res.ok) return [];
        const data = await res.json();
        repoLanguages[key] = Object.keys(data);
        return repoLanguages[key];
    } catch (e) {
        return [];
    }
}

function timeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now - date) / 1000);
    if (currentLang === 'fr') {
        if (diff < 60) return '\u00e0 l\'instant';
        if (diff < 3600) return 'il y a ' + Math.floor(diff / 60) + ' min';
        if (diff < 86400) return 'il y a ' + Math.floor(diff / 3600) + ' h';
        if (diff < 2592000) return 'il y a ' + Math.floor(diff / 86400) + ' j';
        if (diff < 31536000) return 'il y a ' + Math.floor(diff / 2592000) + ' mois';
        return 'il y a ' + Math.floor(diff / 31536000) + ' an(s)';
    }
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
    if (diff < 31536000) return Math.floor(diff / 2592000) + 'mo ago';
    return Math.floor(diff / 31536000) + 'y ago';
}

/* ========== DYNAMIC STATUS ========== */
function getStatusItems() {
    if (!config || !config.status) return ['Stardust', 'LexIA v2'];

    const fixed = config.status.fixed || [];

    // Auto mode: pick the 2 most recently pushed repos + fixed items
    if (config.status.auto && githubRepos.length > 0) {
        const recent = githubRepos
            .filter(r => !r.fork && !HIDDEN_REPOS.includes(r.name.toLowerCase()))
            .slice(0, 2)
            .map(r => r.name);
        if (recent.length > 0) return [...recent, ...fixed];
    }

    return [...(config.status.fallback || []), ...fixed];
}

function initStatus() {
    const statusEl = document.getElementById('hero-status-text');
    if (!statusEl) return;

    const items = getStatusItems();
    if (items.length > 0) {
        const prefix = currentLang === 'fr' ? 'Travaille actuellement sur' : 'Currently working on';
        statusEl.textContent = prefix + ' \u2192 ' + items.join(' \u00b7 ');
    }
}

/* ========== TERMINAL TYPING ANIMATION ========== */
const defaultTerminalSequence = [
    { type: 'command', text: 'whoami' },
    { type: 'output', text: 'Youcef Yaich \u2014 Cybersecurity Engineer & AI Builder' },
    { type: 'command', text: 'skills --list' },
    { type: 'output', text: '[ Cybersecurity \u00b7 AI/ML \u00b7 DevOps \u00b7 Full-Stack ]' },
    { type: 'command', text: 'status' },
    { type: 'output', text: 'Currently working on: Stardust \u00b7 LexIA v2' },
];

// Track all active terminal timers so we can kill them on re-init
let terminalTimers = [];

function clearTerminalTimers() {
    terminalTimers.forEach(id => {
        clearInterval(id);
        clearTimeout(id);
    });
    terminalTimers = [];
}

function initTerminal() {
    // Kill any running animation before starting a new one
    clearTerminalTimers();

    const body = document.getElementById('terminal-content');
    if (!body) return;
    body.innerHTML = '';

    let sequence;
    if (currentLang === 'fr') {
        sequence = [
            { type: 'command', text: 'whoami' },
            { type: 'output', text: 'Youcef Yaich \u2014 Ing\u00e9nieur Cybers\u00e9curit\u00e9 & Passionn\u00e9 d\'IA' },
            { type: 'command', text: 'skills --list' },
            { type: 'output', text: '[ Cybers\u00e9curit\u00e9 \u00b7 S\u00e9curit\u00e9 des Donn\u00e9es \u00b7 S\u00e9curit\u00e9 LLM \u00b7 IA/ML \u00b7 DevOps \u00b7 Full-Stack ]' },
            { type: 'command', text: 'status' },
            { type: 'output', text: '__STATUS__' }
        ];
    } else {
        sequence = (config && config.terminal) ? [...config.terminal] : [...defaultTerminalSequence];
    }

    // Replace __STATUS__ placeholder with live status
    const statusItems = getStatusItems();
    const statusPrefix = currentLang === 'fr' ? 'Travaille actuellement sur : ' : 'Currently working on: ';
    const statusText = statusPrefix + statusItems.join(' \u00b7 ');
    sequence = sequence.map(item => {
        if (item.text === '__STATUS__') {
            return { ...item, text: statusText };
        }
        return item;
    });

    let seqIndex = 0;

    function typeLine() {
        if (seqIndex >= sequence.length) {
            if (body.lastElementChild) {
                const cursor = document.createElement('span');
                cursor.className = 'terminal-cursor';
                body.lastElementChild.appendChild(cursor);
            }
            return;
        }

        const item = sequence[seqIndex];
        const line = document.createElement('div');
        line.className = 'terminal-line';

        if (item.type === 'command') {
            const prompt = document.createElement('span');
            prompt.className = 'terminal-prompt';
            prompt.textContent = '> ';
            line.appendChild(prompt);

            const cmd = document.createElement('span');
            cmd.className = 'terminal-command';
            line.appendChild(cmd);
            body.appendChild(line);

            let charIndex = 0;
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            line.appendChild(cursor);

            const typeChar = setInterval(() => {
                cmd.textContent += item.text[charIndex];
                charIndex++;
                if (charIndex >= item.text.length) {
                    clearInterval(typeChar);
                    cursor.remove();
                    seqIndex++;
                    const t = setTimeout(typeLine, 150);
                    terminalTimers.push(t);
                }
            }, 50);
            terminalTimers.push(typeChar);
        } else {
            const output = document.createElement('span');
            output.className = 'terminal-output';
            line.appendChild(output);
            body.appendChild(line);

            let charIndex = 0;
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            line.appendChild(cursor);

            const typeChar = setInterval(() => {
                output.textContent += item.text[charIndex];
                charIndex++;
                if (charIndex >= item.text.length) {
                    clearInterval(typeChar);
                    cursor.remove();
                    seqIndex++;
                    const t = setTimeout(typeLine, 150);
                    terminalTimers.push(t);
                }
            }, 20);
            terminalTimers.push(typeChar);
        }
    }

    const startTimer = setTimeout(typeLine, 800);
    terminalTimers.push(startTimer);
}

/* ========== DYNAMIC PROJECTS ========== */

// Repos to hide (profile repo, this portfolio, etc.)
const HIDDEN_REPOS = ['youcefffj', 'Portfolio', 'candr-ecommerce', 'agora', 'alim-care', 'crypto-courbe-api', 'nft', 'selfmade', 'windowserverexolab4'];

function getOverride(repoName) {
    if (!config || !config.projects) return null;
    return config.projects.find(p =>
        p.repo && p.repo.toLowerCase() === repoName.toLowerCase()
    ) || null;
}

function buildCard(options) {
    const card = document.createElement('div');
    card.className = 'project-card fade-in';

    let badgeHtml = '';
    if (options.badge) {
        const cls = options.badge.type === 'hackathon' ? 'badge-hackathon' : 'badge-wip';
        badgeHtml = '<span class="project-badge ' + cls + '">' + options.badge.text + '</span>';
    }

    const tagsHtml = (options.tags || []).map(t => '<span class="project-tag">' + t + '</span>').join('');

    let statsHtml = '';
    if (options.stats) {
        const parts = [];
        if (options.stats.stars > 0) parts.push('<span class="project-stat">\u2605 ' + options.stats.stars + '</span>');
        if (options.stats.forks > 0) parts.push('<span class="project-stat">\u2442 ' + options.stats.forks + '</span>');
        if (options.stats.updated) parts.push('<span class="project-stat">' + timeAgo(options.stats.updated) + '</span>');
        if (parts.length) statsHtml = '<div class="project-stats">' + parts.join('') + '</div>';
    }

    const linkHtml = options.url
        ? '<a href="' + options.url + '" class="project-link" target="_blank" rel="noopener">GitHub</a>'
        : '';

    card.innerHTML =
        '<div class="project-card-header">'
        + '<div class="project-title">' + options.title + '</div>'
        + badgeHtml
        + '</div>'
        + '<p class="project-desc">' + (options.desc || '') + '</p>'
        + '<div class="project-tags">' + tagsHtml + '</div>'
        + statsHtml
        + '<div class="project-links">' + linkHtml + '</div>';

    return card;
}

async function renderProjects() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const rendered = new Set();
    const owner = config ? config.github_username : 'Youcefffj';
    const isFr = currentLang === 'fr';

    // 1) GitHub repos — 4 most recently pushed, enriched with config overrides
    if (githubRepos.length > 0) {
        const repos = githubRepos.filter(r =>
            !r.fork && !HIDDEN_REPOS.includes(r.name.toLowerCase())
        ).slice(0, 4);

        // Fetch all languages in parallel
        const langResults = await Promise.all(
            repos.map(r => fetchRepoLanguages(owner, r.name))
        );

        repos.forEach((repo, i) => {
            const override = getOverride(repo.name);
            rendered.add(repo.name.toLowerCase());

            // Use override tags, or all languages from API
            let tags;
            if (override && override.tags && override.tags.length) {
                tags = override.tags;
            } else {
                tags = langResults[i].length > 0 ? langResults[i] : (repo.language ? [repo.language] : []);
            }

            const title = override
                ? (isFr && override.title_fr ? override.title_fr : override.title)
                : repo.name;
            const desc = override
                ? (isFr && override.desc_fr ? override.desc_fr : override.desc)
                : (repo.description || '');
            const badge = override && override.badge
                ? { text: isFr && override.badge.text_fr ? override.badge.text_fr : override.badge.text, type: override.badge.type }
                : null;

            grid.appendChild(buildCard({
                title: title || repo.name,
                desc: desc,
                tags: tags,
                badge: badge,
                url: repo.html_url,
                stats: { stars: repo.stargazers_count, forks: repo.forks_count, updated: repo.pushed_at }
            }));
        });
    }

    // 2) Pinned config projects that aren't on GitHub yet (no matching repo found)
    if (config && config.projects) {
        config.projects.forEach(project => {
            // Skip if already rendered from GitHub
            if (project.repo && rendered.has(project.repo.toLowerCase())) return;

            const title = isFr && project.title_fr ? project.title_fr : project.title;
            const desc = isFr && project.desc_fr ? project.desc_fr : project.desc;
            const badge = project.badge
                ? { text: isFr && project.badge.text_fr ? project.badge.text_fr : project.badge.text, type: project.badge.type }
                : null;

            grid.appendChild(buildCard({
                title: title,
                desc: desc,
                tags: project.tags || [],
                badge: badge,
                url: project.repo ? ('https://github.com/' + config.github_username + '/' + project.repo) : '',
                stats: null
            }));
        });
    }

    initScrollAnimations();
}

/* ========== MATRIX RAIN ========== */
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:<>?/~';
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = new Array(columns).fill(1);

    function draw() {
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00f0ff';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    setInterval(draw, 60);

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

/* ========== SCROLL FADE-IN ========== */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in:not(.visible)').forEach(el => observer.observe(el));
}

/* ========== CV VIEWER TABS ========== */
function initCVViewer() {
    const tabs = document.querySelectorAll('.cv-tab');
    const iframe = document.getElementById('cv-iframe');
    if (!tabs.length || !iframe) return;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            iframe.src = tab.dataset.src;
        });
    });
}

/* ========== LANGUAGE SWITCHER ========== */
const translations = {
    fr: {
        // Nav
        nav_about: '\u00c0 propos',
        nav_experience: 'Exp\u00e9rience',
        nav_projects: 'Projets',
        nav_cv: 'CV',
        nav_contact: 'Contact',

        // Hero
        scroll_cta: 'Explorer',

        // About
        about_title: '\u00c0 propos',
        about_text: "Ing\u00e9nieur dipl\u00f4m\u00e9 de l'ECE Paris, sp\u00e9cialis\u00e9 en cybers\u00e9curit\u00e9 et intelligence artificielle. Deux ans d'exp\u00e9rience chez BNP Paribas en s\u00e9curit\u00e9 des donn\u00e9es, gouvernance et lutte anti-fraude. Passionn\u00e9 par la cr\u00e9ation de syst\u00e8mes intelligents et s\u00e9curis\u00e9s.",

        // Experience
        exp_title: 'Exp\u00e9rience',
        exp1_date: '2024 \u2014 2026',
        exp1_company: 'BNP Paribas',
        exp1_role: 'S\u00e9curit\u00e9 des Donn\u00e9es & Gouvernance',
        exp1_d1: "D\u00e9veloppement d'outils Python pour d\u00e9tecter automatiquement les secrets expos\u00e9s sur Confluence, appuy\u00e9 par un mod\u00e8le IA propri\u00e9taire pour valider les r\u00e9sultats et r\u00e9duire les faux positifs",
        exp1_d2: 'Automatisation des scans Guardium Discovery et cr\u00e9ation de tableaux de bord PowerBI pour le reporting RSSI via Varonis',
        exp1_d3: "Application du principe du moindre privil\u00e8ge sur les partages r\u00e9seau, migration de l'authentification GUI vers WebSSO et patch du noyau RHEL via Ansible",

        exp2_date: 'Mai \u2014 Ao\u00fbt 2024',
        exp2_company: 'Shush Technologies \u00b7 Cor\u00e9e du Sud',
        exp2_role: 'Stagiaire DevOps',
        exp2_d1: 'D\u00e9veloppement et d\u00e9ploiement de web scrapers JavaScript avec Puppeteer, achemin\u00e9s via RabbitMQ pour la collecte de donn\u00e9es \u00e0 grande \u00e9chelle',
        exp2_d2: "D\u00e9veloppement d'un syst\u00e8me OCR aliment\u00e9 par l'IA en Python (Tesseract, PyMuPDF, PIL), int\u00e9gr\u00e9 \u00e0 Django et d\u00e9ploy\u00e9 sur AWS S3 + DynamoDB",
        exp2_d3: "Conception d'un pipeline de donn\u00e9es complet du crawling au parsing structur\u00e9 et livraison d'une extension Chrome am\u00e9liorant l'interactivit\u00e9 de l'application",

        exp3_date: '2023 \u2014 2024',
        exp3_company: 'BNP Paribas',
        exp3_role: 'Analyste Fraude Digitale & Phishing',
        exp3_d1: 'Surveillance du typosquatting, neutralisation de domaines frauduleux et exploitation de HoneyPots pour la capture de menaces',
        exp3_d2: "Recherche approfondie en threat intelligence sur les protocoles IPFS, le fingerprinting TLS (JARM/JA3S) et les sc\u00e9narios de SIM Swap",
        exp3_d3: 'Suivi de campagnes de fraude sur Telegram et d\u00e9veloppement de scripts pour extraire les logs de sites frauduleux',

        exp4_date: '2022 \u2014 2023',
        exp4_company: 'Plasmabiotics',
        exp4_role: 'Stagiaire Ing\u00e9nieur R&D',
        exp4_d1: 'Conception de proc\u00e9dures de tests syst\u00e8me et logiciel, analyse des r\u00e9sultats et livraison de correctifs techniques',
        exp4_d2: 'R\u00e9daction de plans de test et de documentation de conformit\u00e9 aux normes r\u00e9glementaires',

        // Projects
        projects_title: 'Projets',

        // CV
        cv_title: 'Curriculum Vitae',
        cv_open: 'Ouvrir le CV en plein \u00e9cran',
        cv_mobile: 'Lecteur PDF non disponible sur mobile',

        // Contact
        contact_title: 'Contact',

        // Footer
        footer_text: '\u00a9 2026 Youcef Yaich \u00b7 Construit avec HTML/CSS/JS pur',
    },
    en: {
        // Nav
        nav_about: 'About',
        nav_experience: 'Experience',
        nav_projects: 'Projects',
        nav_cv: 'CV',
        nav_contact: 'Contact',

        // Hero
        scroll_cta: 'Explore',

        // About
        about_title: 'About',
        about_text: 'Engineer graduated from ECE Paris, specialized in cybersecurity and artificial intelligence. Two years of experience at BNP Paribas in data security, governance, and anti-fraud. Passionate about building intelligent and secure systems.',

        // Experience
        exp_title: 'Experience',
        exp1_date: '2024 \u2014 2026',
        exp1_company: 'BNP Paribas',
        exp1_role: 'Data Security & Governance',
        exp1_d1: 'Built Python tooling to automatically detect exposed secrets on Confluence, backed by a proprietary AI model to validate findings and cut false positives',
        exp1_d2: 'Automated Guardium Discovery scans and delivered PowerBI dashboards for CISO-level reporting via Varonis',
        exp1_d3: 'Enforced least privilege across network shares, migrated GUI auth to WebSSO, and patched RHEL Kernel via Ansible',

        exp2_date: 'May \u2014 Aug 2024',
        exp2_company: 'Shush Technologies \u00b7 South Korea',
        exp2_role: 'DevOps Intern',
        exp2_d1: 'Built and deployed JavaScript web scrapers with Puppeteer, piped through RabbitMQ for large-scale data collection',
        exp2_d2: 'Developed an AI-powered OCR system in Python (Tesseract, PyMuPDF, PIL), integrated with Django and deployed on AWS S3 + DynamoDB',
        exp2_d3: 'Engineered a full data pipeline from crawling to structured parsing and shipped a Chrome extension improving app interactivity',

        exp3_date: '2023 \u2014 2024',
        exp3_company: 'BNP Paribas',
        exp3_role: 'Digital Fraud & Phishing Analyst',
        exp3_d1: 'Monitored typosquatting, neutralized fraudulent domains and operated HoneyPots for threat capture',
        exp3_d2: 'Conducted deep threat intelligence research on IPFS protocols, TLS fingerprinting (JARM/JA3S) and SIM Swap scenarios',
        exp3_d3: 'Tracked Telegram-based fraud campaigns and built scripts to extract logs from fraudulent sites',

        exp4_date: '2022 \u2014 2023',
        exp4_company: 'Plasmabiotics',
        exp4_role: 'R&D Engineering Intern',
        exp4_d1: 'Designed system and software test procedures, analyzed results and shipped technical fixes',
        exp4_d2: 'Drafted test plans and compliance documentation for regulatory standards',

        // Projects
        projects_title: 'Projects',

        // CV
        cv_title: 'Resume',
        cv_open: 'Open resume fullscreen',
        cv_mobile: 'PDF viewer not available on mobile',

        // Contact
        contact_title: 'Contact',

        // Footer
        footer_text: '\u00a9 2026 Youcef Yaich \u00b7 Built with raw HTML/CSS/JS',
    }
};

let currentLang = 'en';

function switchLang(lang) {
    currentLang = lang;
    const t = translations[lang];

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update page title
    document.title = lang === 'fr'
        ? 'Youcef Yaich | Ing\u00e9nieur Cybers\u00e9curit\u00e9 & Passionn\u00e9 d\'IA'
        : 'Youcef Yaich | Cybersecurity Engineer & AI Enthusiast';

    // Update all data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });

    // Update language buttons
    document.querySelectorAll('.lang-switch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Switch CV tab
    const targetTab = document.querySelector('.cv-tab[data-lang="' + lang + '"]');
    if (targetTab) targetTab.click();

    // Re-init status and terminal with correct language
    initStatus();
    initTerminal();

    // Re-render projects with correct language
    renderProjects();
}

/* ========== NAVBAR HAMBURGER ========== */
function initNav() {
    const hamburger = document.querySelector('.nav-hamburger');
    const links = document.querySelector('.nav-links');
    if (!hamburger || !links) return;

    hamburger.addEventListener('click', () => {
        links.classList.toggle('open');
    });

    links.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
            links.classList.remove('open');
        });
    });
}

/* ========== SPOTIFY NOW PLAYING (last.fm) ========== */
async function fetchNowPlaying() {
    const widget = document.getElementById('spotify-widget');
    if (!widget) return;

    const apiKey = config && config.lastfm ? config.lastfm.api_key : null;
    const user = config && config.lastfm ? config.lastfm.username : null;

    if (!apiKey || !user || apiKey === 'YOUR_LASTFM_API_KEY' || user === 'YOUR_LASTFM_USERNAME') {
        widget.style.display = 'none';
        return;
    }

    try {
        const url = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks'
            + '&user=' + encodeURIComponent(user)
            + '&api_key=' + encodeURIComponent(apiKey)
            + '&format=json&limit=1';

        const res = await fetch(url);
        if (!res.ok) {
            widget.style.display = 'none';
            return;
        }

        const data = await res.json();
        if (!data.recenttracks || !data.recenttracks.track || !data.recenttracks.track.length) {
            widget.style.display = 'none';
            return;
        }

        const track = data.recenttracks.track[0];
        const isPlaying = track['@attr'] && track['@attr'].nowplaying === 'true';

        document.getElementById('spotify-track').textContent = track.name;
        document.getElementById('spotify-artist').textContent = isPlaying
            ? track.artist['#text']
            : (currentLang === 'fr' ? 'Derni\u00e8re \u00e9coute \u00b7 ' : 'Last played \u00b7 ') + track.artist['#text'];

        const bars = document.querySelector('.spotify-bars');
        bars.classList.toggle('paused', !isPlaying);
        widget.style.display = 'flex';
    } catch (e) {
        widget.style.display = 'none';
    }
}

/* ========== GLITCH EFFECT ON SECTION TITLES ========== */
function initGlitch() {
    const titles = document.querySelectorAll('.section-title');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('glitch-active');
                setTimeout(() => entry.target.classList.remove('glitch-active'), 600);
            }
        });
    }, { threshold: 0.5 });

    titles.forEach(t => observer.observe(t));
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', async () => {
    initMatrix();
    initNav();

    await loadConfig();
    await fetchGitHubRepos();

    initStatus();
    initTerminal();
    renderProjects();
    initScrollAnimations();
    initCVViewer();
    initGlitch();
    fetchNowPlaying();
    setInterval(fetchNowPlaying, 30000);
});
