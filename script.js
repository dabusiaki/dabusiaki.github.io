// Inicjalizacja Firebase
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

let currentUser = localStorage.getItem('currentUser');

// Obsługa logowania
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();  // Zapobiega odświeżeniu strony po wysłaniu formularza

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Prosty system logowania
  if ((username === 'Tata' && password === 'dabek1983') ||
      (username === 'Mama' && password === 'chuda1403') ||
      (username === 'Kuba' && password === 'Kubus2008') ||
      (username === 'Agatka' && password === 'Aga123')) {
    
    alert('Zalogowano jako ' + username);
    currentUser = username;  // Przypisanie zalogowanego użytkownika
    localStorage.setItem('currentUser', username);  // Zapisz użytkownika w localStorage
    document.getElementById('login').style.display = 'none';  // Ukrycie sekcji logowania
    document.getElementById('taskManager').style.display = 'block';  // Wyświetlenie sekcji zarządzania zadaniami

    // Wyświetl informację o zalogowanym użytkowniku
    document.getElementById('loggedInAs').innerText = `Zalogowano jako: ${username}`;
    document.getElementById('loggedInAs').style.display = 'block';  // Pokaż informację o zalogowanym użytkowniku

    // Jeśli Tata lub Mama, pokaż formularz dodawania zadań
    if (username === 'Tata' || username === 'Mama') {
      document.getElementById('addTaskForm').style.display = 'block';
    } else {
      document.getElementById('addTaskForm').style.display = 'none'; // Ukryj formularz dodawania zadań dla dzieci
    }

    loadTasks();  // Załaduj zadania z Firestore
    document.getElementById('logoutBtn').style.display = 'inline';  // Pokaż przycisk wylogowania
  } else {
    alert('Błędne dane logowania');
  }
});

// Wylogowywanie
document.getElementById('logoutBtn').addEventListener('click', function() {
  currentUser = null;
  localStorage.removeItem('currentUser');  // Usuń użytkownika z localStorage
  document.getElementById('login').style.display = 'block';  // Pokaż sekcję logowania
  document.getElementById('taskManager').style.display = 'none';  // Ukryj sekcję zarządzania zadaniami
  document.getElementById('addTaskForm').style.display = 'none';  // Ukryj formularz dodawania zadań
  document.getElementById('logoutBtn').style.display = 'none';  // Ukryj przycisk wylogowania
  document.getElementById('loggedInAs').style.display = 'none';  // Ukryj informację o zalogowanym użytkowniku
});

// Funkcja do ładowania zadań z Firestore
function loadTasks() {
  db.collection('tasks').onSnapshot((snapshot) => {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';  // Wyczyść listę przed dodaniem nowych zadań
    snapshot.forEach(doc => {
      const li = document.createElement('li');
      li.textContent = doc.data().task;  // Upewnij się, że masz pole 'task' w dokumentach
      
      // Dodaj przycisk do usuwania tylko dla rodziców
      if (currentUser === 'Tata' || currentUser === 'Mama') {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Usuń';
        deleteBtn.onclick = () => deleteTask(doc.id);
        li.appendChild(deleteBtn);
      }
      
      taskList.appendChild(li);
    });
  });
}

// Funkcja do dodawania zadań
document.getElementById('addTaskBtn').addEventListener('click', () => {
  const newTask = document.getElementById('newTask').value;
  if (newTask && (currentUser === 'Tata' || currentUser === 'Mama')) {
    db.collection('tasks').add({
      task: newTask
    }).then(() => {
      document.getElementById('newTask').value = '';  // Wyczyść pole po dodaniu
      alert('Zadanie dodane');
    }).catch((error) => {
      console.error('Błąd przy dodawaniu zadania: ', error);
    });
  } else if (newTask) {
    alert('Tylko rodzice mogą dodawać zadania.');
  }
});

// Funkcja do usuwania zadań
function deleteTask(taskId) {
  db.collection('tasks').doc(taskId).delete().then(() => {
    alert('Zadanie usunięte');
  }).catch((error) => {
    console.error('Błąd przy usuwaniu zadania: ', error);
  });
}
