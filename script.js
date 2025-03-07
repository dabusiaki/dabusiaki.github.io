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
const INITIAL_BALANCE = 15000000;
const BANK_BALANCE = 1000000000;
const START_BONUS = 2000000;
const MAX_LOAN = 5000000;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('joinButton').addEventListener('click', joinGame);
    document.getElementById('sendButton').addEventListener('click', sendMoney);
    document.getElementById('startBonusButton').addEventListener('click', addStartBonus);
    document.getElementById('takeLoanButton').addEventListener('click', takeLoan);
    document.getElementById('deletePlayerButton').addEventListener('click', deletePlayer);
});

// Funkcja formatująca kwoty
function formatMoney(amount) {
    if (!amount) return "0";
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

async function joinGame() {
    const playerName = document.getElementById("playerName").value.trim();
    if (!playerName) {
        alert("Podaj swoją nazwę!");
        return;
    }

    currentPlayer = playerName;
    document.getElementById("currentPlayerName").textContent = playerName;
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";

    // Inicjalizacja Banku
    const bankRef = db.collection("players").doc("Bank");
    const bankDoc = await bankRef.get();
    if (!bankDoc.exists) {
        await bankRef.set({ 
            balance: BANK_BALANCE,
            loanGiven: 0 
        });
    }

    // Inicjalizacja gracza
    const playerRef = db.collection("players").doc(playerName);
    const playerDoc = await playerRef.get();
    if (!playerDoc.exists && playerName !== "Bank") {
        await playerRef.set({ 
            balance: INITIAL_BALANCE,
            loan: 0 
        });
    }

    loadPlayers();
    loadTransactions();
}

function loadPlayers() {
    db.collection("players").onSnapshot((snapshot) => {
        const playersList = document.getElementById("players");
        const playersDropdown = document.getElementById("playersList");
        const bankPlayersDropdown = document.getElementById("bankPlayersList");
        
        playersList.innerHTML = "";
        playersDropdown.innerHTML = "";
        bankPlayersDropdown.innerHTML = "";

        snapshot.forEach((doc) => {
            const player = doc.id;
            const data = doc.data();
            
            if (player !== "Bank") {
                const li = document.createElement("li");
                li.textContent = `${player}: ${formatMoney(data.balance)} $ (Pożyczka: ${formatMoney(data.loan)} $)`;
                playersList.appendChild(li);

                if (player !== currentPlayer) {
                    const option = document.createElement("option");
                    option.value = player;
                    option.textContent = player;
                    playersDropdown.appendChild(option);
                }
            }

            const bankOption = document.createElement("option");
            bankOption.value = player;
            bankOption.textContent = player;
            bankPlayersDropdown.appendChild(bankOption);

            if (player === currentPlayer) {
                document.getElementById("balance").textContent = formatMoney(data.balance);
                const availableLoan = MAX_LOAN - (data.loan || 0);
                document.getElementById("availableLoan").textContent = formatMoney(availableLoan);
            }
        });

        if (currentPlayer === "Bank") {
            document.getElementById("bankControls").style.display = "block";
            document.getElementById("playerControls").style.display = "none";
        }
    });
}

async function sendMoney() {
    const amount = parseInt(document.getElementById("amount").value);
    const receiver = document.getElementById("playersList").value;

    if (!amount || amount <= 0) {
        alert("Podaj poprawną kwotę!");
        return;
    }

    const transaction = {
        from: currentPlayer,
        to: receiver,
        amount: amount,
        timestamp: new Date()
    };

    try {
        await db.runTransaction(async (transaction) => {
            const fromRef = db.collection("players").doc(currentPlayer);
            const fromDoc = await transaction.get(fromRef);
            
            if (fromDoc.data().balance >= amount) {
                transaction.update(fromRef, { balance: firebase.firestore.FieldValue.increment(-amount) });
                transaction.update(db.collection("players").doc(receiver), { balance: firebase.firestore.FieldValue.increment(amount) });
                await db.collection("transactions").add(transaction);
            } else {
                alert("Nie masz wystarczających środków!");
            }
        });
    } catch (error) {
        console.error("Błąd transakcji:", error);
    }
}

async function addStartBonus() {
    if (currentPlayer !== "Bank") return;
    
    const selectedPlayer = document.getElementById("bankPlayersList").value;
    const transaction = {
        from: "Bank",
        to: selectedPlayer,
        amount: START_BONUS,
        timestamp: new Date()
    };

    try {
        await db.collection("players").doc(selectedPlayer).update({
            balance: firebase.firestore.FieldValue.increment(START_BONUS)
        });
        await db.collection("transactions").add(transaction);
        loadTransactions();
    } catch (error) {
        console.error("Błąd dodawania bonusu:", error);
    }
}

function loadTransactions() {
    db.collection("transactions")
        .orderBy("timestamp", "desc")
        .limit(10)
        .onSnapshot((snapshot) => {
            const transactionsList = document.getElementById("transactions");
            transactionsList.innerHTML = "";
            
            snapshot.forEach(doc => {
                const transaction = doc.data();
                const li = document.createElement("li");
                li.textContent = `${transaction.timestamp.toDate().toLocaleString()}: ${transaction.from} → ${transaction.to} (${formatMoney(transaction.amount)} $)`;
                transactionsList.appendChild(li);
            });
        });
}

async function resetGame() {
    if (currentPlayer !== "Bank") return;

    const players = await db.collection("players").get();
    players.forEach(async (doc) => {
        if (doc.id === "Bank") {
            await doc.ref.update({ balance: BANK_BALANCE });
        } else {
            await doc.ref.update({ balance: INITIAL_BALANCE });
        }
    });
    
    // Usuń wszystkie transakcje
    const transactions = await db.collection("transactions").get();
    transactions.forEach(async (doc) => {
        await doc.ref.delete();
    });
}

// Pozostałe funkcje (takeLoan, deletePlayer) pozostają bez zmian
