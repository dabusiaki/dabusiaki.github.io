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

async function takeLoan() {
    const amount = parseInt(document.getElementById("loanAmount").value);
    const playerRef = db.collection("players").doc(currentPlayer);
    const bankRef = db.collection("players").doc("Bank");
    
    if (!amount || amount <= 0 || amount > MAX_LOAN) {
        alert("Nieprawidłowa kwota pożyczki!");
        return;
    }

    try {
        await db.runTransaction(async (transaction) => {
            const playerDoc = await transaction.get(playerRef);
            const bankDoc = await transaction.get(bankRef);
            
            const currentLoan = playerDoc.data().loan || 0;
            if (currentLoan + amount > MAX_LOAN) {
                alert("Przekroczono limit pożyczki!");
                return;
            }

            transaction.update(playerRef, {
                balance: firebase.firestore.FieldValue.increment(amount),
                loan: firebase.firestore.FieldValue.increment(amount)
            });

            transaction.update(bankRef, {
                balance: firebase.firestore.FieldValue.increment(-amount)
            });

            await db.collection("transactions").add({
                type: "LOAN",
                from: "Bank",
                to: currentPlayer,
                amount: amount,
                timestamp: new Date()
            });
        });
        
        alert("Pożyczka przyznana!");
    } catch (error) {
        console.error("Błąd przyznawania pożyczki:", error);
    }
}

async function deletePlayer() {
    if (currentPlayer !== "Bank") return;
    
    const selectedPlayer = document.getElementById("bankPlayersList").value;
    if (selectedPlayer === "Bank") {
        alert("Nie możesz usunąć Banku!");
        return;
    }

    if (confirm(`Czy na pewno chcesz usunąć gracza ${selectedPlayer}?`)) {
        try {
            await db.collection("players").doc(selectedPlayer).delete();
            await db.collection("transactions").where("to", "==", selectedPlayer).get()
                .then(snapshot => snapshot.forEach(doc => doc.ref.delete()));
            alert("Gracz usunięty!");
        } catch (error) {
            console.error("Błąd usuwania gracza:", error);
        }
    }
}

// Pozostałe funkcje (sendMoney, addStartBonus, loadTransactions, resetGame) pozostają jak w poprzedniej wersji
// z dodaniem formatMoney w odpowiednich miejscach np.:
document.getElementById("balance").textContent = formatMoney(data.balance);
