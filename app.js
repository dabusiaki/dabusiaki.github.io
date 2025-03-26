import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, updateDoc, 
    arrayUnion, increment, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, signInAnonymously, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "TWOJ_API_KEY",
    authDomain: "TWOJ_PROJEKT.firebaseapp.com",
    projectId: "TWOJ_PROJEKT",
    storageBucket: "TWOJ_PROJEKT.appspot.com",
    messagingSenderId: "NUMER",
    appId: "APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let playerRef;
let unsubscribe;

const DRUGS = {
    cocaine: { cost: 75, price: 150, risk: 8 },
    meth: { cost: 30, price: 90, risk: 5 },
    weed: { cost: 10, price: 40, risk: 3 }
};

async function initializeGame(user) {
    playerRef = doc(db, "players", user.uid);
    
    const docSnap = await getDoc(playerRef);
    if (!docSnap.exists()) {
        await setDoc(playerRef, {
            cash: { clean: 5000, dirty: 0 },
            inventory: {
                cocaine: 0,
                meth: 0,
                weed: 0
            },
            territories: [],
            heat: 0,
            upgrades: []
        });
    }

    unsubscribe = onSnapshot(playerRef, (doc) => updateUI(doc.data()));
}

function updateUI(data) {
    // Aktualizacja UI
    document.getElementById('dirty-cash').textContent = `$${data.cash.dirty}`;
    document.getElementById('police-heat').value = data.heat;
    
    // Aktualizacja narkotyków
    for (const drug in data.inventory) {
        document.getElementById(`${drug}-amount`).textContent = data.inventory[drug];
    }
}

// Mechanika produkcji
window.produceDrug = async (drugType) => {
    const cost = DRUGS[drugType].cost * 50;
    
    await updateDoc(playerRef, {
        [`inventory.${drugType}`]: increment(50),
        'cash.dirty': increment(-cost),
        'heat': increment(DRUGS[drugType].risk)
    });
};

// System nalotów policyjnych
function startPoliceRaid() {
    if (Math.random() < 0.3) {
        const loss = Math.floor(Math.random() * 1000) + 500;
        updateDoc(playerRef, {
            'cash.dirty': increment(-loss),
            'heat': increment(-20)
        });
        logEvent(`Nalot policyjny! Straciłeś $${loss}`);
    }
}

// Logowanie zdarzeń
function logEvent(message) {
    const log = document.getElementById('event-log');
    log.innerHTML = `<div class="event">${new Date().toLocaleTimeString()}: ${message}</div>` + log.innerHTML;
}

// Inicjalizacja
onAuthStateChanged(auth, (user) => {
    if (user) {
        initializeGame(user);
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
    }
});

document.getElementById('start-game').addEventListener('click', () => {
    signInAnonymously(auth);
});
