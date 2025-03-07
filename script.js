// Konfiguracja Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA04bN5...",
    authDomain: "rodzinkataski.firebaseapp.com",
    projectId: "rodzinkataski",
    storageBucket: "rodzinkataski.appspot.com",
    messagingSenderId: "921333004895",
    appId: "1:921333004895:web:b22bdf6d54a32a4838b9ea",
    measurementId: "G-JM7KL8KDEC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const playersRef = db.collection("players");

let currentPlayer = localStorage.getItem("monopolyUser");

document.addEventListener("DOMContentLoaded", () => {
    if (currentPlayer) {
        loginUser(currentPlayer);
    }
});

function joinGame() {
    const name = document.getElementById("playerName").value.trim();
    if (!name) return;

    currentPlayer = name;
    localStorage.setItem("monopolyUser", name);

    playersRef.doc(name).set({ balance: 1500 }, { merge: true })
        .then(() => loginUser(name));
}

function loginUser(name) {
    document.getElementById("loginSection").style.display = "none";
    document.getElementById("gameSection").style.display = "block";
    document.getElementById("logoutBtn").style.display = "block";

    if (name === "Bank") {
        document.getElementById("bankSection").style.display = "block";
    }

    updatePlayerList();
}

function updatePlayerList() {
    playersRef.onSnapshot(snapshot => {
        const playersList = document.getElementById("playersList");
        const recipientSelect = document.getElementById("recipient");
        
        playersList.innerHTML = "";
        recipientSelect.innerHTML = "";

        snapshot.forEach(doc => {
            const player = doc.id;
            const balance = doc.data().balance;
            
            let li = document.createElement("li");
            li.textContent = `${player}: $${balance}`;
            playersList.appendChild(li);
            
            if (player !== currentPlayer) {
                let option = document.createElement("option");
                option.value = player;
                option.textContent = player;
                recipientSelect.appendChild(option);
            }
        });
    });
}

function transferMoney() {
    const to = document.getElementById("recipient").value;
    const amount = parseInt(document.getElementById("amount").value);
    
    if (!to || amount <= 0) return;

    const fromDoc = playersRef.doc(currentPlayer);
    const toDoc = playersRef.doc(to);

    db.runTransaction(async transaction => {
        const fromSnap = await transaction.get(fromDoc);
        if (!fromSnap.exists) return;

        let fromBalance = fromSnap.data().balance;
        if (fromBalance >= amount) {
            transaction.update(fromDoc, { balance: fromBalance - amount });

            const toSnap = await transaction.get(toDoc);
            if (toSnap.exists) {
                let toBalance = toSnap.data().balance;
                transaction.update(toDoc, { balance: toBalance + amount });
            }
        }
    });
}

function resetGame() {
    if (currentPlayer !== "Bank") return;

    playersRef.get().then(snapshot => {
        snapshot.forEach(doc => doc.ref.delete());
    });
}

function logout() {
    localStorage.removeItem("monopolyUser");
    location.reload();
}
