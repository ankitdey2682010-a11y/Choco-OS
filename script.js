const OS = 
{
    activeWindows: {},
    nextZIndex: 100,
    soundEnabled: true,
    coins: 0,
    coinsPerSec: 0,
    roasters: 0,
    grinders: 0,
    notes: [
        { id: 1, title: '🍫 Golden Truffle', content: '70% Dark Cocoa, Heavy Cream, French Butter, Gold Dust Coating.' },
        { id: 2, title: '☕ Caramel Latte Truffle', content: 'Milk Chocolate shell, Salted Caramel center, Espresso swirl.' }
    ],
    matchScore: 0
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playAudioTone(freq = 440, type = 'sine', duration = 0.1) 
{
    if (!OS.soundEnabled) return;
    try 
    {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { console.error(e); }
}

function toggleMute()
{
    OS.soundEnabled = !OS.soundEnabled;
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) {
        btn.innerHTML = OS.soundEnabled ? 
            '<i class="fa-solid fa-volume-high"></i>' : 
            '<i class="fa-solid fa-volume-xmark text-rose-400"></i>';
    }
    if (!OS.soundEnabled && isPlayingLofi) {
        toggleLofiBeat();
    }
}

// LO-FI SYNTH & BEATS ENGINE
let isPlayingLofi = false;
let lofiSynth = null;
let lofiFilter = null;
let lofiRepeatEvent = null;

async function toggleLofiBeat() {
    if (!OS.soundEnabled && !isPlayingLofi) return;

    if (Tone.context.state !== 'running') {
        await Tone.start();
    }

    const playBtn = document.getElementById('lofi-play-btn');
    const disc = document.getElementById('lofi-disc');

    if (isPlayingLofi) {
        Tone.Transport.stop();
        if (lofiRepeatEvent !== null) {
            Tone.Transport.clear(lofiRepeatEvent);
            lofiRepeatEvent = null;
        }
        if (lofiSynth) {
            lofiSynth.dispose();
            lofiSynth = null;
        }
        if (lofiFilter) {
            lofiFilter.dispose();
            lofiFilter = null;
        }
        isPlayingLofi = false;
        if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-play mr-2"></i>Play Lo-Fi Loop';
        if (disc) disc.classList.remove('animate-spin');
        return;
    }

    lofiFilter = new Tone.Filter({
        frequency: 800,
        type: 'lowpass',
        rolloff: -12
    }).toDestination();

    lofiSynth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: {
            attack: 0.2,
            decay: 0.5,
            sustain: 0.6,
            release: 1.2
        }
    }).connect(lofiFilter);
    lofiSynth.volume.value = -6;

    const chords = [
        ['F3', 'A3', 'C4', 'E4'],
        ['E3', 'G3', 'B3', 'D4'],
        ['D3', 'F3', 'A3', 'C4'],
        ['C3', 'E3', 'G3', 'B3']
    ];

    let step = 0;
    lofiRepeatEvent = Tone.Transport.scheduleRepeat((time) => {
        lofiSynth.triggerAttackRelease(chords[step], '2m', time);
        step = (step + 1) % chords.length;
    }, '2m');

    Tone.Transport.bpm.value = 75;
    Tone.Transport.start();
    isPlayingLofi = true;

    if (playBtn) playBtn.innerHTML = '<i class="fa-solid fa-stop mr-2"></i>Stop Lo-Fi Loop';
    if (disc) disc.classList.add('animate-spin');
}

const APPS = 
{
    tycoon: { title: 'Cocoa Craft Tycoon', icon: 'fa-industry', color: 'text-amber-400', width: 480, height: 420 },
    paint: { title: 'Choco Canvas Studio', icon: 'fa-palette', color: 'text-rose-400', width: 540, height: 440 },
    audio: { title: 'Lo-Fi Synth Beats', icon: 'fa-headphones', color: 'text-emerald-400', width: 380, height: 360 },
    match3: { title: 'Choco Swap Match-3', icon: 'fa-shapes', color: 'text-pink-400', width: 420, height: 460 },
    notes: { title: 'Recipes & Notes', icon: 'fa-book-open', color: 'text-yellow-400', width: 460, height: 380 },
    calc: { title: 'Sweet Calculator', icon: 'fa-calculator', color: 'text-orange-300', width: 320, height: 400 },
    terminal: { title: 'Cocoa Shell CLI', icon: 'fa-terminal', color: 'text-cyan-300', width: 480, height: 340 }
};

function openApp(appId) 
{
    playAudioTone(523.25, 'sine', 0.12); 
    const def = APPS[appId];
    if (!def) return;

    if (OS.activeWindows[appId])
    {
        bringToFront(appId);
        closeStartMenu();
        return;
    }

    const win = document.createElement('div');
    win.id = `win-${appId}`;
    win.className = `absolute pointer-events-auto choco-panel rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden`;
    win.style.width = `${def.width}px`;
    win.style.height = `${def.height}px`;
  
    const offset = Object.keys(OS.activeWindows).length * 24;
    win.style.left = `${Math.min(window.innerWidth - def.width - 20, 60 + offset)}px`;
    win.style.top = `${Math.min(window.innerHeight - def.height - 60, 50 + offset)}px`;
    win.style.zIndex = ++OS.nextZIndex;

    win.onmousedown = () => bringToFront(appId);

    win.innerHTML = `
        <div id="header-${appId}" class="h-10 bg-choco-900 border-b border-choco-700/80 px-3 flex items-center justify-between cursor-move select-none">
            <div class="flex items-center gap-2">
                <i class="fa-solid ${def.icon} ${def.color} text-xs"></i>
                <span class="font-display text-xs font-bold text-cream">${def.title}</span>
            </div>
            <div class="flex items-center gap-1.5">
                <button onclick="closeApp('${appId}')" class="w-4 h-4 rounded-full bg-rose-500/80 hover:bg-rose-400 text-[9px] text-choco-950 font-bold flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
        <div id="content-${appId}" class="flex-1 overflow-auto p-4 relative bg-choco-950/70"></div>
    `;

    document.getElementById('window-container').appendChild(win);
    OS.activeWindows[appId] = true;

    makeDraggable(win, document.getElementById(`header-${appId}`));
    renderAppContent(appId);
    addTaskbarTab(appId);
    closeStartMenu();
}

function bringToFront(appId) 
{
    const win = document.getElementById(`win-${appId}`);
    if (win) win.style.zIndex = ++OS.nextZIndex;
}

function closeApp(appId) 
{
    playAudioTone(329.63, 'sine', 0.1);
    if (appId === 'audio' && isPlayingLofi) {
        toggleLofiBeat();
    }
    const win = document.getElementById(`win-${appId}`);
    if (win) win.remove();
    delete OS.activeWindows[appId];
    const tab = document.getElementById(`tab-${appId}`);
    if (tab) tab.remove();
}

function makeDraggable(win, handle) 
{
    let p1 = 0, p2 = 0, p3 = 0, p4 = 0;
    handle.onmousedown = (e) => 
    {
        p3 = e.clientX;
        p4 = e.clientY;
        document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
        document.onmousemove = (e) => {
            p1 = p3 - e.clientX; p2 = p4 - e.clientY;
            p3 = e.clientX; p4 = e.clientY;
            win.style.top = `${Math.max(0, win.offsetTop - p2)}px`;
            win.style.left = `${Math.max(0, win.offsetLeft - p1)}px`;
        };
    };
}

function addTaskbarTab(appId) 
{
    const def = APPS[appId];
    const container = document.getElementById('taskbar-apps');
    const tab = document.createElement('button');
    tab.id = `tab-${appId}`;
    tab.className = `choco-button px-3 py-1 rounded-xl flex items-center gap-2 text-xs font-display`;
    tab.onclick = () => bringToFront(appId);
    tab.innerHTML = `<i class="fa-solid ${def.icon} ${def.color}"></i> <span class="hidden sm:inline">${def.title}</span>`;
    container.appendChild(tab);
}

function toggleStartMenu(e) 
{
    if (e) e.stopPropagation();
    playAudioTone(659.25, 'triangle', 0.08);
    document.getElementById('start-menu').classList.toggle('hidden');
}

function closeStartMenu() 
{
    document.getElementById('start-menu').classList.add('hidden');
}

function renderAppContent(appId) 
{
    const container = document.getElementById(`content-${appId}`);
    if (!container) return;

    if (appId === 'tycoon') 
    {
        container.innerHTML = `
            <div class="flex flex-col h-full justify-between items-center text-center gap-3">
                <div class="choco-panel p-3 rounded-xl border border-amber-500/30 w-full flex justify-around">
                    <div><div class="text-[10px] text-amber-300 font-bold uppercase">Cocoa Coins</div><div id="coin-val" class="text-xl font-mono font-bold text-amber-400">$${OS.coins}</div></div>
                    <div><div class="text-[10px] text-emerald-400 font-bold uppercase">Income Rate</div><div id="rate-val" class="text-xl font-mono font-bold text-emerald-400">+$${OS.coinsPerSec}/s</div></div>
                </div>
                
                <div class="relative group my-2">
                    <button onclick="harvestBean()" class="w-24 h-24 rounded-full bg-gradient-to-br from-amber-600 to-choco-950 border-4 border-amber-400 flex items-center justify-center text-4xl text-amber-300 hover:scale-105 active:scale-95 transition-all shadow-xl">
                        <i class="fa-solid fa-seedling"></i>
                    </button>
                </div>

                <div class="w-full space-y-2">
                    <button onclick="buyRoaster()" class="choco-button w-full py-2 px-3 rounded-xl font-display text-xs text-amber-200 flex justify-between items-center">
                        <span><i class="fa-solid fa-fire text-orange-400 mr-2"></i>Solar Roaster (+$1/s)</span>
                        <span class="font-mono text-amber-300">$15 (Owned: <span id="roaster-cnt">${OS.roasters}</span>)</span>
                    </button>
                    <button onclick="buyGrinder()" class="choco-button w-full py-2 px-3 rounded-xl font-display text-xs text-amber-200 flex justify-between items-center">
                        <span><i class="fa-solid fa-gear text-yellow-400 mr-2"></i>Stone Grinder (+$5/s)</span>
                        <span class="font-mono text-amber-300">$50 (Owned: <span id="grinder-cnt">${OS.grinders}</span>)</span>
                    </button>
                </div>
            </div>
        `;
    }
    else if (appId === 'paint') 
    {
        container.innerHTML = `
            <div class="flex flex-col h-full gap-2">
                <div class="flex gap-2 justify-between items-center bg-choco-900 p-2 rounded-xl border border-choco-700">
                    <div class="flex gap-2">
                        <button onclick="setPaintColor('#210f07')" class="w-6 h-6 rounded-full bg-[#210f07] border-2 border-amber-400 shadow" title="Dark Cocoa"></button>
                        <button onclick="setPaintColor('#854118')" class="w-6 h-6 rounded-full bg-[#854118] border-2 border-amber-400 shadow" title="Milk Chocolate"></button>
                        <button onclick="setPaintColor('#fff9ef')" class="w-6 h-6 rounded-full bg-[#fff9ef] border-2 border-amber-400 shadow" title="White Chocolate"></button>
                        <button onclick="setPaintColor('#d97706')" class="w-6 h-6 rounded-full bg-[#d97706] border-2 border-amber-400 shadow" title="Caramel Drizzle"></button>
                        <button onclick="setPaintColor('#be123c')" class="w-6 h-6 rounded-full bg-[#be123c] border-2 border-amber-400 shadow" title="Ruby Berry"></button>
                    </div>
                    <button onclick="clearCanvas()" class="choco-button px-3 py-1 rounded-lg text-xs font-display text-amber-300">Clear</button>
                </div>
                <canvas id="paint-canvas" class="flex-1 bg-[#34180a] rounded-xl cursor-crosshair w-full border border-choco-700"></canvas>
            </div>
        `;
        setTimeout(initCanvas, 50);
    } 
    else if (appId === 'audio') 
    {
        container.innerHTML = `
            <div class="flex flex-col h-full items-center justify-between gap-4 text-center py-2">
                <div id="lofi-disc" class="w-20 h-20 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-300 text-3xl shadow-xl transition-all ${isPlayingLofi ? 'animate-spin' : ''}">
                    <i class="fa-solid fa-compact-disc"></i>
                </div>
                <div>
                    <div class="font-display text-sm text-emerald-200">Chill Cocoa Beats & Synth</div>
                    <div class="text-[11px] text-amber-300/80 font-mono mt-1">BPM: 75 | Key: C Major</div>
                </div>
                <button id="lofi-play-btn" onclick="toggleLofiBeat()" class="choco-button w-full py-2.5 rounded-xl font-display text-xs text-emerald-300 flex items-center justify-center">
                    <i class="fa-solid ${isPlayingLofi ? 'fa-stop' : 'fa-play'} mr-2"></i>${isPlayingLofi ? 'Stop Lo-Fi Loop' : 'Play Lo-Fi Loop'}
                </button>
                <div class="grid grid-cols-4 gap-2 w-full">
                    <button onclick="playAudioTone(261.63, 'sine', 0.4)" class="choco-button py-2 rounded-xl text-xs font-mono text-emerald-300">C4</button>
                    <button onclick="playAudioTone(329.63, 'sine', 0.4)" class="choco-button py-2 rounded-xl text-xs font-mono text-emerald-300">E4</button>
                    <button onclick="playAudioTone(392.00, 'sine', 0.4)" class="choco-button py-2 rounded-xl text-xs font-mono text-emerald-300">G4</button>
                    <button onclick="playAudioTone(523.25, 'sine', 0.4)" class="choco-button py-2 rounded-xl text-xs font-mono text-emerald-300">C5</button>
                </div>
            </div>
        `;
    }
    else if (appId === 'match3')
    {
        container.innerHTML = `
            <div class="flex flex-col h-full items-center justify-between gap-3">
                <div class="flex justify-between items-center w-full bg-choco-900 p-2 rounded-xl border border-choco-700 font-display text-xs">
                    <span class="text-pink-300">Choco Match Score</span>
                    <span id="match-score" class="font-mono text-amber-300 text-base">${OS.matchScore}</span>
                </div>
                <div id="match-grid" class="grid grid-cols-5 gap-2 bg-choco-900/80 p-3 rounded-2xl border border-pink-500/30"></div>
            </div>
        `;
        setTimeout(initMatchGame, 50);
    } 
    else if (appId === 'notes') 
    {
        container.innerHTML = `
            <div class="space-y-3">
                <div class="font-display text-xs text-amber-300 border-b border-choco-700/60 pb-1 flex justify-between items-center">
                    <span>Confectionery Recipes</span>
                    <i class="fa-solid fa-pen-nib"></i>
                </div>
                ${OS.notes.map(n => `
                    <div class="choco-panel p-3 rounded-xl border border-amber-500/20 text-xs space-y-1">
                        <div class="font-bold text-amber-300 font-display">${n.title}</div>
                        <div class="text-cream/80">${n.content}</div>
                    </div>
                `).join('')}
            </div>
        `;
    } 
    else if (appId === 'calc') 
    {
        container.innerHTML = `
            <div class="flex flex-col h-full justify-between gap-2">
                <div id="calc-out" class="p-3 bg-choco-950 rounded-xl border border-amber-500/30 text-right font-mono text-xl font-bold text-amber-300">0</div>
                <div class="grid grid-cols-4 gap-2 flex-1 font-display text-xs">
                    <button onclick="pressC('C')" class="choco-button rounded-xl text-rose-300">C</button>
                    <button onclick="pressC('/')" class="choco-button rounded-xl text-amber-300">/</button>
                    <button onclick="pressC('*')" class="choco-button rounded-xl text-amber-300">*</button>
                    <button onclick="pressC('-')" class="choco-button rounded-xl text-amber-300">-</button>
                    <button onclick="pressC('7')" class="choco-button rounded-xl">7</button>
                    <button onclick="pressC('8')" class="choco-button rounded-xl">8</button>
                    <button onclick="pressC('9')" class="choco-button rounded-xl">9</button>
                    <button onclick="pressC('+')" class="choco-button rounded-xl text-amber-300">+</button>
                    <button onclick="pressC('4')" class="choco-button rounded-xl">4</button>
                    <button onclick="pressC('5')" class="choco-button rounded-xl">5</button>
                    <button onclick="pressC('6')" class="choco-button rounded-xl">6</button>
                    <button onclick="pressC('=')" class="choco-button rounded-xl bg-amber-600 text-choco-950 font-bold">=</button>
                    <button onclick="pressC('1')" class="choco-button rounded-xl">1</button>
                    <button onclick="pressC('2')" class="choco-button rounded-xl">2</button>
                    <button onclick="pressC('3')" class="choco-button rounded-xl">3</button>
                    <button onclick="pressC('0')" class="col-span-2 choco-button rounded-xl">0</button>
                </div>
            </div>
        `;
    } 
    else if (appId === 'terminal')
    {
        container.innerHTML = `
            <div class="flex flex-col h-full font-mono text-xs text-cyan-300 gap-2">
                <div id="term-out" class="flex-1 overflow-auto bg-choco-950/90 p-3 rounded-xl border border-cyan-500/30 space-y-1">
                    <div>Chocolate OS Shell [v3.0.0]</div>
                    <div>Type <span class="text-yellow-300">'help'</span> for a list of available commands.</div>
                </div>
                <div class="flex gap-2 items-center bg-choco-900 p-2 rounded-xl border border-choco-700">
                    <span class="text-amber-400">$</span>
                    <input id="term-input" onkeydown="handleTerm(event)" type="text" class="bg-transparent text-cream outline-none flex-1 font-mono text-xs" placeholder="enter command...">
                </div>
            </div>
        `;
    }
}

function harvestBean() 
{
    playAudioTone(880, 'sine', 0.05);
    OS.coins += 1;
    updateTycoonUI();
}

function buyRoaster() 
{
    if (OS.coins >= 15) 
    {
        playAudioTone(440, 'triangle', 0.15);
        OS.coins -= 15;
        OS.roasters += 1;
        OS.coinsPerSec += 1;
        updateTycoonUI();
    }
}

function buyGrinder() 
{
    if (OS.coins >= 50) 
    {
        playAudioTone(587.33, 'triangle', 0.15);
        OS.coins -= 50;
        OS.grinders += 1;
        OS.coinsPerSec += 5;
        updateTycoonUI();
    }
}

function updateTycoonUI() 
{
    const c = document.getElementById('coin-val');
    const r = document.getElementById('rate-val');
    const rc = document.getElementById('roaster-cnt');
    const gc = document.getElementById('grinder-cnt');
    if (c) c.innerText = `$${OS.coins}`;
    if (r) r.innerText = `+$${OS.coinsPerSec}/s`;
    if (rc) rc.innerText = OS.roasters;
    if (gc) gc.innerText = OS.grinders;
}

setInterval(() => 
{
    if (OS.coinsPerSec > 0) 
    {
        OS.coins += OS.coinsPerSec;
        updateTycoonUI();
    }
}, 1000);

let activeColor = '#210f07';

function setPaintColor(col) 
{ activeColor = col; }

function initCanvas() 
{
    const canvas = document.getElementById('paint-canvas');
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - 50;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = "#34180a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let drawing = false;
    canvas.onmousedown = () => drawing = true;
    canvas.onmouseup = () => { drawing = false; ctx.beginPath(); };
    canvas.onmousemove = (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.strokeStyle = activeColor;
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };
}

function clearCanvas() {
    const canvas = document.getElementById('paint-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "#34180a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

const MATCH_ICONS = ['🍫', '🍬', '🍩', '🍪', '🧁'];
function initMatchGame() 
{
    const grid = document.getElementById('match-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for (let i = 0; i < 20; i++) 
    {
        const btn = document.createElement('button');
        const icon = MATCH_ICONS[Math.floor(Math.random() * MATCH_ICONS.length)];
        btn.className = 'w-14 h-14 bg-choco-800 rounded-xl text-2xl flex items-center justify-center hover:bg-choco-700 active:scale-90 transition-all border border-pink-500/20';
        btn.innerText = icon;
        btn.onclick = () => 
        {
            playAudioTone(783.99, 'sine', 0.1);
            OS.matchScore += 10;
            document.getElementById('match-score').innerText = OS.matchScore;
            btn.innerText = MATCH_ICONS[Math.floor(Math.random() * MATCH_ICONS.length)];
        };
        grid.appendChild(btn);
    }
}

let calcVal = '0';
function pressC(val) {
    playAudioTone(440, 'sine', 0.05);
    if (val === 'C') calcVal = '0';
    else if (val === '=') {
        try { calcVal = eval(calcVal).toString(); } catch { calcVal = 'Error'; }
    } else {
        calcVal = (calcVal === '0') ? val : calcVal + val;
    }
    const out = document.getElementById('calc-out');
    if (out) out.innerText = calcVal;
}

function handleTerm(e) 
{
    if (e.key === 'Enter')
    {
        const input = e.target.value.trim().toLowerCase();
        const out = document.getElementById('term-out');
        if (!out) return;

        const line = document.createElement('div');
        line.className = 'text-cream';
        line.innerText = `$ ${e.target.value}`;
        out.appendChild(line);

        const res = document.createElement('div');
        res.className = 'text-yellow-300';

        if (input === 'help') {
            res.innerText = "Available commands: help, clear, status, recipe, coins";
        } else if (input === 'status') {
            res.innerText = "System status: ALL SYSTEMS CHOCOLATY. Memory: 100% Sweet.";
        } else if (input === 'recipe') {
            res.innerText = "Secret Ingredient: A dash of sea salt and lots of cocoa butter.";
        } else if (input === 'coins') {
            res.innerText = `Current Cocoa Coins: $${OS.coins}`;
        } else if (input === 'clear') {
            out.innerHTML = '';
            e.target.value = '';
            return;
        } else {
            res.innerText = `Command not recognized: '${input}'. Type 'help'.`;
        }

        out.appendChild(res);
        out.scrollTop = out.scrollHeight;
        e.target.value = '';
    }
}

function updateClock() 
{
    const now = new Date();
    const timeEl = document.getElementById('taskbar-time');
    if (timeEl) timeEl.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

window.onload = () => 
{
    openApp('tycoon');
};