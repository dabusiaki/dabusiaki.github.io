// Konfiguracja Firebase
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

let currentUser = null;  // Zmienna przechowująca aktualnie zalogowanego użytkownika

// Obsługa logowania
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();  // Zapobiega odświeżeniu strony po wysłaniu formularza
  const username = document.getElementById('username').value;  // Pobranie nazwy użytkownika
  const password = document.getElementById('password').value;  // Pobranie hasła

  // Prosty system logowania
  if ((username === 'Tata' && password === 'dabek1983') ||
      (username === 'Mama' && password === 'chuda1403') ||
      (username === 'Kuba' && password === 'Kubus2008') ||
      (username === 'Agatka' && password === 'Aga123')) {
    
    alert('Zalogowano jako ' + username);
    currentUser = username;  // Przypisanie zalogowanego użytkownika
    document.getElementById('login').style.display = 'none';  // Ukrycie sekcji logowania
    document.getElementById('taskManager').style.display = 'block';  // Wyświetlenie sekcji zarządzania zadaniami
    
    // Jeśli Tata lub Mama, pokaż formularz dodawania zadań
    if (username === 'Tata' || username === 'Mama') {
      document.getElementById('addTaskForm').style.display = 'block';
    }

    loadTasks();  // Załaduj zadania z Firestore
  } else {
    alert('Błędne dane logowania');
  }
});

// Dodawanie nowego zadania (tylko dla Taty i Mamy)
document.getElementById('addTaskBtn').addEventListener('click', function() {
  const taskName = document.getElementById('newTask').value;  // Pobranie nazwy nowego zadania
  if (taskName) {
    db.collection('tasks').add({
      name: taskName,
      done: false,  // Domyślnie zadanie nie jest wykonane
      addedBy: currentUser  // Zapisanie, kto dodał zadanie
    }).then(() => {
      document.getElementById('newTask').value = '';  // Wyczyść pole tekstowe po dodaniu zadania
    });
  }
});

// Ładowanie i aktualizowanie listy zadań
function loadTasks() {
  db.collection('tasks').onSnapshot((snapshot) => {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';  // Wyczyść listę przed jej aktualizacją
    snapshot.docs.forEach(doc => {
      const task = doc.data();
      const taskId = doc.id;

      const li = document.createElement('li');
      li.textContent = `${task.name} (dodane przez: ${task.addedBy})`;

      // Dodaj przycisk "Oznacz jako zrobione" dla Kuby i Agatki, jeśli zadanie nie zostało wykonane
      if (!task.done && (currentUser === 'Kuba' || currentUser === 'Agatka')) {
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Oznacz jako zrobione';
        doneButton.addEventListener('click', function() {
          markTaskAsDone(taskId);  // Funkcja do oznaczenia zadania jako wykonane
        });
        li.appendChild(doneButton);
      } else if (task.done) {
        li.textContent += ` - wykonane przez ${task.doneBy}`;
      }

      taskList.appendChild(li);
    });
  });
}

// Oznaczanie zadania jako wykonane (tylko dla Kuby i Agatki)
function markTaskAsDone(taskId) {
  db.collection('tasks').doc(taskId).update({
    done: true,  // Oznacz zadanie jako wykonane
    doneBy: currentUser  // Zapisz, kto oznaczył zadanie jako wykonane
  });
}
