var options = {
    notation: 'default' // Options: 'default', 'scientific', 'standard', 'alphabet', etc.
};
var modInfo = {
    allowSmall: true
};

var points = new Decimal(0);
var upgrades = new Decimal(0);
var rebirths = new Decimal(0);
var lastTick = Date.now();
var UPgenTick = 1000;
var tickspeed = 1000;
var b1cost = new Decimal(10)
var tiercost = new Decimal(1e9)
var tier = 0
var UpgMult = 1
var PointMult = [1.5, 1.5, 1.6, 1.7]
var UpgMult = [1,1,2,4]
var tierUnl = ["", "Booster I", "the Rebirth Reset Layer"]


function main() {
    let now = Date.now();
    let diff = (now - lastTick) / 1000; // time delta in seconds
    lastTick = now;
    UPgenTick = UPgenTick - (diff*1000);

    let pointsPerSec = Decimal.pow(PointMult[tier], upgrades);
    points = points.add(pointsPerSec.times(diff));

    if (UPgenTick < 0) {
        upgrades = upgrades.add(new Decimal(UpgMult[tier]));
        UPgenTick = tickspeed/10;
    }
    updateUI(pointsPerSec);
}


function updateUI(pointsPerSec) {
    let upsps = 1000/tickspeed
    upsps = upsps * UpgMult[tier]
    document.getElementById("pointDisplay").innerHTML = `Points: ${format(points)} (+${format(pointsPerSec)}/sec)`;
    document.getElementById("upgDisplay").innerHTML = `Upgrades: ${format(upgrades)} (+${format(upsps, 3)}/sec, Tickspeed: ${format(tickspeed / 1000, 4)}s)`;
    let rebgain = Decimal.floor(upgrades.div(500))
    document.getElementById("rebirthDisplay").innerHTML = `Rebirths: ${format(rebirths)} (Gain: ${format(rebgain)}, Next at ${format(new Decimal(500).mul(rebgain.add(1)))} Upgrades)`
    document.getElementById("b1-cost").innerHTML = `Cost: ${format(b1cost)} Upgrades`
    document.getElementById("b1-desc").innerHTML = `Reduces tickspeed by 10%<br> Tickspeed: ${format(tickspeed/1000, 3)}s >> ${format(tickspeed * 0.9/1000, 3)}s`
    if (tier == 0) {
        document.getElementById("booster1").hidden = true
    } else {
        document.getElementById("booster1").hidden = false
    }
    if (points.gte(tiercost)) {
        document.getElementById("tierUpBtn").disabled = false
    } else {
        document.getElementById("tierUpBtn").disabled = true
    }
    document.getElementById("tierUpBtn").innerHTML = `Get ${format(tiercost)} Points to Tier Up!`
}

// Tab Switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab and its content
        tab.classList.add('active');
        const contentId = tab.id.replace('Tab', 'Content');
        const content = document.getElementById(contentId);
        if (content) content.classList.add('active');
    });
});

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
    if (points.gte(tiercost)) {
        points = new Decimal(0)
        upgrades = new Decimal(0)
        b1cost = new Decimal(10)
        UPgenTick = tickspeed
        rebirths = new Decimal(0)
        tier = tier + 1;
        tickspeed = 1000 * (0.9 ** tier)
        getNewTierCosts()
        getNewTierDisplay()
    }
}
function getNewTierCosts() {
    if (tier == 0) {
        tiercost = new Decimal(1e9)
    }
    if (tier == 1) {
        tiercost = new Decimal(1e40)
    }
    if (tier == 2) {
        tiercost = new Decimal("eeeeeeeeeeeeeeeeeee10")
    }
}

function getNewTierDisplay() {
    PointMult = [1.5, 1.5, 1.6]
    UpgMult = [1,1,2]
    tierUnl = ["", "Booster I", "the Rebirth Reset Layer"]
    if (tier == 0) {
        document.getElementById("currenttierunlock").innerHTML = ""
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1]}</span>`
    } else {
        document.getElementById("currenttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier]}</span>`
        document.getElementById("nexttierunlock").innerHTML = `UNLOCK: <span class='benefit-yellow'>${tierUnl[tier + 1]}</span>`
    }
    document.getElementById("currenttierbenefit").innerHTML = `Base Upgrade Interval: <span class='benefit-green'>${format(0.9**tier, 3)}s</span><br>Points Multiplier: <span class='benefit-blue'>${format(PointMult[tier], 2)}x</span>/upg<br>Upgrade Multiplier: <span class="benefit-green">${format(UpgMult[tier], 2)}x</span>`
    document.getElementById("nexttierbenefit").innerHTML = `Base Upgrade Interval: <span class='benefit-green'>${format(0.9**(tier+1), 3)}s</span><br>Points Multiplier: <span class='benefit-blue'>${format(PointMult[tier+1], 2)}x</span>/upg<br>Upgrade Multiplier: <span class="benefit-green">${format(UpgMult[tier+1], 2)}x</span>`
}
getNewTierCosts()
getNewTierDisplay()