// Firebase konfiguracja
const firebaseConfig = {
  apiKey: "AIzaSyA04bN5121a28iLwRkJYG8uGTGcVQyFv1Y",
  authDomain: "rodzinkataski.firebaseapp.com",
  projectId: "rodzinkataski",
  storageBucket: "rodzinkataski.appspot.com",
  messagingSenderId: "921333004895",
  appId: "1:921333004895:web:b22bdf6d54a32a4838b9ea",
  measurementId: "G-JM7KL8KDEC"
};

// Inicjalizacja Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
const messaging = firebase.messaging();

// Autoryzacja
const users = {
  Tata: "dabek1983",
  Mama: "chuda1403",
  Kuba: "Kubus2008",
  Agatka: "Aga123"
};

// Sprawdź, czy użytkownik jest zalogowany
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById('username').textContent = user.displayName;
  } else {
    const username = prompt('Podaj nazwę użytkownika');
    const password = prompt('Podaj hasło');
    
    if (users[username] && users[username] === password) {
      // Logowanie
      auth.signInAnonymously().then(() => {
        auth.currentUser.updateProfile({
          displayName: username
        }).then(() => {
          document.getElementById('username').textContent = username;
        });
      });
    } else {
      alert('Błędny login lub hasło');
    }
  }
});

// Wylogowanie
document.getElementById('logout').addEventListener('click', () => {
  auth.signOut().then(() => {
    alert('Wylogowano');
    location.reload();
  });
});

// Prośba o pozwolenie na powiadomienia
messaging.requestPermission()
  .then(() => messaging.getToken())
  .then((token) => {
    console.log('Token: ', token);
    // Można zapisać token w bazie danych
  })
  .catch((err) => {
    console.error('Brak zgody na powiadomienia', err);
  });

// Dodawanie do listy zakupów
document.getElementById('add-item').addEventListener('click', () => {
  const newItem = document.getElementById('new-item').value;
  if (newItem) {
    db.collection('shoppingList').add({
      item: newItem,
      addedBy: auth.currentUser.displayName,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log('Dodano przedmiot do listy');
      document.getElementById('new-item').value = '';
    }).catch((error) => {
      console.error('Błąd przy dodawaniu przedmiotu:', error);
    });
  } else {
    alert('Wprowadź nazwę przedmiotu');
  }
});

// Pobieranie i wyświetlanie listy
db.collection('shoppingList').orderBy('timestamp', 'desc').onSnapshot(snapshot => {
  const shoppingList = document.getElementById('shopping-list');
  shoppingList.innerHTML = '';
  snapshot.forEach(doc => {
    const item = doc.data().item;
    const addedBy = doc.data().addedBy;
    const li = document.createElement('li');
    li.textContent = `${item} (dodane przez ${addedBy})`;
    shoppingList.appendChild(li);
  });
});
