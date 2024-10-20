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
const messaging = firebase.messaging();

// Użytkownicy i hasła
const users = {
  Tata: "dabek1983",
  Mama: "chuda1403",
  Kuba: "Kubus2008",
  Agatka: "Aga123"
};

// Sprawdzanie zalogowanego użytkownika w localStorage
const savedUser = localStorage.getItem('username');
if (savedUser) {
  document.getElementById('username').textContent = savedUser;
} else {
  const username = prompt('Podaj nazwę użytkownika');
  const password = prompt('Podaj hasło');
  
  // Sprawdzanie loginu i hasła
  if (users[username] && users[username] === password) {
    localStorage.setItem('username', username);
    document.getElementById('username').textContent = username;
  } else {
    alert('Błędny login lub hasło');
  }
}

// Wylogowanie
document.getElementById('logout').addEventListener('click', () => {
  localStorage.removeItem('username');
  location.reload();
});

// Dodawanie do listy zakupów
document.getElementById('add-item').addEventListener('click', () => {
  const newItem = document.getElementById('new-item').value;
  const username = localStorage.getItem('username');
  
  if (newItem && username) {
    db.collection('shoppingList').add({
      item: newItem,
      addedBy: username,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      document.getElementById('new-item').value = '';
      console.log('Dodano przedmiot do listy');
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

// Prośba o pozwolenie na powiadomienia
messaging.requestPermission()
  .then(() => messaging.getToken())
  .then((token) => {
    console.log('Token:', token);
    // Można zapisać token w bazie danych lub wykorzystać go do wysyłania powiadomień
  })
  .catch((err) => {
    console.error('Brak zgody na powiadomienia', err);
  });
