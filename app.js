import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  arrayUnion,
  increment,
  onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA04bN5121a28iLwRkJYG8uGTGcVQyFv1Y",
  authDomain: "rodzinkataski.firebaseapp.com",
  projectId: "rodzinkataski",
  storageBucket: "rodzinkataski.appspot.com",
  messagingSenderId: "921333004895",
  appId: "1:921333004895:web:b22bdf6d54a32a4838b9ea",
  measurementId: "G-JM7KL8KLKDEC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const BUSINESSES = {
  legal: [
    { id: 'laundry', name: 'Pralnia', cost: 10000, income: 500, icon: 'fa-tshirt' },
    { id: 'shop', name: 'Sklep', cost: 15000, income: 800, icon: 'fa-store' }
  ],
  illegal: [
    { id: 'casino', name: 'Kasyno', cost: 20000, income: 1500, icon: 'fa-dice' },
    { id: 'smuggling', name: 'Przemyt', cost: 30000, income: 2500, icon: 'fa-box' }
  ]
};

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const authScreen = document.getElementById('auth-screen');
  const gameScreen = document.getElementById('game-screen');
  const loader = document.getElementById('loader');

  // Sprawdź stan logowania
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      await initPlayer(user.uid);
      authScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      loader.classList.add('hidden');
    } else {
      gameScreen.classList.add('hidden');
      authScreen.classList.remove('hidden');
    }
  });

  document.getElementById('play-btn').addEventListener('click', () => {
    loader.classList.remove('hidden');
    signInAnonymously(auth);
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
  });
});

async function initPlayer(userId) {
  const playerRef = doc(db, 'users', userId);
  const docSnap = await getDoc(playerRef);

  if (!docSnap.exists()) {
    await setDoc(playerRef, {
      money: { legal: 10000, illegal: 5000 },
      businesses: { legal: [], illegal: [] },
      relationships: { politicians: 0, gangs: 0, media: 0 },
      blackBox: []
    });
  }

  // Subskrybuj zmiany w czasie rzeczywistym
  onSnapshot(playerRef, (doc) => {
    const data = doc.data();
    updateUI(data);
  });
}

function updateUI(data) {
  document.getElementById('legal-cash').textContent = data.money.legal;
  document.getElementById('illegal-cash').textContent = data.money.illegal;
  document.getElementById('black-box-count').textContent = data.blackBox.length;

  const businessList = document.getElementById('business-list');
  businessList.innerHTML = '';

  [...BUSINESSES.legal, ...BUSINESSES.illegal].forEach(business => {
    const owned = data.businesses[business.id] ? '✓' : '✕';
    const card = document.createElement('div');
    card.className = 'business-card';
    card.innerHTML = `
      <i class="fa-solid ${business.icon}"></i>
      <h3>${business.name}</h3>
      <p>Koszt: $${business.cost}</p>
      <button onclick="buyBusiness('${business.id}', '${business.type}')">
        ${owned} Kup
      </button>
    `;
    businessList.appendChild(card);
  });
}

window.buyBusiness = async (businessId, type) => {
  const business = [...BUSINESSES.legal, ...BUSINESSES.illegal].find(b => b.id === businessId);
  const playerRef = doc(db, 'users', currentUser.uid);

  try {
    await updateDoc(playerRef, {
      [`businesses.${type}`]: arrayUnion(businessId),
      [`money.${type}`]: increment(-business.cost)
    });
    trackCrime(`Nabycie: ${business.name}`);
  } catch (error) {
    alert('Brak środków!');
  }
};

function trackCrime(crime) {
  const playerRef = doc(db, 'users', currentUser.uid);
  updateDoc(playerRef, {
    blackBox: arrayUnion(`${new Date().toLocaleDateString()}: ${crime}`)
  });
}
