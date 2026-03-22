// --- MATCH STATE ---
let match = {
    t1: "", t2: "", battingTeam: "", bowlingTeam: "",
    overs: 5, runs: 0, wickets: 0, balls: 0,
    striker: null, nonStriker: null, bowler: null,
    thisOver: [], battersHistory: [], bowlersHistory: [],
    innings: 1, target: null, isGameOver: false, firstInningsData: null,
    wideValue: 1, // Default 1 run for Wide
    nbValue: 1,   // Default 1 run for No Ball
    partnershipRuns: 0, partnershipBalls: 0
};

let historyStack = [];

// --- START MATCH ---
function startLiveMatch() {
    let teamA = document.getElementById('t1Name').value || "Team 1";
    let teamB = document.getElementById('t2Name').value || "Team 2";
    let tossWin = document.getElementById('tossWinner').value; 
    let tossChoice = document.getElementById('tossChoice').value;

    if ((tossWin === 't1' && tossChoice === 'Batting') || (tossWin === 't2' && tossChoice === 'Bowling')) {
        match.battingTeam = teamA; match.bowlingTeam = teamB;
    } else {
        match.battingTeam = teamB; match.bowlingTeam = teamA;
    }

    match.t1 = teamA; match.t2 = teamB;
    match.overs = parseInt(document.getElementById('matchOvers').value) || 5;
    
    match.striker = { name: document.getElementById('initStriker').value || "S1", r:0, b:0, fours:0, sixes:0, out:false, dismissal: "" };
    match.nonStriker = { name: document.getElementById('initNonStriker').value || "S2", r:0, b:0, fours:0, sixes:0, out:false, dismissal: "" };
    match.bowler = { name: document.getElementById('initBowler').value || "B1", o_balls:0, r:0, w:0 };
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('main-screen').style.display = 'block';
    document.getElementById('battingTeamText').innerText = match.battingTeam;
    updateUI();
}

// --- CORE UI ---
function updateUI() {
    document.getElementById('mainRuns').innerText = match.runs;
    document.getElementById('mainWkts').innerText = match.wickets;
    document.getElementById('mainOvers').innerText = `${Math.floor(match.balls/6)}.${match.balls%6}`;
    document.getElementById('currentPartnership').innerText = `${match.partnershipRuns} (${match.partnershipBalls})`;
    document.getElementById('thisOverBalls').innerHTML = match.thisOver.map(b => `<div class="ball-circle">${b}</div>`).join('');
    
    updateBatterDisplay('ls', match.striker);
    updateBatterDisplay('lns', match.nonStriker);

    if(match.bowler) {
        document.getElementById('lbName').innerText = match.bowler.name;
        document.getElementById('lbO').innerText = `${Math.floor(match.bowler.o_balls/6)}.${match.bowler.o_balls%6}`;
        document.getElementById('lbR').innerText = match.bowler.r;
        document.getElementById('lbW').innerText = match.bowler.w;
    }
    
    if(match.innings === 2 && match.target) {
        let needs = match.target - match.runs;
        let ballsLeft = (match.overs * 6) - match.balls;
        if (needs <= 0) {
            document.getElementById('targetDisplay').innerText = "Target Achieved!";
            match.isGameOver = true;
            endMatchDisplay();
        } else {
            document.getElementById('targetDisplay').innerText = `Need ${needs} runs in ${ballsLeft} balls`;
        }
    } else {
        document.getElementById('targetDisplay').innerText = "";
    }
}

function updateBatterDisplay(prefix, p) {
    if(!p) return;
    document.getElementById(prefix + 'Name').innerText = p.name + (prefix === 'ls' ? '*' : '');
    document.getElementById(prefix + 'R').innerText = p.r;
    document.getElementById(prefix + 'B').innerText = p.b;
    document.getElementById(prefix + '4').innerText = p.fours;
    document.getElementById(prefix + '6').innerText = p.sixes;
    document.getElementById(prefix + 'SR').innerText = p.b > 0 ? ((p.r / p.b) * 100).toFixed(1) : "0.0";
}

// --- SCORING ---
function addRun(r) {
    if(match.isGameOver) return;
    saveState();
    match.runs += r; match.striker.r += r; match.striker.b++;
    match.partnershipRuns += r; match.partnershipBalls++;
    if(r===4) match.striker.fours++; if(r===6) match.striker.sixes++;
    match.balls++; match.bowler.r += r; match.bowler.o_balls++;
    match.thisOver.push(r);
    if(r % 2 !== 0) swapStrike();
    checkMatchStatus(); checkOverEnd(); updateUI();
}

function openNBModal() { document.getElementById('nb-modal').style.display = 'flex'; }

function submitNB(runsFromBat) {
    saveState();
    let total = match.nbValue + runsFromBat;
    match.runs += total; match.striker.r += runsFromBat; match.striker.b++;
    match.partnershipRuns += total;
    match.bowler.r += total;
    match.thisOver.push(runsFromBat + "nb");
    if(runsFromBat % 2 !== 0) swapStrike();
    closeModal('nb-modal');
    checkMatchStatus(); updateUI();
}

function addExtra(type) {
    saveState();
    if(type === 'WD') {
        match.runs += match.wideValue; match.bowler.r += match.wideValue;
        match.partnershipRuns += match.wideValue;
        match.thisOver.push("Wd");
    }
    checkMatchStatus(); updateUI();
}

// --- WICKET LOGIC ---
function openWicketMenu() { document.getElementById('wicket-select-modal').style.display = 'flex'; }

function toggleRunOutFields() {
    let type = document.getElementById('wicketTypeSelect').value;
    document.getElementById('runout-fields').style.display = (type === "Run Out") ? "block" : "none";
}

function submitWicketFinal() {
    let type = document.getElementById('wicketTypeSelect').value;
    let next = document.getElementById('nextBatterName').value;
    if(!next) return alert("Enter next batter name");

    saveState(); showWicketAnim();

    if(type === "Run Out") {
        let isStriker = document.getElementById('whoIsOut').value === 'striker';
        let outP = isStriker ? match.striker : match.nonStriker;
        outP.out = true; outP.dismissal = "Run Out";
        match.battersHistory.push(JSON.parse(JSON.stringify(outP)));
        if(isStriker) match.striker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
        else match.nonStriker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    } else {
        match.striker.out = true; match.striker.dismissal = `${type} b ${match.bowler.name}`;
        match.battersHistory.push(JSON.parse(JSON.stringify(match.striker)));
        match.striker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
        match.bowler.w++;
    }
    match.balls++; match.bowler.o_balls++; match.wickets++;
    match.thisOver.push("W");
    match.partnershipRuns = 0; match.partnershipBalls = 0;
    closeModal('wicket-select-modal');
    document.getElementById('nextBatterName').value = "";
    checkMatchStatus(); checkOverEnd(); updateUI();
}

// --- BOWLER SELECTION ---
function checkOverEnd() {
    if(!match.isGameOver && match.balls > 0 && match.balls % 6 === 0) {
        let listDiv = document.getElementById('prevBowlersList');
        listDiv.innerHTML = "";
        
        let namesSet = new Set(match.bowlersHistory.map(b => b.name));
        namesSet.add(match.bowler.name);

        namesSet.forEach(name => {
            let btn = document.createElement('button');
            btn.className = "util-btn";
            btn.style.margin = "5px";
            btn.innerText = name;
            btn.onclick = () => { document.getElementById('newBowlerName').value = name; };
            listDiv.appendChild(btn);
        });

        setTimeout(() => { document.getElementById('bowler-select-modal').style.display = 'flex'; }, 600);
    }
}

function submitBowlerModal() {
    let n = document.getElementById('newBowlerName').value.trim();
    if(!n) return alert("Enter bowler name");
    
    let prevIdx = match.bowlersHistory.findIndex(b => b.name.toLowerCase() === match.bowler.name.toLowerCase());
    if(prevIdx > -1) {
        match.bowlersHistory[prevIdx].o_balls += match.bowler.o_balls;
        match.bowlersHistory[prevIdx].r += match.bowler.r;
        match.bowlersHistory[prevIdx].w += match.bowler.w;
    } else {
        match.bowlersHistory.push(JSON.parse(JSON.stringify(match.bowler)));
    }

    let nextIdx = match.bowlersHistory.findIndex(b => b.name.toLowerCase() === n.toLowerCase());
    if(nextIdx > -1) {
        let found = match.bowlersHistory[nextIdx];
        match.bowler = { name: found.name, o_balls: 0, r: 0, w: 0 };
    } else {
        match.bowler = { name: n, o_balls: 0, r: 0, w: 0 };
    }
    
    match.thisOver = [];
    document.getElementById('newBowlerName').value = "";
    swapStrike();
    closeModal('bowler-select-modal'); 
    updateUI();
}

// --- MATCH FLOW ---
function checkMatchStatus() {
    if(match.innings === 2 && match.runs >= match.target) {
        match.isGameOver = true; 
        updateUI(); // "Target Achieved" chupinchadaniki
    } else if(match.balls >= (match.overs * 6) || match.wickets >= 10) {
        if(match.innings === 1) {
            triggerInningsBreak();
        } else {
            match.isGameOver = true;
            endMatchDisplay();
        }
    }
}

function triggerInningsBreak() {
    match.firstInningsData = { 
        team: match.battingTeam, runs: match.runs, wickets: match.wickets, 
        balls: match.balls, 
        batters: [...match.battersHistory, match.striker, match.nonStriker].filter(p => p && (p.b > 0 || p.out)), 
        bowlers: getCombinedBowlersList() 
    };
    match.target = match.runs + 1;
    
    document.getElementById('inningsSummaryText').innerText = `${match.battingTeam}: ${match.runs}/${match.wickets} (${Math.floor(match.balls/6)}.${match.balls%6})`;
    document.getElementById('targetText').innerText = `Target: ${match.target}`;
    document.getElementById('innings-break-modal').style.display = 'flex';
}

function getCombinedBowlersList() {
    let tempHistory = JSON.parse(JSON.stringify(match.bowlersHistory));
    let currentB = JSON.parse(JSON.stringify(match.bowler));
    let existingIdx = tempHistory.findIndex(b => b.name.toLowerCase() === currentB.name.toLowerCase());
    if(existingIdx > -1) {
        tempHistory[existingIdx].o_balls += currentB.o_balls;
        tempHistory[existingIdx].r += currentB.r;
        tempHistory[existingIdx].w += currentB.w;
        return tempHistory;
    } else {
        tempHistory.push(currentB);
        return tempHistory;
    }
}

function manualEndInnings() {
    if (match.innings === 2) return alert("Match is already in 2nd Innings!");
    if (confirm("Are you sure you want to end this innings manually?")) {
        saveState();
        triggerInningsBreak();
    }
}

function setupSecondInnings() {
    let oldBatting = match.battingTeam;
    match.battingTeam = match.bowlingTeam;
    match.bowlingTeam = oldBatting;
    
    match.runs = 0; match.wickets = 0; match.balls = 0; match.innings = 2;
    match.isGameOver = false; match.thisOver = []; match.battersHistory = []; match.bowlersHistory = [];
    match.partnershipRuns = 0; match.partnershipBalls = 0;

    let s1 = prompt("2nd Innings Striker Name:", "Batter 1");
    let s2 = prompt("2nd Innings Non-Striker Name:", "Batter 2");
    let b1 = prompt("2nd Innings Bowler Name:", "Bowler 1");

    match.striker = { name: s1 || "S1", r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.nonStriker = { name: s2 || "S2", r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    match.bowler = { name: b1 || "B1", o_balls:0, r:0, w:0 };
    
    document.getElementById('battingTeamText').innerText = match.battingTeam;
    closeModal('innings-break-modal');
    switchTab('live');
    updateUI();
}

// --- HELPERS ---
function renderScoreboard() {
    let sb = document.getElementById('full-scoreboard');
    sb.innerHTML = "";
    
    if(match.firstInningsData) {
        sb.innerHTML += createImprovedCard(match.firstInningsData, "1st Innings");
    }
    
    let currentStatus = (match.innings === 1) ? "In-Progress" : "2nd Innings";
    let currentInnings = { 
        team: match.battingTeam, runs: match.runs, wickets: match.wickets, balls: match.balls, 
        batters: [...match.battersHistory, match.striker, match.nonStriker].filter(p => p && (p.b > 0 || p.out)), 
        bowlers: getCombinedBowlersList()
    };
    
    sb.innerHTML += createImprovedCard(currentInnings, currentStatus);
}

function createImprovedCard(data, status) {
    let ov = `${Math.floor(data.balls/6)}.${data.balls%6}`;
    let h = `<div class="sb-card">
                <div class="sb-header-main"><span>${data.team} (${status})</span><span>${data.runs}/${data.wickets} (${ov})</span></div>`;
    
    h += `<div class="sb-section-title">BATTING</div>`;
    h += `<div class="sb-grid-row" style="font-weight:bold; background:#f9f9f9;"><span>Batter</span><span>R</span><span>B</span><span>4/6</span><span>SR</span></div>`;
    data.batters.forEach(p => { 
        if(p && p.name) {
            h += `<div class="sb-grid-row"><span>${p.name}<br><small>${p.out?p.dismissal:'not out'}</small></span><span>${p.r}</span><span>${p.b}</span><span>${p.fours}/${p.sixes}</span><span>${p.b>0?((p.r/p.b)*100).toFixed(1):'0.0'}</span></div>`;
        }
    });

    h += `<div class="sb-section-title">BOWLING</div>`;
    h += `<div class="sb-grid-row" style="font-weight:bold; background:#f9f9f9; grid-template-columns: 2.5fr 1fr 1fr 1fr;"><span>Bowler</span><span>O</span><span>R</span><span>W</span></div>`;
    data.bowlers.forEach(b => {
        if(b && b.name) {
            let b_ov = `${Math.floor(b.o_balls/6)}.${b.o_balls%6}`;
            h += `<div class="sb-grid-row" style="grid-template-columns: 2.5fr 1fr 1fr 1fr;"><span>${b.name}</span><span>${b_ov}</span><span>${b.r}</span><span>${b.w}</span></div>`;
        }
    });

    return h + `</div>`;
}

function switchTab(t) {
    document.querySelectorAll('.tab-link, .tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById('tab-'+t+'-btn').classList.add('active');
    document.getElementById('view-'+t).classList.add('active');
    if(t === 'score') renderScoreboard();
}

function swapStrike() { 
    let t = match.striker; match.striker = match.nonStriker; match.nonStriker = t; 
    updateUI(); 
}

function saveState() { historyStack.push(JSON.parse(JSON.stringify(match))); }

function undo() { 
    if(historyStack.length > 0) { 
        match = historyStack.pop(); 
        updateUI(); 
    } 
}

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function showWicketAnim() { 
    document.getElementById('wicket-overlay').style.display = 'flex'; 
    setTimeout(()=> { document.getElementById('wicket-overlay').style.display = 'none'; }, 1000); 
}

function endMatchDisplay() { 
    setTimeout(() => {
        let resultText = "";
        let t1 = match.firstInningsData.team;
        let t1Runs = match.firstInningsData.runs;
        let t2 = match.battingTeam;
        let t2Runs = match.runs;
        let t2Wickets = match.wickets;

        if (t2Runs >= match.target) {
            // 2nd Innings team gelisthe (Wickets tho gelichinattu)
            let winWickets = 10 - t2Wickets;
            resultText = `${t2} won by ${winWickets} wickets!`;
        } else if (t1Runs > t2Runs) {
            // 1st Innings team gelisthe (Runs tho gelichinattu)
            let winRuns = t1Runs - t2Runs;
            resultText = `${t1} won by ${winRuns} runs!`;
        } else {
            resultText = "Match Tied!";
        }

        alert("Match Over!\n" + resultText); 
        
        // Scoreboard lo winner text chupinchali ante oka element add cheyachu
        let sb = document.getElementById('full-scoreboard');
        let winnerDiv = `<div class="winner-announcement" style="text-align:center; padding:15px; background:#ffd700; color:#000; font-weight:bold; border-radius:8px; margin-bottom:15px; font-size:1.2rem; border:2px solid #b8860b;">
                            <i class="fas fa-trophy"></i> ${resultText}
                         </div>`;
        
        switchTab('score');
        sb.innerHTML = winnerDiv + sb.innerHTML; // Scoreboard paina winner display avthundi
        document.getElementById('mom-section').style.display = 'block'; 
    }, 500);
}


function retireHurtAction() {
    let next = prompt("Enter New Batter Name:");
    if(!next) return;
    saveState();
    match.striker.dismissal = "Retired Hurt";
    match.battersHistory.push(JSON.parse(JSON.stringify(match.striker)));
    match.striker = { name:next, r:0, b:0, fours:0, sixes:0, out:false, dismissal:"" };
    updateUI();
}
