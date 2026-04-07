// ============================================================
// api.js — Central API helper for FarmBuddy frontend
// Import this in every HTML page via <script src="js/api.js">
// ============================================================

// 🔴 Change this to your Render backend URL after deployment
// e.g. "https://farmbuddy-backend.onrender.com"
const API_BASE = "https://farmbuddy-backend.onrender.com";

// ─────────────────────────────────────────────
// Token helpers
// ─────────────────────────────────────────────
function getToken()        { return localStorage.getItem("fb_token"); }
function getUser()         { const u = localStorage.getItem("fb_user"); return u ? JSON.parse(u) : null; }
function saveSession(token, user) {
  localStorage.setItem("fb_token", token);
  localStorage.setItem("fb_user", JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem("fb_token");
  localStorage.removeItem("fb_user");
}

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

// ─────────────────────────────────────────────
// Auth guard — call at top of protected pages
// ─────────────────────────────────────────────
function requireAuth(requiredRole = null) {
  const user = getUser();
  if (!user || !getToken()) {
    window.location.href = "login.html";
    return null;
  }
  if (requiredRole && user.role !== requiredRole) {
    alert("Access denied.");
    window.location.href = "index.html";
    return null;
  }
  return user;
}

// ─────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────
const Auth = {
  async register(data) {
    const res = await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
    saveSession(res.token, res.user);
    return res;
  },
  async login(email, password) {
    const res = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    saveSession(res.token, res.user);
    return res;
  },
  logout() {
    clearSession();
    window.location.href = "login.html";
  },
};

// ─────────────────────────────────────────────
// Products API
// ─────────────────────────────────────────────
const Products = {
  getAll(search = "", category = "") {
    const params = new URLSearchParams();
    if (search)   params.set("search", search);
    if (category) params.set("category", category);
    return apiFetch(`/api/products?${params}`);
  },
  getMy()     { return apiFetch("/api/products/my"); },
  getById(id) { return apiFetch(`/api/products/${id}`); },
  add(data)   { return apiFetch("/api/products",    { method: "POST",   body: JSON.stringify(data) }); },
  update(id, data) { return apiFetch(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }); },
  delete(id)  { return apiFetch(`/api/products/${id}`, { method: "DELETE" }); },
};

// ─────────────────────────────────────────────
// Orders API
// ─────────────────────────────────────────────
const Orders = {
  place(items)          { return apiFetch("/api/orders",         { method: "POST", body: JSON.stringify({ items }) }); },
  getMy()               { return apiFetch("/api/orders/my"); },
  getFarmerOrders()     { return apiFetch("/api/orders/farmer"); },
  getById(id)           { return apiFetch(`/api/orders/${id}`); },
  updateStatus(id, status) { return apiFetch(`/api/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }); },
};

// ─────────────────────────────────────────────
// Cart helpers (localStorage)
// ─────────────────────────────────────────────
const Cart = {
  get()            { return JSON.parse(localStorage.getItem("fb_cart") || "[]"); },
  save(items)      { localStorage.setItem("fb_cart", JSON.stringify(items)); },
  add(product, qty = 1) {
    const cart = Cart.get();
    const existing = cart.find(i => i.productId === product._id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ productId: product._id, farmerId: product.farmerId, name: product.name, price: product.price, quantity: qty });
    }
    Cart.save(cart);
  },
  remove(productId) {
    Cart.save(Cart.get().filter(i => i.productId !== productId));
  },
  updateQty(productId, qty) {
    const cart = Cart.get().map(i => i.productId === productId ? { ...i, quantity: qty } : i).filter(i => i.quantity > 0);
    Cart.save(cart);
  },
  clear()          { localStorage.removeItem("fb_cart"); },
  count()          { return Cart.get().reduce((s, i) => s + i.quantity, 0); },
  total()          { return Cart.get().reduce((s, i) => s + i.price * i.quantity, 0); },
};
