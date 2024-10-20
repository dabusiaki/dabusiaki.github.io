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

// Inicjalizacja Firestore
const db = firebase.firestore();

// Inicjalizacja Messaging
const messaging = firebase.messaging();

// Poproś o pozwolenie na powiadomienia
messaging.requestPermission()
  .then(() => messaging.getToken())
  .then((token) => {
    console.log('Token: ', token);
    // Możesz zapisać token użytkownika w bazie danych
  })
  .catch((err) => {
    console.error('Nie udało się uzyskać tokenu', err);
  });

// Odbieranie wiadomości
messaging.onMessage((payload) => {
  console.log('Powiadomienie przychodzące: ', payload);
  alert(`Nowe powiadomienie: ${payload.notification.title} - ${payload.notification.body}`);
});

// Dodaj przedmiot do listy zakupów
document.getElementById('add-item').addEventListener('click', () => {
  const newItem = document.getElementById('new-item').value;
  if (newItem) {
    db.collection('shoppingList').add({
      item: newItem,
      addedBy: 'Użytkownik', // Tutaj dodaj nazwę zalogowanego użytkownika
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      console.log('Dodano przedmiot do listy');
      document.getElementById('new-item').value = ''; // Wyczyść pole tekstowe
    }).catch((error) => {
      console.error('Błąd przy dodawaniu przedmiotu:', error);
    });
  }
});

// Wylogowanie
document.getElementById('logout').addEventListener('click', () => {
  // Wprowadź funkcję wylogowania
  console.log('Wylogowano');
});

// Pobieranie przedmiotów z Firestore i wyświetlanie na stronie
db.collection('shoppingList').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
  const shoppingList = document.getElementById('shopping-list');
  shoppingList.innerHTML = ''; // Wyczyść listę przed aktualizacją
  snapshot.forEach((doc) => {
    const item = doc.data().item;
    const addedBy = doc.data().addedBy;
    const li = document.createElement('li');
    li.textContent = `${item} (dodane przez ${addedBy})`;
    shoppingList.appendChild(li);
  });
});
