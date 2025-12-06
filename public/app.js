/**
 * Browser-compatible application (JavaScript)
 * Communicates with Express API server
 */

let cacheHits = 0;

// API base URL
const API_BASE = '/api';

// Initialize the application
async function init() {
  await loadClients();
  await updateStats();
  await loadUsers();
}

async function loadClients() {
  try {
    const select = document.getElementById("clientId");
    if (!select) {
      console.error("Client select element not found");
      return;
    }

    // Show loading state
    select.innerHTML = '<option value="">Loading clients...</option>';
    select.disabled = true;

    const response = await fetch(`${API_BASE}/clients`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const clients = await response.json();
    
    if (!Array.isArray(clients)) {
      throw new Error("Invalid response format");
    }
    
    select.innerHTML = '<option value="">Select a client...</option>';
    select.disabled = false;
    
    if (clients.length === 0) {
      select.innerHTML = '<option value="">No clients available</option>';
      return;
    }
    
    clients.forEach((client) => {
      const option = document.createElement("option");
      option.value = client.id;
      option.textContent = client.name;
      select.appendChild(option);
    });
    
    console.log(`Loaded ${clients.length} clients`);
  } catch (error) {
    console.error("Error loading clients:", error);
    const select = document.getElementById("clientId");
    if (select) {
      select.innerHTML = '<option value="">Error loading clients</option>';
      select.disabled = false;
    }
    
    // Show error in alert
    const alertDiv = document.getElementById("addAlert");
    if (alertDiv) {
      alertDiv.innerHTML = `<div class="alert error">❌ Error loading clients. Please refresh the page. Error: ${error.message}</div>`;
    }
  }
}

async function updateStats() {
  try {
    const usersResponse = await fetch(`${API_BASE}/users`);
    const users = await usersResponse.json();
    
    const clientsResponse = await fetch(`${API_BASE}/clients`);
    const clients = await clientsResponse.json();
    
    document.getElementById("totalUsers").textContent = users.length.toString();
    document.getElementById("totalClients").textContent = clients.length.toString();
    document.getElementById("cacheHits").textContent = cacheHits.toString();
  } catch (error) {
    console.error("Error updating stats:", error);
  }
}

async function loadUsers() {
  const listDiv = document.getElementById("usersList");
  const loadingDiv = document.getElementById("listLoading");
  
  try {
    loadingDiv.style.display = "block";
    listDiv.innerHTML = "";
    
    const response = await fetch(`${API_BASE}/users`);
    const users = await response.json();
    cacheHits++;
    await updateStats();
    
    loadingDiv.style.display = "none";
    
    if (users.length === 0) {
      listDiv.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No users found. Add your first user!</p>';
      return;
    }
    
    users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
        <h3>${user.firstname} ${user.surname}</h3>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Client:</strong> ${user.client.name}</p>
        <p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>
        <span class="badge ${user.hasCreditLimit ? 'limited' : 'unlimited'}">
          ${user.hasCreditLimit ? `Credit: $${user.creditLimit.toLocaleString()}` : 'Unlimited Credit'}
        </span>
      `;
      listDiv.appendChild(card);
    });
  } catch (error) {
    loadingDiv.style.display = "none";
    listDiv.innerHTML = `<div class="alert error">Error loading users: ${error}</div>`;
  }
}

// Form submission
document.getElementById("addUserForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const firstname = document.getElementById("firstname").value;
  const surname = document.getElementById("surname").value;
  const email = document.getElementById("email").value;
  const dateOfBirth = document.getElementById("dateOfBirth").value;
  const clientId = document.getElementById("clientId").value;
  
  const alertDiv = document.getElementById("addAlert");
  
  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstname,
        surname,
        email,
        dateOfBirth,
        clientId
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alertDiv.innerHTML = `<div class="alert success">✅ User added successfully! ${result.user.firstname} ${result.user.surname}</div>`;
      document.getElementById("addUserForm").reset();
      await loadUsers();
      await updateStats();
    } else {
      alertDiv.innerHTML = `<div class="alert error">❌ Error: ${result.error}</div>`;
    }
  } catch (error) {
    alertDiv.innerHTML = `<div class="alert error">❌ Error: ${error}</div>`;
  }
});

// Search function
async function searchUser() {
  const email = document.getElementById("searchEmail").value;
  const resultDiv = document.getElementById("searchResult");
  
  if (!email) {
    resultDiv.innerHTML = '<div class="alert error">Please enter an email address</div>';
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/users/email/${encodeURIComponent(email)}`);
    
    if (response.ok) {
      const user = await response.json();
      cacheHits++;
      await updateStats();
      
      resultDiv.innerHTML = `
        <div class="user-card">
          <h3>${user.firstname} ${user.surname}</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Client:</strong> ${user.client.name}</p>
          <p><strong>Date of Birth:</strong> ${new Date(user.dateOfBirth).toLocaleDateString()}</p>
          <span class="badge ${user.hasCreditLimit ? 'limited' : 'unlimited'}">
            ${user.hasCreditLimit ? `Credit: $${user.creditLimit.toLocaleString()}` : 'Unlimited Credit'}
          </span>
        </div>
      `;
    } else {
      resultDiv.innerHTML = '<div class="alert error">User not found</div>';
    }
  } catch (error) {
    resultDiv.innerHTML = `<div class="alert error">Error: ${error}</div>`;
  }
}

// Tab switching
window.showTab = function(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab
  document.getElementById(`${tabName}Tab`).classList.add('active');
  event.target.classList.add('active');
  
  // Load data if needed
  if (tabName === 'list') {
    loadUsers();
  }
};

// Make searchUser available globally
window.searchUser = searchUser;

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    init().catch(console.error);
  });
} else {
  init().catch(console.error);
}

