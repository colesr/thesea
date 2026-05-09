const world = document.getElementById('world');
const ocean = document.getElementById('ocean-zone');
const beach = document.getElementById('beach-zone');
const sky = document.getElementById('sky');

let seconds = 0;
const CYCLE_TIME = 300; 
let isDay = true;
let entities = { eagles: [], dolphins: [], crabs: [], fish: [], coconuts: [], sharks: [] };

// 1. ECOSYSTEM CORE LOOP
function updateEcosystem() {
    seconds = (seconds + 1) % CYCLE_TIME;
    isDay = seconds <= 180;
    
    updateSunMoon();
    spawnResources();
    processCreatures();
    processApex();
    updateUI();
}

// 2. RESOURCE SPAWNING (Greatly increased rates)
function spawnResources() {
    // Fish spawn far more often
    if (Math.random() < 0.8) spawnEntity('fish');

    // Coconut drop rate increased
    document.querySelectorAll('.palm-tree').forEach(tree => {
        if (Math.random() < 0.08) spawnCoconut(tree.offsetLeft + 20);
    });

    // Shark spawn logic: more sea life = higher shark chance
    const seaPop = entities.fish.length + entities.dolphins.length;
    if (entities.sharks.length === 0 && seaPop > 10 && Math.random() < 0.02) {
        spawnEntity('shark', -100, 50);
    }
}

// 3. SURVIVAL & APEX LOGIC
function processCreatures() {
    // CRABS: Sleep at night, hunt coconuts when hungry
    entities.crabs.forEach((crab, index) => {
        if (!isDay) {
            crab.el.classList.add('sleeping');
        } else {
            crab.el.classList.remove('sleeping');
            if (crab.energy < 60) {
                const target = getNearest(crab, entities.coconuts);
                if (target) crab.x += (target.x > crab.x ? 4 : -4);
                else crab.x += (Math.random() - 0.5) * 10;
                crab.el.classList.add('desperate');
            } else {
                crab.x += (Math.random() - 0.5) * 6;
                crab.el.classList.remove('desperate');
            }
            crab.energy -= 1.2;

            entities.coconuts.forEach((coco, cIdx) => {
                if (Math.abs(crab.x - coco.x) < 30) {
                    crab.energy = Math.min(100, crab.energy + 50);
                    coco.el.remove();
                    entities.coconuts.splice(cIdx, 1);
                }
            });
        }
        updatePos(crab);
        checkDeath(crab, 'crabs', index);
    });

    // DOLPHINS: Hunt fish, steal tea, avoid shore if sharks near
    entities.dolphins.forEach((dolph, index) => {
        if (dolph.energy < 70) {
            const target = getNearest(dolph, entities.fish);
            if (target) {
                dolph.x += (target.x > dolph.x ? 6 : -6);
                dolph.el.style.transform = target.x > dolph.x ? 'scaleX(1)' : 'scaleX(-1)';
            }
            dolph.el.classList.add('desperate');
        } else {
            dolph.x += dolph.dir * 4;
            if (dolph.x > window.innerWidth || dolph.x < -50) dolph.dir *= -1;
            dolph.el.style.transform = dolph.dir > 0 ? 'scaleX(1)' : 'scaleX(-1)';
            dolph.el.classList.remove('desperate');
        }
        dolph.energy -= 1.5;

        // Eating Fish (Fixed detection)
        entities.fish.forEach((f, fIdx) => {
            if (Math.abs(dolph.x - f.x) < 50) {
                dolph.energy = Math.min(100, dolph.energy + 40);
                f.el.remove();
                entities.fish.splice(fIdx, 1);
            }
        });

        // Stealing Tea (Rule 6)
        if (dolph.energy < 40) {
            entities.eagles.forEach(e => {
                if (e.hasTea && Math.abs(dolph.x - e.x) < 60) {
                    e.hasTea = false; e.el.classList.remove('has-tea');
                    dolph.energy += 30;
                }
            });
        }
        updatePos(dolph);
        checkDeath(dolph, 'dolphins', index);
    });

    // EAGLES: Hunt tea or coconuts
    entities.eagles.forEach((eagle, index) => {
        eagle.x += 7;
        eagle.energy -= 1.0;
        if (isDay && eagle.x > window.innerWidth/2 && !eagle.hasTea) {
            eagle.hasTea = true; eagle.el.classList.add('has-tea');
            eagle.energy = Math.min(100, eagle.energy + 25);
        }
        if (eagle.energy < 50) {
            const coco = getNearest(eagle, entities.coconuts);
            if (coco && Math.abs(eagle.x - coco.x) < 50) {
                eagle.energy += 40; coco.el.remove();
                entities.coconuts.splice(entities.coconuts.indexOf(coco), 1);
            }
        }
        if (eagle.x > window.innerWidth + 100) eagle.x = -100;
        updatePos(eagle);
        checkDeath(eagle, 'eagles', index);
    });
}

// 4. SHARK HAVOC (Rule 6)
function processApex() {
    entities.sharks.forEach((shark, index) => {
        const targets = [...entities.fish, ...entities.dolphins];
        const target = getNearest(shark, targets);
        
        if (target) {
            shark.x += (target.x > shark.x ? 10 : -10);
            shark.el.style.transform = target.x > shark.x ? 'scaleX(1)' : 'scaleX(-1)';
            
            if (Math.abs(shark.x - target.x) < 60) {
                target.el.remove();
                if (entities.fish.includes(target)) entities.fish.splice(entities.fish.indexOf(target), 1);
                else entities.dolphins.splice(entities.dolphins.indexOf(target), 1);
            }
        } else {
            // Leave if water is empty
            shark.x += 12;
            if (shark.x > window.innerWidth + 200) {
                shark.el.remove();
                entities.sharks.splice(index, 1);
            }
        }
        updatePos(shark);
    });
}

// HELPERS
function getNearest(me, group) {
    if (group.length === 0) return null;
    return group.reduce((prev, curr) => 
        Math.abs(curr.x - me.x) < Math.abs(prev.x - me.x) ? curr : prev
    );
}

function spawnEntity(type, x, y) {
    const el = document.createElement('div');
    el.className = type;
    el.innerHTML = {fish:'🐟', dolphin:'🐬', crab:'🦀', eagle:'🦅', shark:'🦈'}[type];
    const obj = { el, x: x || Math.random()*window.innerWidth, y: y || 20, energy: 100, dir: 1, hasTea: false };
    if(type === 'crab') beach.appendChild(el);
    else if(type === 'fish' || type === 'dolphin' || type === 'shark') ocean.appendChild(el);
    else world.appendChild(el);
    entities[type + (type==='fish'?'':'s')].push(obj);
}

function spawnCoconut(treeX) {
    const el = document.createElement('div');
    el.className = 'coconut'; el.innerHTML = '🥥';
    el.style.left = treeX + 'px'; el.style.top = '10px';
    beach.appendChild(el);
    const coco = { el, x: treeX };
    entities.coconuts.push(coco);
    setTimeout(() => { if (document.body.contains(el)) { el.innerHTML = '🌴'; el.className = 'palm-tree'; }}, 20000);
}

function checkDeath(ent, group, index) {
    if (ent.energy <= 0) {
        ent.el.style.opacity = '0';
        setTimeout(() => { ent.el.remove(); entities[group].splice(index, 1); }, 500);
    }
}

function updatePos(ent) {
    ent.el.style.left = ent.x + 'px';
    if (ent.y) ent.el.style.top = ent.y + 'px';
}

function updateSunMoon() {
    const progress = isDay ? seconds / 180 : (seconds - 180) / 120;
    const height = Math.sin(progress * Math.PI) * 85;
    const sun = document.getElementById('sun');
    const moon = document.getElementById('moon');
    if (isDay) {
        sun.style.bottom = `${height}%`; moon.style.bottom = `-100px`;
        sky.style.background = `rgb(${135 - progress*100}, ${206 - progress*150}, ${235 - progress*180})`;
        world.style.filter = `brightness(${0.7 + (height/150)})`;
    } else {
        moon.style.bottom = `${height}%`; sun.style.bottom = `-100px`;
        sky.style.background = '#0b1026'; world.style.filter = `brightness(0.5)`;
    }
}

function updateUI() {
    document.getElementById('e-count').innerText = entities.eagles.length;
    document.getElementById('d-count').innerText = entities.dolphins.length;
    document.getElementById('c-count').innerText = entities.crabs.length;
    document.getElementById('f-count').innerText = entities.fish.length;
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    document.getElementById('time-display').innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Stars
for (let i = 0; i < 60; i++) {
    const s = document.createElement('div'); s.className = 'star';
    s.style.left = Math.random()*100+'%'; s.style.top = Math.random()*100+'%';
    s.style.setProperty('--duration', (2+Math.random()*3)+'s');
    document.getElementById('stars').appendChild(s);
}

world.addEventListener('mousedown', (e) => {
    const oceanTop = window.innerHeight * 0.6;
    if (e.clientY > window.innerHeight * 0.85) spawnEntity('crab', e.pageX);
    else if (e.clientY > oceanTop) spawnEntity('dolphin', e.pageX);
    else spawnEntity('eagle', -50, e.pageY);
});

setInterval(updateEcosystem, 1000);