// KONFIGURACJA FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyA04bN5121a28iLwRkJYG8uGTGcVQyFv1Y",
    authDomain: "rodzinkataski.firebaseapp.com",
    projectId: "rodzinkataski",
    storageBucket: "rodzinkataski.appspot.com",
    messagingSenderId: "921333004895",
    appId: "1:921333004895:web:b22bdf6d54a32a4838b9ea",
    measurementId: "G-JM7KL8KDEC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let currentPlayer = null;

// DOŁĄCZANIE DO GRY
function joinGame() {
    const playerName = document.getElementById("playerName").value.trim();
    if (!playerName) {
        alert("Podaj swoją nazwę!");
        return;
    }

    currentPlayer = playerName;
    document.getElementById("currentPlayerName").textContent = playerName;
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";

    // Dodaj gracza do Firestore, jeśli go nie ma
    db.collection("players").doc(playerName).get().then((doc) => {
        if (!doc.exists) {
            db.collection("players").doc(playerName).set({ balance: 1500 });
        }
    });

    loadPlayers();
}

// WCZYTANIE LISTY GRACZY
function loadPlayers() {
    db.collection("players").onSnapshot((snapshot) => {
        const playersList = document.getElementById("players");
        const playersDropdown = document.getElementById("playersList");
        playersList.innerHTML = "";
        playersDropdown.innerHTML = "";

        snapshot.forEach((doc) => {
            const player = doc.id;
            const balance = doc.data().balance;
            const li = document.createElement("li");
            li.textContent = `${player}: ${balance} $`;
            playersList.appendChild(li);

            if (player !== currentPlayer) {
                const option = document.createElement("option");
                option.value = player;
                option.textContent = player;
                playersDropdown.appendChild(option);
            }

            if (player === currentPlayer) {
                document.getElementById("balance").textContent = balance;
            }
        });

        if (currentPlayer === "Bank") {
            document.getElementById("bankControls").style.display = "block";
        }
    });
}

// PRZELEW PIENIĘDZY
function sendMoney() {
    const amount = parseInt(document.getElementById("amount").value);
    const receiver = document.getElementById("playersList").value;

    if (!amount || amount <= 0) {
        alert("Podaj poprawną kwotę!");
        return;
    }

    db.collection("players").doc(currentPlayer).get().then((doc) => {
        if (doc.exists && doc.data().balance >= amount) {
            db.collection("players").doc(currentPlayer).update({
                balance: firebase.firestore.FieldValue.increment(-amount)
            });

            db.collection("players").doc(receiver).update({
                balance: firebase.firestore.FieldValue.increment(amount)
            });
        } else {
            alert("Nie masz wystarczających środków!");
        }
    });
}

// RESETOWANIE GRY (dla Banku)
function resetGame() {
    if (currentPlayer !== "Bank") {
        alert("Tylko Bank może resetować grę!");
        return;
    }

    db.collection("players").get().then((snapshot) => {
        snapshot.forEach((doc) => {
            db.collection("players").doc(doc.id).update({ balance: 1500 });
        });
    });
}
