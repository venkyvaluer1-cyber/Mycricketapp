let match = {
    t1: "", t2: "", overs: 5, runs: 0, wickets: 0, balls: 0,
    striker: null, nonStriker: null, bowler: null,
    thisOver: [], battersHistory: [], bowlersHistory: [],
    innings: 1, target: null, isGameOver: false, firstInningsData: null,
    wideValue: 0, 
    nbValue: 0
};

let historyStack = [];

// --- INITIALIZATION (START MATCH CLICK) ---
function startLiveMatch() {
    // 1. Inputs nundi data collect cheyadam
    match.t1 = document.getElementById('t1Name').value || "Team 1";
    match.t2 = document.getElementById('t2Name').value || "Team 2";
    match.overs = parseInt(document.getElementById('matchOvers').value) || 5;
    
    // Wide mariyu No-ball settings values capture chesthunnam
    match.wideValue = parseInt(document.getElementById('wideRuns').value) || 0;
    match.nbValue = parseInt(document.getElementById('nbRuns').value) || 0;
    
    // Players data
    match.striker = { name: document.getElementById('initStriker').value || "S1", r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.nonStriker = { name: document.getElementById('initNonStriker').value || "S2", r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.bowler = { name: document.getElementById('initBowler').value || "B1", o_balls:0, r:0, w:0 };
    
    // --- SCREEN SWITCHING LOGIC (NEXT PAGE FEEL) ---
    // Setup screen ni hide chesthunnam
    const setupScreen = document.getElementById('setup-screen');
    setupScreen.classList.remove('active');
    setupScreen.style.display = 'none'; 
    
    // Main match screen ni display chesthunnam
    const mainScreen = document.getElementById('main-screen');
    mainScreen.classList.add('active');
    mainScreen.style.display = 'block';

    // UI update cheyadam
    document.getElementById('battingTeamText').innerText = match.t1;
    updateUI();
}

// --- CORE UI UPDATE ---
function updateUI() {
    document.getElementById('mainRuns').innerText = match.runs;
    document.getElementById('mainWkts').innerText = match.wickets;
    document.getElementById('mainOvers').innerText = `${Math.floor(match.balls/6)}.${match.balls%6}`;
    
    if(match.innings === 2) {
        document.getElementById('first-innings-mini-info').style.display = 'flex';
        document.getElementById('first-innings-mini-info').innerHTML = `<span>1st Inn: ${match.firstInningsData.runs}/${match.firstInningsData.wickets}</span> <span>Target: ${match.target}</span>`;
        let left = (match.overs * 6) - match.balls;
        document.getElementById('targetDisplay').innerText = `Need ${match.target - match.runs} in ${left} balls`;
    }

    document.getElementById('thisOverBalls').innerHTML = match.thisOver.map(b => `<div class="ball-circle">${b}</div>`).join('');
    
    updateBatterDisplay('ls', match.striker);
    updateBatterDisplay('lns', match.nonStriker);

    document.getElementById('lbName').innerText = match.bowler.name;
    document.getElementById('lbO').innerText = `${Math.floor(match.bowler.o_balls/6)}.${match.bowler.o_balls%6}`;
    document.getElementById('lbR').innerText = match.bowler.r;
    document.getElementById('lbW').innerText = match.bowler.w;
}

function updateBatterDisplay(prefix, p) {
    document.getElementById(prefix + 'Name').innerText = p.name;
    document.getElementById(prefix + 'R').innerText = p.r;
    document.getElementById(prefix + 'B').innerText = p.b;
    document.getElementById(prefix + '4').innerText = p.fours;
    document.getElementById(prefix + '6').innerText = p.sixes;
    let sr = p.b > 0 ? ((p.r / p.b) * 100).toFixed(1) : "0.0";
    document.getElementById(prefix + 'SR').innerText = sr;
}

// --- SCORING LOGIC ---
function addRun(r) {
    if(match.isGameOver) return;
    saveState();
    match.runs += r; 
    match.striker.r += r; 
    match.striker.b++;
    if(r===4) match.striker.fours++; 
    if(r===6) match.striker.sixes++;
    
    match.balls++; 
    match.bowler.r += r; 
    match.bowler.o_balls++;
    match.thisOver.push(r);
    
    if(r % 2 !== 0) swapStrike();
    checkMatchStatus(); checkOverEnd(); updateUI();
}

function addExtra(type) {
    if(match.isGameOver) return;
    saveState();
    
    // Wide or No Ball choice base cheskuni runs add avthayi
    let extraRuns = (type === 'WD') ? match.wideValue : match.nbValue;
    
    match.runs += extraRuns; 
    match.bowler.r += extraRuns;
    match.thisOver.push(type);
    
    checkMatchStatus(); 
    updateUI();
}

function swapStrike() { 
    let t = match.striker; 
    match.striker = match.nonStriker; 
    match.nonStriker = t; 
    updateUI(); 
}

// --- OVER & BOWLER MANAGEMENT ---
function checkOverEnd() {
    if(!match.isGameOver && match.balls > 0 && match.balls % 6 === 0) {
        setTimeout(openBowlerSelectModal, 600);
    }
}

function openBowlerSelectModal() {
    let div = document.getElementById('existing-bowlers-list'); div.innerHTML = "";
    let names = [...new Set([...match.bowlersHistory.map(b=>b.name), match.bowler.name])];
    
    names.forEach(n => {
        let btn = document.createElement('button'); 
        btn.innerText = n; btn.className = "primary-btn";
        btn.style.background = "#eceff1"; btn.style.color = "#333";
        btn.onclick = () => {
            match.bowlersHistory.push(JSON.parse(JSON.stringify(match.bowler)));
            let ex = match.bowlersHistory.find(bh => bh.name === n);
            match.bowler = JSON.parse(JSON.stringify(ex));
            match.bowlersHistory = match.bowlersHistory.filter(bh => bh !== ex);
            closeBowlerModal();
        };
        div.appendChild(btn);
    });
    document.getElementById('bowler-select-modal').style.display = 'block';
}

function submitBowlerModal() {
    let n = document.getElementById('newBowlerName').value; 
    if(!n) return alert("Enter bowler name");
    match.bowlersHistory.push(JSON.parse(JSON.stringify(match.bowler)));
    match.bowler = { name: n, o_balls:0, r:0, w:0 };
    document.getElementById('newBowlerName').value = ""; 
    closeBowlerModal();
}

function closeBowlerModal() {
    match.thisOver = []; 
    swapStrike();
    document.getElementById('bowler-select-modal').style.display = 'none';
    updateUI();
}

// --- WICKET LOGIC ---
function openWicketMenu() { document.getElementById('wicket-select-modal').style.display = 'block'; }
function toggleRunOutFields() {
    let type = document.getElementById('wicketTypeSelect').value;
    document.getElementById('runout-fields').style.display = (type === "Run Out") ? "block" : "none";
}

function submitWicketFinal() {
    let type = document.getElementById('wicketTypeSelect').value;
    let next = document.getElementById('nextBatterName').value;
    if(!next) return alert("Enter next batter");

    saveState(); showWicketAnim();

    if(type === "Run Out") {
        let runs = parseInt(document.getElementById('runsCompleted').value) || 0;
        let who = document.getElementById('whoIsOut').value;
        match.runs += runs;
        let outBatter = (who === 'striker' ? match.striker : match.nonStriker);
        outBatter.out = true; outBatter.r += runs; outBatter.dismissal = `Run Out (${document.getElementById('fielderName').value})`;
        match.battersHistory.push(JSON.parse(JSON.stringify(outBatter)));
        if(who === 'striker') match.striker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
        else match.nonStriker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    } else {
        match.striker.out = true; 
        match.striker.dismissal = `${type} b ${match.bowler.name}`;
        match.battersHistory.push(JSON.parse(JSON.stringify(match.striker)));
        match.striker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
        match.bowler.w++;
    }
    match.balls++; match.bowler.o_balls++; match.wickets++; match.thisOver.push("W");
    closeModal('wicket-select-modal'); checkMatchStatus(); checkOverEnd(); updateUI();
}

function showWicketAnim() {
    document.getElementById('wicket-overlay').style.display = 'flex';
    setTimeout(()=> { document.getElementById('wicket-overlay').style.display = 'none'; }, 1500);
}

// --- INNINGS & SCOREBOARD ---
function checkMatchStatus() {
    if(match.innings === 2 && match.runs >= match.target) {
        match.isGameOver = true; alert("Match Over! " + match.t1 + " WON! 🏆");
    } else if(match.balls >= (match.overs * 6) || match.wickets >= 10) {
        if(match.innings === 1) {
            match.firstInningsData = {
                team: match.t1, runs: match.runs, wickets: match.wickets, balls: match.balls,
                batters: [...match.battersHistory, match.striker, match.nonStriker],
                bowlers: [...match.bowlersHistory, match.bowler]
            };
            match.target = match.runs + 1;
            alert("1st Innings Over! Target: " + match.target);
            setupSecondInnings();
        } else {
            match.isGameOver = true; 
            let msg = match.runs >= (match.target-1) ? "Match Tied!" : "Bowling Team Won!";
            alert(msg);
        }
    }
}

function setupSecondInnings() {
    let t2 = match.t2; match.t2 = match.t1; match.t1 = t2;
    match.runs = 0; match.wickets = 0; match.balls = 0; match.innings = 2;
    match.thisOver = []; match.battersHistory = []; match.bowlersHistory = [];
    match.striker = { name: prompt("Striker Name:"), r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.nonStriker = { name: prompt("Non-Striker Name:"), r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.bowler = { name: prompt("Opening Bowler:"), o_balls:0, r:0, w:0 };
    document.getElementById('battingTeamText').innerText = match.t1;
    updateUI();
}

function renderScoreboard() {
    let sb = document.getElementById('full-scoreboard');
    sb.innerHTML = "";
    if(match.firstInningsData) sb.innerHTML += createImprovedCard(match.firstInningsData, "1st Innings");
    
    let current = {
        team: match.t1, runs: match.runs, wickets: match.wickets, balls: match.balls,
        batters: [...match.battersHistory, match.striker, match.nonStriker],
        bowlers: [...match.bowlersHistory, match.bowler]
    };
    sb.innerHTML += createImprovedCard(current, match.innings === 1 ? "In Progress" : "2nd Innings");
}

function createImprovedCard(data, status) {
    let ov = `${Math.floor(data.balls/6)}.${data.balls%6}`;
    let h = `<div class="sb-card">
        <div class="sb-header-main">
            <div><h4>${data.team}</h4><small>${status}</small></div>
            <div style="text-align:right"><span style="font-size:1.5rem; font-weight:800">${data.runs}/${data.wickets}</span><br><small>(${ov} Ov)</small></div>
        </div>
        <div class="sb-section-title">BATTING</div>
        <div class="sb-grid-row" style="font-weight:bold; color:#777; font-size:0.7rem"><span>BATSMAN</span><span>R</span><span>B</span><span>4s/6s</span><span>SR</span></div>`;
    
    data.batters.forEach(p => {
        if(!p || !p.name) return;
        let sr = p.b > 0 ? ((p.r / p.b) * 100).toFixed(1) : "0.0";
        h += `<div class="sb-grid-row">
            <span><b>${p.name}${!p.out?'*':''}</b><span class="out-desc">${p.out?p.dismissal:'not out'}</span></span>
            <span class="bold-val">${p.r}</span><span>${p.b}</span><span>${p.fours}/${p.sixes}</span><span>${sr}</span>
        </div>`;
    });

    h += `<div class="total-row"><span>TOTAL</span><span>${data.runs}/${data.wickets} (${ov})</span></div>
          <div class="sb-section-title" style="background:#455a64; color:white">BOWLING</div>
          <div class="sb-grid-row" style="font-weight:bold; color:#777; font-size:0.7rem"><span>BOWLER</span><span>O</span><span>R</span><span>W</span><span>ECO</span></div>`;

    let bMap = {};
    data.bowlers.forEach(b => {
        if(!bMap[b.name]) bMap[b.name] = {o:0, r:0, w:0};
        bMap[b.name].o += b.o_balls; bMap[b.name].r += b.r; bMap[b.name].w += b.w;
    });

    for(let name in bMap) {
        let b = bMap[name];
        let eco = b.o > 0 ? (b.r / (b.o/6)).toFixed(1) : "0.0";
        h += `<div class="sb-grid-row">
            <span>${name}</span><span>${Math.floor(b.o/6)}.${b.o%6}</span><span>${b.r}</span><span class="bold-val">${b.w}</span><span>${eco}</span>
        </div>`;
    }
    return h + `</div>`;
}

// --- UTILS ---
function switchTab(t) {
    document.querySelectorAll('.tab-link, .tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById('tab-'+t+'-btn').classList.add('active');
    document.getElementById('view-'+t).classList.add('active');
    if(t === 'score') renderScoreboard();
}

function saveState() { historyStack.push(JSON.parse(JSON.stringify(match))); }
function undo() { if(historyStack.length > 0) { match = historyStack.pop(); updateUI(); } }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
