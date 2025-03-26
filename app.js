import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc, setDoc, getDoc, updateDoc,
    increment, onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "TWÓJ_API_KEY",
    authDomain: "TWÓJ_PROJEKT.firebaseapp.com",
    projectId: "TWÓJ_PROJEKT",
    storageBucket: "TWÓJ_PROJEKT.appspot.com",
    messagingSenderId: "TWÓJ_NUMER",
    appId: "TWÓJ_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let chartInstance = null;

// Autentykacja
auth.onAuthStateChanged(user => {
    if (user) {
        initDashboard(user);
    } else {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

async function initDashboard(user) {
    const userRef = doc(db, "users", user.uid);
    
    if (!(await getDoc(userRef)).exists()) {
        await setDoc(userRef, {
            balance: 10000,
            portfolio: {}
        });
    }

    onSnapshot(userRef, async (doc) => {
        const userData = doc.data();
        updateUI(userData);
        loadCryptoData(userData);
    });

    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
}

async function loadCryptoData(userData) {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&per_page=10');
        const cryptoData = await response.json();
        renderCryptoList(cryptoData, userData);
    } catch (error) {
        console.error('Błąd pobierania danych:', error);
    }
}

function renderCryptoList(cryptos, userData) {
    const container = document.getElementById('crypto-list');
    container.innerHTML = cryptos.map(crypto => `
        <div class="crypto-card">
            <h3>${crypto.name} (${crypto.symbol.toUpperCase()})</h3>
            <p>💰 Cena: $${crypto.current_price}</p>
            <p>📈 24h: ${crypto.price_change_percentage_24h?.toFixed(2) || 0}%</p>
            <div class="trade-form">
                <input type="number" id="amount-${crypto.id}" placeholder="Kwota w USD">
                <button onclick="buyCrypto('${crypto.id}', '${crypto.name}', ${crypto.current_price})">
                    Kup
                </button>
            </div>
        </div>
    `).join('');
}

function updateUI(userData) {
    document.getElementById('balance').textContent = userData.balance.toFixed(2);
    updateChart(userData.portfolio);
}

function updateChart(portfolio) {
    const ctx = document.getElementById('portfolio-chart').getContext('2d');
    
    if (chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(portfolio),
            datasets: [{
                data: Object.values(portfolio),
                backgroundColor: ['#3b82f6', '#10b981', '#ef4444', '#f59e0b']
            }]
        }
    });
}

window.login = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Błąd logowania: ' + error.message);
    }
};

window.toggleRegister = () => {
    const btn = document.querySelector('.auth-box button');
    btn.textContent = 'Zarejestruj';
    btn.onclick = window.register;
};

window.register = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert('Błąd rejestracji: ' + error.message);
    }
};

window.logout = async () => {
    await signOut(auth);
};

window.buyCrypto = async (cryptoId, cryptoName, price) => {
    const amountInput = document.getElementById(`amount-${cryptoId}`);
    const amount = parseFloat(amountInput.value);
    
    if (!amount || amount <= 0) {
        alert('Podaj prawidłową kwotę!');
        return;
    }

    try {
        const user = auth.currentUser;
        const userRef = doc(db, "users", user.uid);
        
        await updateDoc(userRef, {
            balance: increment(-amount),
            [`portfolio.${cryptoName}`]: increment(amount / price)
        });
        
        amountInput.value = '';
    } catch (error) {
        alert('Transakcja nieudana: ' + error.message);
    }
};
