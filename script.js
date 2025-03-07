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
const MAX_LOAN = 5000000;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('joinButton').addEventListener('click', joinGame);
    document.getElementById('sendButton').addEventListener('click', sendMoney);
    document.getElementById('takeLoanButton').addEventListener('click', takeLoan);
    document.getElementById('repayButton').addEventListener('click', repayLoan);
    document.getElementById('startBonusButton').addEventListener('click', addStartBonus);
    document.getElementById('deletePlayerButton').addEventListener('click', deletePlayer);
    document.getElementById('resetButton').addEventListener('click', resetGame);
});

function formatMoney(amount) {
    return amount?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
}

async function joinGame() {
    const playerName = document.getElementById("playerName").value.trim();
    if (!playerName) return alert("Podaj nazwę!");

    currentPlayer = playerName;
    document.getElementById("login").style.display = "none";
    document.getElementById("game").style.display = "block";
    document.getElementById("currentPlayerName").textContent = playerName;

    // Inicjalizacja Banku
    const bankRef = db.collection("players").doc("Bank");
    if (!(await bankRef.get()).exists) {
        await bankRef.set({ balance: BANK_BALANCE, loans: {} });
    }

    // Inicjalizacja gracza
    if (playerName !== "Bank") {
        const playerRef = db.collection("players").doc(playerName);
        if (!(await playerRef.get()).exists) {
            await playerRef.set({ 
                balance: INITIAL_BALANCE,
                loan: 0 
            });
        }
    }

    loadPlayers();
    loadTransactions();
}

function loadPlayers() {
    db.collection("players").onSnapshot(snapshot => {
        const playersList = document.getElementById("players");
        const playersDropdown = document.getElementById("playersList");
        const bankDropdown = document.getElementById("bankPlayersList");

        playersList.innerHTML = "";
        playersDropdown.innerHTML = "";
        bankDropdown.innerHTML = "";

        snapshot.forEach(doc => {
            const player = doc.id;
            const data = doc.data();

            // Pomijaj Bank na liście graczy
            if (player !== "Bank") {
                const li = document.createElement("li");
                li.innerHTML = `
                    ${player}: 
                    <strong>${formatMoney(data.balance)} $</strong>
                    ${data.loan ? `<span class="loan">(Pożyczka: ${formatMoney(data.loan)} $)</span>` : ""}
                `;
                playersList.appendChild(li);

                if (player !== currentPlayer) {
                    const option = document.createElement("option");
                    option.value = player;
                    option.textContent = player;
                    playersDropdown.appendChild(option);
                }
            }

            // Lista dla Banku (wszyscy gracze)
            const bankOption = document.createElement("option");
            bankOption.value = player;
            bankOption.textContent = player;
            bankDropdown.appendChild(bankOption);

            // Aktualizuj UI obecnego gracza
            if (player === currentPlayer) {
                document.getElementById("balance").textContent = formatMoney(data.balance);
                document.getElementById("currentLoan").textContent = formatMoney(data.loan || 0);
            }
        });

        // Pokazuj panel Banku
        if (currentPlayer === "Bank") {
            document.getElementById("bankControls").style.display = "block";
            document.getElementById("playerControls").style.display = "none";
        }
    });
}

async function sendMoney() {
    const amount = Number(document.getElementById("amount").value);
    const receiver = document.getElementById("playersList").value;
    
    if (!amount || amount <= 0) return alert("Nieprawidłowa kwota!");
    if (receiver === currentPlayer) return alert("Nie możesz przelać do siebie!");

    try {
        await db.runTransaction(async t => {
            const senderRef = db.collection("players").doc(currentPlayer);
            const receiverRef = db.collection("players").doc(receiver);
            
            const senderDoc = await t.get(senderRef);
            if (senderDoc.data().balance < amount) throw new Error("Brak środków!");

            t.update(senderRef, { balance: firebase.firestore.FieldValue.increment(-amount) });
            t.update(receiverRef, { balance: firebase.firestore.FieldValue.increment(amount) });

            await db.collection("transactions").add({
                type: "TRANSFER",
                from: currentPlayer,
                to: receiver,
                amount: amount,
                timestamp: new Date()
            });
        });
        alert("Przelew wykonany!");
    } catch (error) {
        alert(error.message);
    }
}

async function takeLoan() {
    const amount = Number(document.getElementById("loanAmount").value);
    if (!amount || amount <= 0 || amount > MAX_LOAN) return alert("Nieprawidłowa kwota!");

    try {
        await db.runTransaction(async t => {
            const playerRef = db.collection("players").doc(currentPlayer);
            const bankRef = db.collection("players").doc("Bank");
            
            const playerDoc = await t.get(playerRef);
            const newLoan = (playerDoc.data().loan || 0) + amount;
            if (newLoan > MAX_LOAN) throw new Error("Przekroczono limit pożyczki!");

            t.update(playerRef, {
                balance: firebase.firestore.FieldValue.increment(amount),
                loan: firebase.firestore.FieldValue.increment(amount)
            });
            
            t.update(bankRef, {
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
        alert(error.message);
    }
}

async function repayLoan() {
    const amount = Number(document.getElementById("repayAmount").value);
    if (!amount || amount <= 0) return alert("Nieprawidłowa kwota!");

    try {
        await db.runTransaction(async t => {
            const playerRef = db.collection("players").doc(currentPlayer);
            const bankRef = db.collection("players").doc("Bank");
            
            const playerDoc = await t.get(playerRef);
            const currentLoan = playerDoc.data().loan || 0;
            if (amount > currentLoan) throw new Error("Kwota większa niż zadłużenie!");
            if (playerDoc.data().balance < amount) throw new Error("Brak środków!");

            t.update(playerRef, {
                balance: firebase.firestore.FieldValue.increment(-amount),
                loan: firebase.firestore.FieldValue.increment(-amount)
            });
            
            t.update(bankRef, {
                balance: firebase.firestore.FieldValue.increment(amount)
            });

            await db.collection("transactions").add({
                type: "LOAN_REPAYMENT",
                from: currentPlayer,
                to: "Bank",
                amount: amount,
                timestamp: new Date()
            });
        });
        alert("Spłata wykonana!");
    } catch (error) {
        alert(error.message);
    }
}

async function addStartBonus() {
    const player = document.getElementById("bankPlayersList").value;
    if (player === "Bank") return;

    try {
        await db.collection("players").doc(player).update({
            balance: firebase.firestore.FieldValue.increment(2000000)
        });
        
        await db.collection("transactions").add({
            type: "BONUS",
            from: "Bank",
            to: player,
            amount: 2000000,
            timestamp: new Date()
        });
        
        alert("Bonus dodany!");
    } catch (error) {
        alert("Błąd: " + error.message);
    }
}

async function deletePlayer() {
    const player = document.getElementById("bankPlayersList").value;
    if (player === "Bank") return alert("Nie możesz usunąć Banku!");
    if (!confirm(`Usunąć gracza ${player}?`)) return;

    try {
        // Usuń gracza
        await db.collection("players").doc(player).delete();
        
        // Usuń powiązane transakcje
        const transactions = await db.collection("transactions")
            .where("from", "==", player)
            .get();
        
        transactions.forEach(async doc => {
            await doc.ref.delete();
        });
        
        alert("Gracz usunięty!");
    } catch (error) {
        alert("Błąd: " + error.message);
    }
}

async function resetGame() {
    if (!confirm("Czy na pewno chcesz zresetować grę?")) return;

    try {
        // Resetuj wszystkich graczy
        const players = await db.collection("players").get();
        players.forEach(async doc => {
            if (doc.id === "Bank") {
                await doc.ref.update({ balance: BANK_BALANCE });
            } else {
                await doc.ref.update({ 
                    balance: INITIAL_BALANCE,
                    loan: 0 
                });
            }
        });

        // Usuń wszystkie transakcje
        const transactions = await db.collection("transactions").get();
        transactions.forEach(async doc => {
            await doc.ref.delete();
        });

        alert("Gra zresetowana!");
    } catch (error) {
        alert("Błąd: " + error.message);
    }
}

function loadTransactions() {
    db.collection("transactions")
        .orderBy("timestamp", "desc")
        .limit(10)
        .onSnapshot(snapshot => {
            const list = document.getElementById("transactions");
            list.innerHTML = "";
            
            snapshot.forEach(doc => {
                const t = doc.data();
                const li = document.createElement("li");
                li.innerHTML = `
                    <span class="date">${t.timestamp.toDate().toLocaleString()}</span>
                    <span class="type">${getTransactionType(t.type)}</span>
                    ${t.from} → ${t.to}
                    <span class="amount">${formatMoney(t.amount)} $</span>
                `;
                list.appendChild(li);
            });
        });
}

function getTransactionType(type) {
    const types = {
        LOAN: "🏦 POŻYCZKA",
        LOAN_REPAYMENT: "💳 SPŁATA",
        TRANSFER: "💸 PRZELEW",
        BONUS: "🎁 BONUS"
    };
    return types[type] || type;
}
