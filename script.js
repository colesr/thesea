const sky = document.getElementById('sky');
const sun = document.getElementById('sun');
const moon = document.getElementById('moon');
const world = document.getElementById('world');
const oceanZone = document.getElementById('ocean-zone');
const beachZone = document.getElementById('beach-zone');
const timeDisplay = document.getElementById('time-display');

const CYCLE_TIME = 300; // 5 Minutes
let seconds = 0;

function updateWorld() {
    seconds = (seconds + 1) % CYCLE_TIME;
    const isDay = seconds <= 180; // 3 mins day
    const progress = isDay ? seconds / 180 : (seconds - 180) / 120; // 2 mins night
    
    const height = Math.sin(progress * Math.PI) * 85;

    if (isDay) {
        sun.style.bottom = `${height}%`;
        moon.style.bottom = `-100px`;
        
        // Quadratic Color Math: y = ax^2 + bx + c
        const r = Math.floor(-400 * Math.pow(progress - 0.5, 2) + 135);
        const g = Math.floor(-300 * Math.pow(progress - 0.5, 2) + 206);
        const b = Math.floor(200 * Math.pow(progress - 0.5, 2) + 235);
        sky.style.background = `rgb(${r}, ${g}, ${b})`;
        world.style.filter = `brightness(${0.6 + (height/150)})`;
    } else {
        moon.style.bottom = `${height}%`;
        sun.style.bottom = `-100px`;
        sky.style.background = '#0b1026';
        world.style.filter = `brightness(0.5)`;
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    timeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Interaction Spawner
world.addEventListener('mousedown', (e) => {
    const beachRect = beachZone.getBoundingClientRect();
    const oceanTop = window.innerHeight * 0.6;

    if (e.clientY >= beachRect.top) {
        spawnCrab(e.pageX, e.pageY - beachRect.top);
    } else if (e.clientY >= oceanTop) {
        spawnDolphin(e.pageX, e.pageY - oceanTop);
    } else {
        spawnEagle(e.pageY);
    }
});

function spawnCrab(x, y) {
    const crab = document.createElement('div');
    crab.className = 'crab';
    crab.innerHTML = '🦀';
    crab.style.left = x + 'px';
    crab.style.top = (y - 20) + 'px';
    beachZone.appendChild(crab);
    setTimeout(() => crab.remove(), 20000);
}

function spawnDolphin(x, y) {
    const dolphin = document.createElement('div');
    dolphin.className = 'dolphin';
    dolphin.innerHTML = '🐬';
    dolphin.style.left = (x - 20) + 'px';
    dolphin.style.top = y + 'px';
    oceanZone.appendChild(dolphin);
    setTimeout(() => dolphin.remove(), 1500);
}

function spawnEagle(startY) {
    const eagle = document.createElement('div');
    eagle.className = 'eagle';
    eagle.innerHTML = '🦅';
    eagle.style.top = startY + 'px';
    const duration = 5;
    eagle.style.animation = `swoop-and-sip ${duration}s linear forwards`;
    
    setTimeout(() => eagle.classList.add('has-tea'), duration * 450);
    document.getElementById('eagle-layer').appendChild(eagle);
    setTimeout(() => eagle.remove(), duration * 1000);
}

setInterval(updateWorld, 1000);
updateWorld();

// Generate Stars
const starsContainer = document.getElementById('stars');
for (let i = 0; i < 60; i++) {
    const star = document.createElement('div');
    star.style.cssText = `position:absolute; width:2px; height:2px; background:white; 
        left:${Math.random()*100}%; top:${Math.random()*100}%; opacity:${Math.random()}`;
    starsContainer.appendChild(star);
}