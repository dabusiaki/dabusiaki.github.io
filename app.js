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
    { id: 'laundry', name: 'Pralnia', cost: 10000, income: 500, icon: 'fa-tshirt', type: 'legal' },
    { id: 'shop', name: 'Sklep', cost: 15000, income: 800, icon: 'fa-store', type: 'legal' }
  ],
  illegal: [
    { id: 'casino', name: 'Kasyno', cost: 20000, income: 1500, icon: 'fa-dice', type: 'illegal' },
    { id: 'smuggling', name: 'Przemyt', cost: 30000, income: 2500, icon: 'fa-box', type: 'illegal' }
  ]
};

let currentUser = null;
let playerData = {};

document.addEventListener('DOMContentLoaded', () => {
  const authScreen = document.getElementById('auth-screen');
  const gameScreen = document.getElementById('game-screen');
  const loader = document.getElementById('loader');

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
    signInAnonymously(auth).catch(error => {
      console.error('Błąd logowania:', error);
      loader.classList.add('hidden');
    });
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
  });
});

async function initPlayer(userId) {
  const playerRef = doc(db, 'users', userId);
  
  try {
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
      if (doc.exists()) {
        playerData = doc.data();
        updateUI();
      }
    });
    
  } catch (error) {
    console.error('Błąd inicjalizacji gracza:', error);
    alert('Błąd ładowania gry! Odśwież stronę.');
  }
}

function updateUI() {
  // Aktualizuj pieniądze
  document.getElementById('legal-cash').textContent = playerData.money?.legal || 0;
  document.getElementById('illegal-cash').textContent = playerData.money?.illegal || 0;
  
  // Aktualizuj czarną skrzynkę
  const crimesList = document.getElementById('crimes-list');
  crimesList.innerHTML = playerData.blackBox?.map(crime => 
    `<li>${crime}</li>`
  ).join('') || '';

  // Aktualizuj biznesy
  const businessList = document.getElementById('business-list');
  businessList.innerHTML = BUSINESSES.legal.concat(BUSINESSES.illegal)
    .map(business => {
      const owned = playerData.businesses[business.type]?.includes(business.id);
      return `
        <div class="business-card">
          <i class="fa-solid ${business.icon}"></i>
          <h3>${business.name}</h3>
          <p>Koszt: $${business.cost}</p>
          <button 
            onclick="buyBusiness('${business.id}', '${business.type}')"
            ${owned || (playerData.money[business.type] < business.cost) ? 'disabled' : ''}
          >
            ${owned ? '✓ Posiadane' : 'Kup'}
          </button>
        </div>
      `;
    }).join('');
}

window.buyBusiness = async (businessId, type) => {
  try {
    const business = BUSINESSES[type].find(b => b.id === businessId);
    const playerRef = doc(db, 'users', currentUser.uid);

    await updateDoc(playerRef, {
      [`businesses.${type}`]: arrayUnion(businessId),
      [`money.${type}`]: increment(-business.cost)
    });

    await updateDoc(playerRef, {
      blackBox: arrayUnion(`Kupiono ${business.name} (${new Date().toLocaleDateString()})`)
    });

  } catch (error) {
    console.error('Błąd zakupu:', error);
    alert('Nie udało się dokonać zakupu! Sprawdź konsolę.');
  }
};
