const API_BASE = "http://localhost:8080"; // CHANGE TO YOUR BACKEND PORT IF NEEDED

// ==================== HOME PAGE - TOOLS ====================
async function fetchTools() {
  const category = document.getElementById("categoryFilter")?.value || "";
  const pricing = document.getElementById("pricingFilter")?.value || "";
  const minRating = document.getElementById("minRatingFilter")?.value || "";

  let url = `${API_BASE}/tools?`;
  if (category) url += `category=${category}&`;
  if (pricing) url += `pricing=${pricing}&`;
  if (minRating) url += `min_rating=${minRating}`;

  const res = await fetch(url);
  const tools = await res.json();

  const grid = document.getElementById("toolsGrid");
  grid.innerHTML = tools.map(tool => `
    <div class="group card bg-white shadow-md hover:shadow-2xl hover:-translate-y-3 transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer">
      <div class="p-5 flex flex-col h-full">
        <!-- Tool Name -->
        <h3 class="text-lg font-bold text-gray-800 mb-2 group-hover:text-primary transition-colors">
          ${tool.name}
        </h3>
        
        <!-- Use Case -->
        <p class="text-sm text-gray-600 mb-5 flex-grow line-clamp-3 group-hover:text-gray-700 transition-colors">
          ${tool.use_case}
        </p>
        
        <!-- Badges -->
        <div class="flex flex-wrap gap-2 mb-5 text-xs">
          <span class="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 group-hover:bg-gray-200 transition-colors">
            ${tool.category}
          </span>
          <span class="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 group-hover:bg-gray-200 transition-colors">
            ${tool.pricing_type}
          </span>
          <span class="px-3 py-1.5 bg-gray-100 rounded-full text-gray-700 group-hover:bg-gray-200 transition-colors">
            ⭐ ${tool.rating.toFixed(1)}
          </span>
        </div>
        
        <!-- Button -->
        <a href="tool-detail.html?id=${tool.id}" 
           class="btn btn-primary mt-auto w-full text-center py-3 rounded-xl font-semibold 
                  group-hover:bg-primary-dark group-hover:scale-105 transition-all duration-300">
          View Details
        </a>
      </div>
    </div>
  `).join("");

  // Populate filters dynamically
  const catSelect = document.getElementById("categoryFilter");
  const priceSelect = document.getElementById("pricingFilter");

  if (catSelect && catSelect.children.length === 1) {
    const categories = [...new Set(tools.map(t => t.category))].sort();
    categories.forEach(cat => catSelect.innerHTML += `<option>${cat}</option>`);
  }

  if (priceSelect && priceSelect.children.length === 1) {
    const pricings = [...new Set(tools.map(t => t.pricing_type))].sort();
    pricings.forEach(price => priceSelect.innerHTML += `<option>${price}</option>`);
  }
}

// ==================== TOOL DETAIL PAGE ====================
async function fetchToolDetail(id) {
  try {
    const res = await fetch(`${API_BASE}/tools`);
    const tools = await res.json();
    const tool = tools.find(t => t.id == id);

    if (!tool) {
      document.getElementById("toolDetail").innerHTML = "<p class='text-error text-center py-8 text-2xl'>Tool not found</p>";
      return;
    }

    document.getElementById("toolDetail").innerHTML = `
      <div class="text-center mb-10">
        <h1 class="text-5xl font-bold mb-6 text-primary">${tool.name}</h1>
        
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <span class="badge badge-lg badge-outline text-primary border-primary font-medium px-5 py-3">
            ${tool.category}
          </span>
          <span class="badge badge-lg font-medium px-5 py-3 ${
            tool.pricing_type.toLowerCase() === 'free' ? 'bg-success text-white' :
            tool.pricing_type.toLowerCase() === 'paid' ? 'bg-error text-white' :
            'bg-warning text-white'
          }">
            ${tool.pricing_type}
          </span>
          <span class="badge badge-lg bg-info text-white font-bold px-5 py-3">
            ⭐ ${tool.rating.toFixed(1)} / 5.0
          </span>
        </div>

        <p class="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-10 px-4">
          ${tool.use_case || "No description available."}
        </p>

        ${tool.url ? `
          <a href="${tool.url}" target="_blank" rel="noopener" 
             class="btn btn-primary btn-lg px-10 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all">
            Visit Tool Website →
          </a>
        ` : '<p class="text-gray-500 text-lg">No website link provided.</p>'}
      </div>
    `;

    // Load approved reviews
    const token = localStorage.getItem("adminToken");
    let allReviews = [];
    if (token) {
      const revRes = await fetch(`${API_BASE}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (revRes.ok) allReviews = await revRes.json();
    }

    const approved = allReviews.filter(r => r.tool_id == id && r.status === "approved");
    const reviewsList = document.getElementById("reviewsList");

    if (approved.length === 0) {
      reviewsList.innerHTML = "<p class='text-center text-gray-500 py-10 text-xl'>No reviews yet. Be the first to review!</p>";
    } else {
      reviewsList.innerHTML = approved.map(r => `
        <div class="card bg-base-100 shadow-lg p-6 mb-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="text-3xl">${"⭐".repeat(r.user_rating)}</div>
            <span class="text-lg font-medium">${r.user_rating}.0 / 5.0</span>
          </div>
          <p class="text-gray-700 text-lg">${r.comment || "<em>No comment</em>"}</p>
        </div>
      `).join("");
    }

  } catch (error) {
    console.error("Error loading tool detail:", error);
    document.getElementById("toolDetail").innerHTML = "<p class='text-error text-center'>Error loading tool</p>";
  }
}

async function submitReview() {
  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id');
  const rating = document.getElementById("userRating").value;
  const comment = document.getElementById("comment").value;

  if (!rating || rating < 1 || rating > 5) {
    document.getElementById("reviewMessage").textContent = "Rating 1-5 required";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool_id: parseInt(toolId),
        user_rating: parseInt(rating),
        comment: comment || null
      })
    });

    if (res.ok) {
      document.getElementById("reviewMessage").innerHTML = 
        "<p class='text-success text-center font-bold'>Review submitted successfully! Awaiting moderator approval.</p>";
      document.getElementById("userRating").value = "";
      document.getElementById("comment").value = "";
    } else {
      document.getElementById("reviewMessage").textContent = "Error submitting review";
    }
  } catch (error) {
    document.getElementById("reviewMessage").textContent = "Network error";
  }
}

// ==================== ADMIN FUNCTIONS ====================
async function adminLogin() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData
  });

  if (res.ok) {
    const data = await res.json();
    localStorage.setItem("adminToken", data.access_token);
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("adminDashboard").classList.remove("hidden");
    loadAdminData();
  } else {
    document.getElementById("loginMessage").textContent = "Invalid credentials";
  }
}

function logout() {
  localStorage.removeItem("adminToken");
  document.getElementById("adminDashboard").classList.add("hidden");
  document.getElementById("loginForm").classList.remove("hidden");
}

async function loadAdminData() {
  fetchAdminTools();
  fetchAdminReviews();
}

async function fetchAdminTools() {
  const res = await fetch(`${API_BASE}/tools`);
  const tools = await res.json();

  const list = document.getElementById("adminToolsList");
  list.innerHTML = tools.map(tool => `
    <div class="card bg-base-200 shadow-xl">
      <div class="card-body">
        <h3 class="card-title">${tool.name}</h3>
        <p>${tool.use_case}</p>
        <div class="card-actions justify-end">
          <button onclick="editTool(${tool.id})" class="btn btn-warning btn-sm">Edit</button>
          <button onclick="deleteTool(${tool.id})" class="btn btn-error btn-sm">Delete</button>
        </div>
      </div>
    </div>
  `).join("");
}

async function fetchAdminReviews() {
  const token = localStorage.getItem("adminToken");
  const res = await fetch(`${API_BASE}/admin/reviews`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return;

  const reviews = await res.json();
  const list = document.getElementById("adminReviewsList");
  list.innerHTML = reviews.map(r => `
    <div class="alert ${r.status === 'approved' ? 'alert-success' : r.status === 'rejected' ? 'alert-error' : 'alert-warning'}">
      <div class="flex-1">
        <p><strong>Tool ID:</strong> ${r.tool_id} | Rating: ${r.user_rating} ⭐</p>
        <p>${r.comment || "No comment"}</p>
      </div>
      <div class="flex gap-2">
        ${r.status === 'pending' ? `
          <button onclick="moderateReview(${r.review_id}, 'approved')" class="btn btn-success btn-sm">Approve</button>
          <button onclick="moderateReview(${r.review_id}, 'rejected')" class="btn btn-error btn-sm">Reject</button>
        ` : `<span class="badge">${r.status}</span>`}
      </div>
    </div>
  `).join("");
}

async function moderateReview(reviewId, status) {
  const token = localStorage.getItem("adminToken");
  await fetch(`${API_BASE}/admin/review/${reviewId}/${status}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` }
  });
  fetchAdminReviews();
  fetchAdminTools();
}

// === ADD NEW TOOL & EDIT TOOL - FULLY WORKING ===

function showAddToolModal() {
  document.getElementById("modalTitle").textContent = "Add New Tool";
  document.getElementById("editToolId").value = "";
  document.getElementById("toolName").value = "";
  document.getElementById("toolUseCase").value = "";
  document.getElementById("toolCategory").value = "";
  document.getElementById("toolPricing").value = "";
  document.getElementById("toolUrl").value = "";

  document.getElementById("toolModal").showModal();
}

function editTool(id) {
  fetch(`${API_BASE}/tools`)
    .then(res => res.json())
    .then(tools => {
      const tool = tools.find(t => t.id === id);
      if (!tool) {
        alert("Tool not found!");
        return;
      }

      document.getElementById("modalTitle").textContent = "Edit Tool";
      document.getElementById("editToolId").value = tool.id;
      document.getElementById("toolName").value = tool.name;
      document.getElementById("toolUseCase").value = tool.use_case;
      document.getElementById("toolCategory").value = tool.category;
      document.getElementById("toolPricing").value = tool.pricing_type;
      document.getElementById("toolUrl").value = tool.url || "";

      document.getElementById("toolModal").showModal();
    })
    .catch(err => {
      console.error(err);
      alert("Failed to load tool");
    });
}

async function saveTool() {
  const id = document.getElementById("editToolId").value;
  const name = document.getElementById("toolName").value.trim();
  const use_case = document.getElementById("toolUseCase").value.trim();
  const category = document.getElementById("toolCategory").value.trim();
  const pricing_type = document.getElementById("toolPricing").value.trim();
  const url = document.getElementById("toolUrl").value.trim();

  if (!name || !use_case || !category || !pricing_type) {
    alert("All fields are required!");
    return;
  }

  const payload = {
    name,
    use_case,
    category,
    pricing_type,
    url: url || null
  };

  const token = localStorage.getItem("adminToken");
  const method = id ? "PUT" : "POST";
  const endpoint = id ? `${API_BASE}/admin/tool/${id}` : `${API_BASE}/admin/tool`;

  try {
    const res = await fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      document.getElementById("toolModal").close();
      fetchAdminTools();
      alert(id ? "Tool updated successfully!" : "New tool added successfully!");
    } else {
      const error = await res.text();
      alert("Error: " + error);
    }
  } catch (error) {
    console.error(error);
    alert("Network error");
  }
}

function closeModal() {
  document.getElementById("toolModal").close();
}

// Auto load on page open
window.onload = () => {
  if (document.getElementById("toolsGrid")) fetchTools();

  if (localStorage.getItem("adminToken") && document.getElementById("adminDashboard")) {
    document.getElementById("loginForm")?.classList.add("hidden");
    document.getElementById("adminDashboard")?.classList.remove("hidden");
    loadAdminData();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const toolId = urlParams.get('id');
  if (toolId && document.getElementById("toolDetail")) fetchToolDetail(toolId);
};