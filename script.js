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
        statusEl.textContent = 'Currently working on \u2192 ' + items.join(' \u00b7 ');
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

function initTerminal() {
    const body = document.getElementById('terminal-content');
    if (!body) return;
    body.innerHTML = '';

    let sequence = (config && config.terminal) ? [...config.terminal] : [...defaultTerminalSequence];

    // Replace __STATUS__ placeholder with live status
    const statusItems = getStatusItems();
    const statusText = 'Currently working on: ' + statusItems.join(' \u00b7 ');
    sequence = sequence.map(item => {
        if (item.text === '__STATUS__') {
            return { ...item, text: statusText };
        }
        return item;
    });

    let seqIndex = 0;

    function typeLine() {
        if (seqIndex >= sequence.length) {
            const cursor = document.createElement('span');
            cursor.className = 'terminal-cursor';
            body.lastElementChild.appendChild(cursor);
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
                    setTimeout(typeLine, 150);
                }
            }, 50);
        } else {
            const output = document.createElement('span');
            output.className = 'terminal-output';
            output.textContent = item.text;
            line.appendChild(output);
            body.appendChild(line);
            seqIndex++;
            setTimeout(typeLine, 400);
        }
    }

    setTimeout(typeLine, 800);
}

/* ========== DYNAMIC PROJECTS ========== */

// Repos to hide (profile repo, this portfolio, etc.)
const HIDDEN_REPOS = ['youcefffj', 'my_resume_cv', 'candr-ecommerce', 'agora', 'alim-care', 'crypto-courbe-api', 'nft', 'selfmade', 'windowserverexolab4'];

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

            grid.appendChild(buildCard({
                title: (override && override.title) || repo.name,
                desc: (override && override.desc) || repo.description || '',
                tags: tags,
                badge: override ? override.badge : null,
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

            grid.appendChild(buildCard({
                title: project.title,
                desc: project.desc,
                tags: project.tags || [],
                badge: project.badge,
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
        about_title: 'A propos',
        about_text: "Ingenieur diplome de l'ECE Paris, specialise en cybersecurite et intelligence artificielle. Deux ans d'experience chez BNP Paribas en securite des donnees, gouvernance et lutte anti-fraude. Passionne par la creation de systemes intelligents et securises.",
        exp_title: 'Experience',
        projects_title: 'Projets',
        cv_title: 'Curriculum Vitae',
        contact_title: 'Contact',
        cv_open: 'Ouvrir le CV en plein ecran',
        scroll_cta: 'Explorer',
    },
    en: {
        about_title: 'About',
        about_text: 'Engineer graduated from ECE Paris, specialized in cybersecurity and artificial intelligence. Two years of experience at BNP Paribas in data security, governance, and anti-fraud. Passionate about building intelligent and secure systems.',
        exp_title: 'Experience',
        projects_title: 'Projects',
        cv_title: 'Resume',
        contact_title: 'Contact',
        cv_open: 'Open resume fullscreen',
        scroll_cta: 'Explore',
    }
};

let currentLang = 'en';

function switchLang(lang) {
    currentLang = lang;
    const t = translations[lang];

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (t[key]) el.textContent = t[key];
    });

    document.querySelectorAll('.lang-switch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    const targetTab = document.querySelector('.cv-tab[data-lang="' + lang + '"]');
    if (targetTab) targetTab.click();
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
            : 'Last played \u00b7 ' + track.artist['#text'];

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
