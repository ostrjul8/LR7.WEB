const work = document.getElementById('work');
const anim = document.getElementById('anim');
const square = document.getElementById('square');
const playButton = document.getElementById('play');
const stopButton = document.getElementById('stop');
const reloadButton = document.getElementById('reload');
const closeButton = document.getElementById('close');
const play1Button = document.getElementById('play1');
const message = document.getElementById('message');

let animationInterval;
let speedX, speedY;
let positionX, positionY; 
let isAnimating = false; 

function startAnimation() {
    if (!isAnimating) {
        message.textContent = "Анімація запущена!";
        playButton.style.display = "none"; 
        stopButton.style.display = "inline-block"; 

        if (positionX === undefined || positionY === undefined) {
            positionX = Math.random() * (anim.offsetWidth - 10); 
            positionY = 0; 
          
            let angle = Math.random() * Math.PI / 2 - Math.PI / 4;
            speedX = Math.cos(angle) * 4; 
            speedY = Math.sin(angle) * 4; 
        }

        isAnimating = true;
        animationInterval = setInterval(() => {
            positionX += speedX;
            positionY += speedY;

            if (positionX + square.offsetWidth >= anim.offsetWidth || positionX <= 0) {
                speedX = -speedX; 
                logEvent("Квадрат доторкнувся до стінки (горизонтально)");
            }

            if (positionY <= 0) {
                speedY = -speedY; 
                logEvent("Квадрат доторкнувся до верхньої стінки");
            }

            if (positionY + square.offsetHeight > anim.offsetHeight) {
                logEvent("Квадрат вибув!");
                message.textContent = "Квадрат вибув!";
                clearInterval(animationInterval); 
                stopButton.style.display = "none";
                reloadButton.style.display = "inline-block"; 
                isAnimating = false;

                fetchEventsFromServer();
                return;
            }

            square.style.left = `${positionX}px`;
            square.style.top = `${positionY}px`;
        }, 16);
    }

    updateBlock5(); 
}

function stopAnimation() {
    message.textContent = "Анімація зупинена!";
    clearInterval(animationInterval);
    stopButton.style.display = "none"; 
    playButton.style.display = "inline-block"; 
    isAnimating = false;

    setTimeout(() => {
        fetchEventsFromServer();
    }, 1000); 
}

function reloadAnimation() {
    message.textContent = "Перезапуск!";

    updateBlock5([]); 
    localStorage.removeItem('eventLog');

    stopAnimation();
    positionX = undefined; 
    positionY = undefined;
    square.style.left = "0px";
    square.style.top = "0px";
    playButton.style.display = "inline-block"; 
    reloadButton.style.display = "none"; 

    fetchEventsFromServer(); 
}

function closeWork() {
  work.style.display = 'none';
}

function showWork() {
  work.style.display = 'flex'; 
}

playButton.addEventListener('click', startAnimation);
stopButton.addEventListener('click', stopAnimation);
reloadButton.addEventListener('click', reloadAnimation);
closeButton.addEventListener('click', closeWork);
play1Button.addEventListener('click', showWork);

let eventCounter = parseInt(localStorage.getItem('eventCounter')) || 0; 
let eventLog = []; 

function logEvent(message) {
    const event = {
        eventNumber: ++eventCounter,
        timestamp: new Date().toISOString(), 
        message: message,
    };

    localStorage.setItem('eventCounter', eventCounter);

    const eventData = JSON.stringify(event);
    let storedEvents = JSON.parse(localStorage.getItem('eventLog')) || [];
    storedEvents.push(eventData);
    localStorage.setItem('eventLog', JSON.stringify(storedEvents));

    fetch('/api/saveEvent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    })
    .then(response => response.json())
    .then(data => {
        console.log(`Локальний час: ${event.timestamp}`);
        console.log(`Серверний час: ${data.serverTime}`);
    })
    .catch(error => console.error('Error saving event to server:', error));
}

function updateMessage(message) {
    message.textContent = message;
    logEvent(message); 
}

function logEventToLocalStorage(message) {
    const MAX_EVENTS = 1000; 

    const event = {
        eventNumber: ++eventCounter,
        timestamp: new Date().toISOString(),
        message: message,
    };

    localStorage.setItem('eventCounter', eventCounter);

    let storedEvents = JSON.parse(localStorage.getItem('eventLog')) || [];
    if (storedEvents.length >= MAX_EVENTS) {
        storedEvents.shift(); 
    }

    storedEvents.push(JSON.stringify(event));
    localStorage.setItem('eventLog', JSON.stringify(storedEvents));
}

function sendAccumulatedEventsToServer() {
    let storedEvents = JSON.parse(localStorage.getItem('eventLog')) || [];

    Promise.all(
        storedEvents.map(eventData => {
            const event = JSON.parse(eventData);
            return fetch('/api/saveEvent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event),
            });
        })
    )
    .then(() => {
        console.log('Всі події відправлені на сервер');
        localStorage.removeItem('eventLog');  
        fetchEventsFromServer(); 
    })
    .catch(error => console.error('Помилка при відправленні подій:', error));
}

function updateBlock5(serverEvents = []) {
    let storedEvents = JSON.parse(localStorage.getItem('eventLog')) || [];

    const block5 = document.getElementById('block5');
    if (!block5) {
        console.error('Елемент block5 не знайдено');
        return;
    }

    block5.innerHTML = ''; 

    localStorage.removeItem('eventLog');

    block5.innerHTML = ` 
        <table border="1" style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
                <tr>
                    <th>№</th>
                    <th>Повідомлення (LocalStorage)</th>
                    <th>Час</th>
                    <th>Повідомлення (Server)</th>
                    <th>Час (Server)</th>
                </tr>
            </thead>
            <tbody>
                ${storedEvents.map((eventData, index) => {
                    const event = JSON.parse(eventData);
                    const serverEvent = serverEvents.find(se => se.eventNumber === event.eventNumber);
                    return ` 
                        <tr>
                            <td>${index + 1}</td>
                            <td>${event.message}</td>
                            <td>${new Date(event.timestamp).toLocaleString()}</td>
                            <td>${serverEvent ? serverEvent.message : '---'}</td>
                            <td>${serverEvent ? new Date(serverEvent.serverTime).toLocaleString() : '---'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    //fetchEventsFromServer();
});

function fetchEventsFromServer() {
    fetch('/api/getEvents')
        .then(response => response.json())
        .then(serverEvents => {
            console.log('Події з сервера:', serverEvents); 
            updateBlock5(serverEvents); 
        })
        .catch(error => console.error('Помилка отримання подій із сервера:', error));
}
