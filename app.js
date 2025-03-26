import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    increment,
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, 
    signInAnonymously 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 🔥 ZASTĄP TYM SWOIMI DANYMI Z FIREBASE
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
let playerRef = null;

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-game');
    
    startBtn.addEventListener('click', async () => {
        try {
            const userCredential = await signInAnonymously(auth);
            const user = userCredential.user;
            
            // Inicjalizuj gracza
            playerRef = doc(db, "players", user.uid);
            const docSnap = await getDoc(playerRef);
            
            if (!docSnap.exists()) {
                await setDoc(playerRef, {
                    cash: {
                        clean: 5000,
                        dirty: 0
                    },
                    inventory: {
                        cocaine: 0,
                        meth: 0,
                        weed: 0
                    },
                    heat: 0,
                    lastLogin: new Date().toISOString()
                });
            }

            // Subskrybuj zmiany
            onSnapshot(playerRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    updateUI(data);
                }
            });

            // Przełącz ekrany
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');

        } catch (error) {
            console.error("Błąd inicjalizacji:", error);
            alert("Błąd systemu: " + error.message);
        }
    });
});

function updateUI(data) {
    // Pieniądze
    document.getElementById('clean-cash').textContent = `$${data.cash.clean}`;
    document.getElementById('dirty-cash').textContent = `($${data.cash.dirty})`;
    
    // Narkotyki
    document.getElementById('cocaine-amount').textContent = data.inventory.cocaine;
    document.getElementById('meth-amount').textContent = data.inventory.meth;
    document.getElementById('weed-amount').textContent = data.inventory.weed;
    
    // Poziom zagrożenia
    document.getElementById('police-heat').value = data.heat;
}

window.produceDrug = async (drugType) => {
    if (!playerRef) return;

    try {
        await updateDoc(playerRef, {
            [`inventory.${drugType}`]: increment(50),
            'heat': increment(5)
        });
    } catch (error) {
        console.error("Błąd produkcji:", error);
        alert("Operacja nieudana! Spróbuj ponownie.");
    }
};
