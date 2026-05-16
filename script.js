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
var UpgMult = [1, 1, 2, 3.75];
var SUs = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
var Boosters = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
var SUCost = [new Decimal(1),new Decimal(10)]
var tierUnl = ["", "Booster I", "the Super Upgrade Reset Layer", "Surges"];
var surgecd = 20
var surgemaxcd = 20
var surgeactive = 0
var surgeupgmulti = 2
var surgespdmulti = 2

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
    surgecd = 20;
    surgemaxcd = 20;
    surgeactive = 0;
    surgeupgmulti = 2;
    surgespdmulti = 2;
}

// Initial initialization: set defaults first, then overwrite with save data
resetData();
loadGame();



function main() {
    try {
        let now = Date.now();
    let diff = (now - lastTick) / 1000; // time delta in seconds
    lastTick = now;

    if (tier >= 3) {
        if (surgeactive == 0) {
            surgecd = surgecd - diff;
            if (surgecd <= 0) {
                surgeactive = 10;
            }
        }
        if (surgeactive > 0) {
            surgeactive = surgeactive - diff;
            if (surgeactive <= 0) {
                surgecd = surgemaxcd;
                surgeactive = 0;
            }
        }
    }

    let gameDiff = diff;
    if (surgeactive > 0) gameDiff *= surgespdmulti;

    UPgenTick = UPgenTick - (gameDiff*1000);

    let pointsPerSec = Decimal.pow(PointMult[tier], upgrades);
    points = points.add(pointsPerSec.times(gameDiff));
    let pctdrain = 0.1
    if (tsboost > 1) {
        tsboost = tsboost.sub(1).mul(1-pctdrain).add(1)
    }
    if (tsboost <1) {
        tsboost = new Decimal(1)
    }
    if (UPgenTick < 0) {
        let gain = new Decimal(UpgMult[tier]);
        gain = gain * (SUs[0]+1)
        if (surgeactive > 0) gain = gain * surgeupgmulti;
        upgrades = upgrades.add(gain);
        // Reset tick to scaled tickspeed
        UPgenTick = tickspeed / tsboost.toNumber();
    }
    let base = 2
    if (SUs[1] >= 1) {
        base = 1.8
        if (SUs[1] >= 2) base = 1.6
        SUCost[1] = new Decimal(250)
    }
    b1cost = new Decimal(base).pow(Boosters[0]).mul(10)
    if (Boosters[0]>=8) b1cost = b1cost.mul(new Decimal(1.5).pow(Boosters[0]-7))
    if (Boosters[0]>=14) b1cost = b1cost.mul(new Decimal(1.4).pow(Boosters[0]-13))
    if (Boosters[0]>=20) b1cost = b1cost.mul(new Decimal(1.7).pow(Boosters[0]-19))
    if (Boosters[0]>=25) b1cost = b1cost.mul(new Decimal(2).pow(Boosters[0]-24))
    b1cost = Decimal.floor(b1cost)
    SUCost[0] = Decimal.floor(new Decimal(base).pow(SUs[0]));
    SUCost[1] = new Decimal(10);
        let displayPPS = pointsPerSec;
        if (surgeactive > 0) displayPPS = displayPPS.times(surgespdmulti);
        updateUI(displayPPS);
    } catch (e) {
        console.error("Main loop error:", e);
    }
}


function updateUI(pointsPerSec) {
    let effectiveTickspeed = tickspeed / tsboost.toNumber();
    if (surgeactive > 0) effectiveTickspeed /= surgespdmulti;

    let upsps = 1000 / effectiveTickspeed;
    upsps = upsps * UpgMult[tier]
    upsps = upsps * (SUs[0]+1)
    if (surgeactive > 0) upsps = upsps * surgeupgmulti;

    document.getElementById("pointDisplay").innerHTML = `Points: ${format(points)} (+${format(pointsPerSec)}/sec)`;
    document.getElementById("upgDisplay").innerHTML = `Upgrades: ${format(upgrades)} (+${format(upsps, 3)}/sec, Tickspeed: ${format(effectiveTickspeed / 1000, 4)}s)`;
    let rebgain = Decimal.floor(upgrades.div(500))
    document.getElementById("SUpgradeDisplay").innerHTML = `SUpgrades: ${format(SUpgrades)}`
    let costBooster1 = `Cost: ${format(b1cost)} Upgrades`
    if (Boosters[0] >= 8) {
        costBooster1 = `Cost: ${format(b1cost)} Upgrades [Minicapped]`
    }
    if (Boosters[0] >= 14) {
        costBooster1 = `Cost: ${format(b1cost)} Upgrades [Minorcapped]`
    }
    if (Boosters[0] >= 20) {
        costBooster1 = `Cost: ${format(b1cost)} Upgrades [Softcapped]`
    }
    if (Boosters[0] >= 25) {
        costBooster1 = `Cost: ${format(b1cost)} Upgrades [Softcapped²]`
    }
    document.getElementById("b1-cost").innerHTML = costBooster1
    document.getElementById("b1-desc").innerHTML = `Reduces tickspeed by 10%<br> Tickspeed: ${format(tickspeed / 1000, 3)}s >> ${format(tickspeed * 0.9 / 1000, 3)}s`
    document.getElementById('topLeftBtn').innerHTML = `Click to increase Upgrade tickspeed!<br>Currently: x${format(tsboost, 2)}`

    if (tier < 1) {
        document.getElementById("booster1").hidden = true
    } else {
        document.getElementById("booster1").hidden = false
    }
    if (tier < 2) {
        document.getElementById("superUpBtn").hidden = true
        document.getElementById("SU1").hidden = true
        document.getElementById("SU2").hidden = true
    } else {
        document.getElementById("superUpBtn").hidden = false
        document.getElementById("SU1").hidden = false
        document.getElementById("SU2").hidden = false
    }
    if (SUs[0] > 0) {
        document.getElementById("SU2").hidden = false
    } else {
        document.getElementById("SU2").hidden = true
    }
    if (upgrades.lt(500)) {
        document.getElementById("superUpBtn").disabled = true
    } else {
        document.getElementById("superUpBtn").disabled = false
    }
    document.getElementById("SU1-cost").innerHTML = `Cost: ${format(SUCost[0])} Super Upgrades`
    document.getElementById("SU1-desc").innerHTML = `+1 Base Upgrade a second<br>Total: +${format(SUs[0])} Upgrades`
    document.getElementById("superUpBtn").innerHTML = `Reset for Super Upgrades! (Gain: ${format(rebgain)}, Next at ${format(new Decimal(500).mul(rebgain.add(1)))} Upgrades)`
    if (SUpgrades.gte(SUCost[0])) {
        document.getElementById("SU1").disabled = false
    } else {
        document.getElementById("SU1").disabled = true
    }

    if (SUs[1] >= 2) {
        document.getElementById("SU2").disabled = true
        document.getElementById("SU2-cost").innerHTML = "Cost: 250 Super Upgrades [BOUGHT!]"
        document.getElementById("SU2-desc").innerHTML = "Cost scaling of Super Upgrade I and Booster I is further weakened."
    } else {
        if (SUs[1] == 1) {
            document.getElementById("SU2-cost").innerHTML = "Cost: 250 Super Upgrades"
            document.getElementById("SU2-desc").innerHTML = "Cost scaling of Super Upgrade I and Booster I is further weakened."
        } else {
            document.getElementById("SU2-cost").innerHTML = "Cost: 10 Super Upgrades"
            document.getElementById("SU2-desc").innerHTML = "Cost scaling of Super Upgrade I and Booster I is weakened."
        }
        if (SUpgrades.gte(SUCost[1])) {
            document.getElementById("SU2").disabled = false
        } else {
            document.getElementById("SU2").disabled = true
        }
    }

    // Surge Display

    if (tier >= 3) {
        document.getElementById("surgestatus").hidden = false;
    } else {
        document.getElementById("surgestatus").hidden = true;
    }
    if (surgeactive > 0) {
        document.getElementById("surgestatus").innerHTML = `SURGE STATUS: ACTIVE (x${format(surgeupgmulti, 2)} Upgrade Production and x${format(surgespdmulti, 2)} Speed for ${format(surgeactive, 2)} seconds)`;
    } else {
        document.getElementById("surgestatus").innerHTML = `SURGE STATUS: INACTIVE (Recharging: ${format((1-surgecd/surgemaxcd)*100, 1)}%)`;
    }

    let canTierUp = points.gte(tiercost);
    if (tier == 2) canTierUp = SUpgrades.gte(tiercost); // Following existing logic in tierUp()

    document.getElementById("tierUpBtn").disabled = !canTierUp;
    document.getElementById("tierUpBtn").innerHTML = canTierUp ? "TIER UP!" : `Get ${format(tiercost)} ${tier == 2 ? 'SUpgrades' : 'Points'} to Tier Up!`;
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
        SUs: SUs,
        tsboost: tsboost.toString(),
        Boosters: Boosters,
        surgecd: surgecd,
        surgemaxcd: surgemaxcd,
        surgeactive: surgeactive,
        surgeupgmulti: surgeupgmulti,
        surgespdmulti: surgespdmulti,
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
        if (save.SUs !== undefined) SUs = save.SUs;
        if (save.tsboost !== undefined) tsboost = new Decimal(save.tsboost);
        if (save.Boosters !== undefined) Boosters = save.Boosters;
        if (save.surgecd !== undefined) surgecd = save.surgecd;
        if (save.surgemaxcd !== undefined) surgemaxcd = save.surgemaxcd;
        if (save.surgeactive !== undefined) surgeactive = save.surgeactive;
        if (save.surgeupgmulti !== undefined) surgeupgmulti = save.surgeupgmulti;
        if (save.surgespdmulti !== undefined) surgespdmulti = save.surgespdmulti;
        
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
        Boosters[0] += 1
        let base = 2
        if (SUs[1] >= 1) base = 1.8
        b1cost = Decimal.floor(new Decimal(base).pow(Boosters[0]).mul(10))
        points = new Decimal(0)
    }
}

function buySU(id) {
    if (id === 2 && SUs[1] >= 1) return;
    if (SUpgrades.gte(SUCost[id-1])) {
        SUpgrades = SUpgrades.sub(SUCost[id-1])
        SUs[id-1] += 1
    }
}

function tierUp() {
    if (tier < 2) {
        if (points.gte(tiercost)) {
            tierReset()
        }
    }
    if (tier == 2) {
        if (SUpgrades.gte(tiercost)) { 
            tierReset()
        }
    }
}

function tierReset() {
    let oldTier = tier;
    points = new Decimal(0)
    upgrades = new Decimal(0)
    b1cost = new Decimal(10)
    UPgenTick = tickspeed
    SUpgrades = new Decimal(0)
    SUs = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    Boosters = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    SUCost = [new Decimal(1),new Decimal(10)]
    tier = tier + 1;
    tickspeed = 1000 * (0.9 ** tier)
    getNewTierCosts()
    getNewTierDisplay()
    showTierUpAnimation(oldTier, tier);
}
function superReset() {
    let gain = Decimal.floor(upgrades.div(500)); // calculate BEFORE wiping upgrades
    points = new Decimal(0);
    Boosters = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    upgrades = new Decimal(0);
    b1cost = new Decimal(10);
    UPgenTick = tickspeed;
    SUpgrades = SUpgrades.add(gain);
    tickspeed = 1000 * (0.9 ** tier);
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
        tiercost = new Decimal(6) // Fixed excessive 'e's which might crash display
    } else {
        tiercost = new Decimal("ee100") // Fallback for tier 3+
    }
}

function getNewTierDisplay() {
    PointMult = [1.5, 1.5, 1.6, 1.7, 1.8]
    UpgMult = [1, 1, 2, 3.75, 7]
    if (tier == 0) {
        document.getElementById("currenttierunlock").innerHTML = ""
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1] || 'Unknown'}</span>`
    } else {
        document.getElementById("currenttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier] || 'Unknown'}</span>`
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1] || 'Wait for a future update!'}</span>`
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