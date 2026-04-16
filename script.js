function hardReset() {
    console.log("Hard reset triggered");
    if (prompt("Are you sure? This will wipe ALL progress. Type 'RESET' to confirm.") === "RESET") {
        resetData(); 
        localStorage.removeItem('1UpgradePerSec_Save');
        location.reload();
    }
}
window.hardReset = hardReset;

var options = {
    notation: 'default' // Options: 'default', 'scientific', 'standard', 'alphabet', etc.
};
var modInfo = {
    allowSmall: true
};

var points, upgrades, SUpgrades, lastTick, UPgenTick, tickspeed, b1cost, tiercost, tier, tsboost;
var PointMult = [1.5, 1.5, 1.6, 1.7];
var UpgMult = [1, 1, 2, 3];
var tierUnl = ["", "Booster I", "the Super Upgrade Reset Layer", "Surges"];

function resetData() {
    points = new Decimal(0);
    upgrades = new Decimal(0);
    SUpgrades = new Decimal(0);
    lastTick = Date.now();
    UPgenTick = 1000;
    tickspeed = 1000;
    b1cost = new Decimal(10);
    tiercost = new Decimal(1e9);
    tier = 0;
    tsboost = new Decimal(1);
}

// Initial initialization: set defaults first, then overwrite with save data
resetData();
loadGame();



function main() {
    try {
        let now = Date.now();
    let diff = (now - lastTick) / 1000; // time delta in seconds
    lastTick = now;
    UPgenTick = UPgenTick - (diff*1000);

    let pointsPerSec = Decimal.pow(PointMult[tier], upgrades);
    points = points.add(pointsPerSec.times(diff));
    let pctdrain = 0.1
    if (tsboost > 1) {
        tsboost = tsboost.sub(1).mul(1-pctdrain).add(1)
    }
    if (tsboost <1) {
        tsboost = new Decimal(1)
    }
    if (UPgenTick < 0) {
        let gain = new Decimal(UpgMult[tier]);
        upgrades = upgrades.add(gain);
        // Reset tick to scaled tickspeed
        UPgenTick = tickspeed / tsboost.toNumber();
    }
        updateUI(pointsPerSec);
    } catch (e) {
        console.error("Main loop error:", e);
    }
}


function updateUI(pointsPerSec) {
    let effectiveTickspeed = tickspeed / tsboost.toNumber();
    let upsps = 1000 / effectiveTickspeed;
    upsps = upsps * UpgMult[tier]

    document.getElementById("pointDisplay").innerHTML = `Points: ${format(points)} (+${format(pointsPerSec)}/sec)`;
    document.getElementById("upgDisplay").innerHTML = `Upgrades: ${format(upgrades)} (+${format(upsps, 3)}/sec, Tickspeed: ${format(effectiveTickspeed / 1000, 4)}s)`;
    let rebgain = Decimal.floor(upgrades.div(500))
    document.getElementById("SUpgradeDisplay").innerHTML = `SUpgrades: ${format(SUpgrades)} (Gain: ${format(rebgain)}, Next at ${format(new Decimal(500).mul(rebgain.add(1)))} Upgrades)`
    document.getElementById("b1-cost").innerHTML = `Cost: ${format(b1cost)} Upgrades`
    document.getElementById("b1-desc").innerHTML = `Reduces tickspeed by 10%<br> Tickspeed: ${format(tickspeed / 1000, 3)}s >> ${format(tickspeed * 0.9 / 1000, 3)}s`
    document.getElementById('topLeftBtn').innerHTML = `Click to increase Upgrade tickspeed!<br>Currently: x${format(tsboost, 2)}`

    if (tier < 1) {
        document.getElementById("booster1").hidden = true
    } else {
        document.getElementById("booster1").hidden = false
    }

    let canTierUp = points.gte(tiercost);
    if (tier == 3) canTierUp = SUpgrades.gte(tiercost); // Following existing logic in tierUp()

    document.getElementById("tierUpBtn").disabled = !canTierUp;
    document.getElementById("tierUpBtn").innerHTML = canTierUp ? "TIER UP!" : `Get ${format(tiercost)} ${tier == 3 ? 'SUpgrades' : 'Points'} to Tier Up!`;
}

// Tab Switching
document.querySelectorAll('.tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and its content
        tab.classList.add('active');
        const contentId = tab.id.replace('Tab', 'Content');
        const content = document.getElementById(contentId);
        if (content) content.classList.add('active');
    });
});

// Link header options button to the options tab
const optionsBtn = document.getElementById('optionsBtn');
const optionsTab = document.getElementById('optionsTab');
if (optionsBtn && optionsTab) {
    optionsBtn.addEventListener('click', () => {
        optionsTab.click();
    });
}

// Saving & Loading
function getSaveData() {
    let save = {
        points: points.toString(),
        upgrades: upgrades.toString(),
        SUpgrades: SUpgrades.toString(),
        tickspeed: tickspeed,
        b1cost: b1cost.toString(),
        tier: tier,
        options: options,
        tsboost: tsboost.toString(),
    };
    return save;
}

function saveGame() {
    let save = getSaveData();
    localStorage.setItem('1UpgradePerSec_Save', JSON.stringify(save));
    console.log("Game Saved!");
}

console.log("script.js loaded!");

function loadGame(manual = false) {
    let saved = localStorage.getItem('1UpgradePerSec_Save');
    if (!saved) return;
    
    try {
        let save = JSON.parse(saved);
        if (save.points !== undefined) points = new Decimal(save.points);
        if (save.upgrades !== undefined) upgrades = new Decimal(save.upgrades);
        if (save.SUpgrades !== undefined) SUpgrades = new Decimal(save.SUpgrades);
        if (save.tickspeed !== undefined) tickspeed = save.tickspeed;
        if (save.b1cost !== undefined) b1cost = new Decimal(save.b1cost);
        if (save.tier !== undefined) tier = save.tier;
        if (save.options !== undefined) options = save.options;
        if (save.tsboost !== undefined) tsboost = new Decimal(save.tsboost);
        
        getNewTierCosts();
        getNewTierDisplay();
        if (manual) alert("Game Loaded!");
    } catch (e) {
        console.error("Save load failed:", e);
    }
}


// Import / Export
function exportSave() {
    let save = getSaveData();
    let encoded = btoa(JSON.stringify(save));
    document.getElementById('saveDataArea').value = encoded;
    
    // Attempt to copy to clipboard
    navigator.clipboard.writeText(encoded).then(() => {
        alert("Save exported and copied to clipboard!");
    }).catch(() => {
        alert("Save exported! Copy it from the text box.");
    });
}

function importSave() {
    let encoded = document.getElementById('saveDataArea').value;
    if (!encoded) return alert("Please paste a save code first!");
    
    try {
        let decoded = atob(encoded);
        localStorage.setItem('1UpgradePerSec_Save', decoded);
        loadGame();
        alert("Save imported successfully!");
    } catch (e) {
        alert("Invalid save code!");
    }
}

// Auto-save every 10 seconds
setInterval(saveGame, 10000);

// Load game on start
loadGame();

// Run the loop at 50ms intervals (standard for idle games)
setInterval(main, 50);

function buyBooster1() {
    if (upgrades.gte(b1cost)) {
        upgrades = upgrades.sub(b1cost);
        tickspeed = tickspeed * 0.9;
        b1cost = b1cost.mul(2)
        points = new Decimal(0)
    }
}

function tierUp() {
    if (tier < 3) {
        if (points.gte(tiercost)) {
            let oldTier = tier;
            points = new Decimal(0)
            upgrades = new Decimal(0)
            b1cost = new Decimal(10)
            UPgenTick = tickspeed
            SUpgrades = new Decimal(0)
            tier = tier + 1;
            tickspeed = 1000 * (0.9 ** tier)
            getNewTierCosts()
            getNewTierDisplay()
            showTierUpAnimation(oldTier, tier);
        }
    }
    if (tier == 3) {
        if (SUpgrades.gte(tiercost)) { 
            let oldTier = tier;
            points = new Decimal(0)
            upgrades = new Decimal(0)
            b1cost = new Decimal(10)
            UPgenTick = tickspeed
            SUpgrades = new Decimal(0)
            tier = tier + 1;
            tickspeed = 1000 * (0.9 ** tier)
            getNewTierCosts()
            getNewTierDisplay()
            showTierUpAnimation(oldTier, tier);
        }
    }
}

function showTierUpAnimation(oldT, newT) {
    document.getElementById('overlayOldTier').innerText = `Tier ${oldT}`;
    document.getElementById('overlayNewTier').innerText = `Tier ${newT}`;

    const list = document.getElementById('unlockedFeaturesList');
    list.innerHTML = '';
    
    // Add features from tierUnl
    if (tierUnl[newT]) {
        const features = tierUnl[newT].split(',').map(f => f.trim());
        features.forEach(feature => {
            const div = document.createElement('div');
            div.className = 'feature-item';
            div.innerText = feature;
            list.appendChild(div);
        });
    }

    const overlay = document.getElementById('tierUpOverlay');
    overlay.style.display = 'flex';
    setTimeout(() => overlay.classList.add('show'), 10);
}

function closeTierUpOverlay() {
    const overlay = document.getElementById('tierUpOverlay');
    overlay.classList.remove('show');
    setTimeout(() => overlay.style.display = 'none', 500);
}
function getNewTierCosts() {
    if (tier == 0) {
        tiercost = new Decimal(1e9)
    } else if (tier == 1) {
        tiercost = new Decimal(1e40)
    } else if (tier == 2) {
        tiercost = new Decimal("ee10") // Fixed excessive 'e's which might crash display
    } else {
        tiercost = new Decimal("ee100") // Fallback for tier 3+
    }
}

function getNewTierDisplay() {
    PointMult = [1.5, 1.5, 1.6, 1.7, 1.8]
    UpgMult = [1, 1, 2, 3, 4]
    if (tier == 0) {
        document.getElementById("currenttierunlock").innerHTML = ""
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1] || 'Unknown'}</span>`
    } else {
        document.getElementById("currenttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier] || 'Unknown'}</span>`
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1] || 'Max Tier reached'}</span>`
    }
    
    let curPtMult = PointMult[tier] || 1;
    let nxtPtMult = PointMult[tier + 1] || 1;
    let curUpMult = UpgMult[tier] || 1;
    let nxtUpMult = UpgMult[tier + 1] || 1;

    document.getElementById("currenttierbenefit").innerHTML = `Base Upgrade Interval: <span class='benefit-green'>${format(0.9 ** tier, 3)}s</span><br>Points Multiplier: <span class='benefit-blue'>${format(curPtMult, 2)}x</span>/upg<br>Upgrade Multiplier: <span class="benefit-green">${format(curUpMult, 2)}x</span>`
    document.getElementById("nexttierbenefit").innerHTML = `Base Upgrade Interval: <span class='benefit-green'>${format(0.9 ** (tier + 1), 3)}s</span><br>Points Multiplier: <span class='benefit-blue'>${format(nxtPtMult, 2)}x</span>/upg<br>Upgrade Multiplier: <span class="benefit-green">${format(nxtUpMult, 2)}x</span>`
}

function tickspeedBoost() {
    let tsmulti = new Decimal(0.1)
    let tsscale = new Decimal(0.6)
    let gain = new Decimal(tsscale).pow(tsboost.sub(1)).mul(tsmulti)
    tsboost = tsboost.add(gain)
}
getNewTierCosts()
getNewTierDisplay()