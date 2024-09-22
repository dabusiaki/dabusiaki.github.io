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

let currentUser = null;

// Obsługa logowania
document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Prosty system logowania
  if ((username === 'Tata' && password === 'dabek1983') ||
      (username === 'Mama' && password === 'chuda1403') ||
      (username === 'Kuba' && password === 'Kubus2008') ||
      (username === 'Agatka' && password === 'Aga123')) {
    
    alert('Zalogowano jako ' + username);
    currentUser = username;
    document.getElementById('login').style.display = 'none';
    document.getElementById('taskManager').style.display = 'block';
    
    // Jeśli Tata lub Mama, pokaż formularz do dodawania zadań
    if (username === 'Tata' || username === 'Mama') {
      document.getElementById('addTaskForm').style.display = 'block';
    }

    loadTasks();
  } else {
    alert('Błędne dane logowania');
  }
});

// Dodawanie nowego zadania (dla Taty i Mamy)
document.getElementById('addTaskBtn').addEventListener('click', function() {
  const taskName = document.getElementById('newTask').value;
  if (taskName) {
    db.collection('tasks').add({
      name: taskName,
      done: false,
      addedBy: currentUser
    }).then(() => {
      document.getElementById('newTask').value = '';
    });
  }
});

// Ładowanie i aktualizowanie listy zadań
function loadTasks() {
  db.collection('tasks').onSnapshot((snapshot) => {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    snapshot.docs.forEach(doc => {
      const task = doc.data();
      const taskId = doc.id;

      const li = document.createElement('li');
      li.textContent = `${task.name} (dodane przez: ${task.addedBy})`;

      if (!task.done && (currentUser === 'Kuba' || currentUser === 'Agatka')) {
        const doneButton = document.createElement('button');
        doneButton.textContent = 'Oznacz jako zrobione';
        doneButton.addEventListener('click', function() {
          markTaskAsDone(taskId);
        });
        li.appendChild(doneButton);
      } else if (task.done) {
        li.textContent += ` - wykonane przez ${task.doneBy}`;
      }

      taskList.appendChild(li);
    });
  });
}

// Oznaczanie zadania jako zrobione (dla Kuby i Agatki)
function markTaskAsDone(taskId) {
  db.collection('tasks').doc(taskId).update({
    done: true,
    doneBy: currentUser
  });
}
