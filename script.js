// Konfiguracja Firebase – korzystamy z wersji 8.10.0
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
// Kolekcja graczy w Firestore
const playersRef = db.collection("players");

// Użytkownik nie musi się logować hasłem – każdy wpisuje tylko swoją nazwę.
// Jeśli gracz wpisze "Bank", dodatkowy panel zostanie wyświetlony.
let currentPlayer = localStorage.getItem("monopolyUser") || "";

// Funkcja dołączenia do gry
function joinGame() {
  const name = document.getElementById("playerName").value.trim();
  if (!name) {
    alert("Wpisz swoją nazwę!");
    return;
  }
  currentPlayer = name;
  localStorage.setItem("monopolyUser", name);
  // Każdy gracz zaczyna z saldem 1500 (jeśli jeszcze nie ma wpisu)
  playersRef.doc(name).set({ balance: 1500 }, { merge: true })
    .then(() => loginUser(name));
}

// Funkcja logująca – ukrywa sekcję logowania, pokazuje sekcję gry oraz panel Bank, jeśli dotyczy.
function loginUser(name) {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("gameSection").style.display = "block";
  document.getElementById("logoutBtn").style.display = "block";
  if (name === "Bank") {
    document.getElementById("bankSection").style.display = "block";
  }
  updatePlayerList();
  requestNotificationPermission();
}

// Funkcja aktualizująca listę graczy – nasłuchuje zmian w Firestore
function updatePlayerList() {
  playersRef.onSnapshot(snapshot => {
    const playersList = document.getElementById("playersList");
    const recipientSelect = document.getElementById("recipient");
    playersList.innerHTML = "";
    recipientSelect.innerHTML = "";
    snapshot.forEach(doc => {
      const player = doc.id;
      const balance = doc.data().balance;
      // Wyświetlamy gracza i jego saldo
      let li = document.createElement("li");
      li.textContent = `${player}: $${balance}`;
      playersList.appendChild(li);
      // Jeśli to nie jest aktualny gracz, dodajemy go do listy odbiorców przelewu
      if (player !== currentPlayer) {
        let option = document.createElement("option");
        option.value = player;
        option.textContent = player;
        recipientSelect.appendChild(option);
      }
    });
  });
}

// Funkcja przelewu pieniędzy między graczami
function transferMoney() {
  const to = document.getElementById("recipient").value;
  const amount = parseInt(document.getElementById("amount").value);
  if (!to || isNaN(amount) || amount <= 0) {
    alert("Wpisz poprawną kwotę i odbiorcę!");
    return;
  }
  const fromDoc = playersRef.doc(currentPlayer);
  const toDoc = playersRef.doc(to);
  db.runTransaction(async transaction => {
    const fromSnap = await transaction.get(fromDoc);
    if (!fromSnap.exists) return;
    let fromBalance = fromSnap.data().balance;
    if (fromBalance < amount) {
      alert("Za mało pieniędzy!");
      return;
    }
    transaction.update(fromDoc, { balance: fromBalance - amount });
    const toSnap = await transaction.get(toDoc);
    if (toSnap.exists) {
      let toBalance = toSnap.data().balance;
      transaction.update(toDoc, { balance: toBalance + amount });
    }
  }).then(() => {
    alert("Przelew wykonany!");
  }).catch(error => {
    console.error("Błąd przy przelewie:", error);
  });
}

// Funkcja resetująca grę – dostępna tylko dla gracza "Bank"
function resetGame() {
  if (currentPlayer !== "Bank") {
    alert("Tylko konto Bank może resetować grę!");
    return;
  }
  playersRef.get().then(snapshot => {
    snapshot.forEach(doc => {
      doc.ref.update({ balance: 1500 });
    });
    alert("Gra zresetowana!");
  });
}

// Funkcja wylogowania
function logout() {
  localStorage.removeItem("monopolyUser");
  location.reload();
}

// Funkcja żądająca pozwolenia na powiadomienia (Firebase Messaging)
function requestNotificationPermission() {
  const messaging = firebase.messaging();
  messaging.requestPermission()
    .then(() => messaging.getToken())
    .then(token => {
      console.log("Token:", token);
      // Zapisujemy token użytkownika w dokumencie gracza, żeby ewentualnie móc wysyłać powiadomienia\n      playersRef.doc(currentPlayer).set({ token: token }, { merge: true });
    })
    .catch(err => {
      console.error("Brak zgody na powiadomienia", err);
    });
}

// Jeśli użytkownik jest już zalogowany, automatycznie go logujemy
if (currentPlayer) {
  loginUser(currentPlayer);
}
</script>
