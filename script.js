
const protectedPages = ["index.html", "cart.html", "checkout.html", "orders.html"];
const isLoggedIn = localStorage.getItem("loggedIn");
const currentPage = window.location.pathname;

if (!isLoggedIn && protectedPages.some(p => currentPage.includes(p))) {
    window.location.href = "login.html";
}


let cart = JSON.parse(localStorage.getItem("cart")) || [];

updateCartCount();

function addToCart(name, price) {
    let item = cart.find(product => product.name === name);
    if (item) {
        item.quantity++;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    showToast(name + " added to cart!");
}

function updateCartCount() {
    let count = 0;
    cart.forEach(item => { count += item.quantity; });
    document.querySelectorAll("#cartCount").forEach(el => {
        el.innerText = count;
    });
}

const searchInput = document.getElementById("searchInput");
if (searchInput) {
    searchInput.addEventListener("keyup", function () {
        const value = this.value.toLowerCase();
        document.querySelectorAll(".card").forEach(card => {
            const food = card.querySelector("h3").innerText.toLowerCase();
            card.style.display = food.includes(value) ? "block" : "none";
        });
    });
}
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();
        let valid = true;

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        hideError("nameError");
        hideError("emailError");
        hideError("passwordError");

        if (!name) {
            showError("nameError"); valid = false;
        }
        if (!validateEmail(email)) {
            showError("emailError"); valid = false;
        }
        if (password.length < 8) {
            showError("passwordError"); valid = false;
        }
        if (!valid) return;

        const user = { name, email, password };
        localStorage.setItem("user", JSON.stringify(user));
        showToast("Registration successful!");
        setTimeout(() => { window.location.href = "login.html"; }, 800);
    });
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();
        let valid = true;

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        hideError("emailError");
        hideError("passwordError");

        if (!validateEmail(email)) {
            showError("emailError"); valid = false;
        }
        if (password.length < 6) {
            showError("passwordError"); valid = false;
        }
        if (!valid) return;

        const user = JSON.parse(localStorage.getItem("user"));
        if (user && user.email === email && user.password === password) {
            localStorage.setItem("loggedIn", "true");
            showToast("Login successful!");
            setTimeout(() => { window.location.href = "index.html"; }, 800);
        } else {
            document.getElementById("passwordError").innerText = "Invalid email or password";
            showError("passwordError");
        }
    });
}

function logout() {
    localStorage.removeItem("loggedIn");
    showToast("Logged out successfully");
    setTimeout(() => { window.location.href = "login.html"; }, 600);
}

function displayCart() {
    const cartItems = document.getElementById("cartItems");
    if (!cartItems) return;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Your cart is empty!</p>
                <a href="index.html"><button>GO Back To Menu</button></a>
            </div>`;
        document.getElementById("grandTotal").innerText = "Total: ₹0";
        return;
    }

    let output = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.quantity;
        output += `
        <div class="cart-card">
            <h3>${escapeHtml(item.name)}</h3>
            <p>Price: ₹${item.price}</p>
            <p>Quantity: ${item.quantity}</p>
            <button onclick="increaseQty(${index})">+</button>
            <button onclick="decreaseQty(${index})">-</button>
            <button onclick="deleteItem(${index})">Delete</button>
        </div>`;
    });

    cartItems.innerHTML = output;

    const grandTotal = document.getElementById("grandTotal");
    if (grandTotal) {
        grandTotal.innerText = "Total: ₹" + total;
    }
}

displayCart();

function increaseQty(index) {
    cart[index].quantity++;
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
}

function decreaseQty(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
    } else {
        cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
}

function deleteItem(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    displayCart();
    updateCartCount();
}

const checkoutForm = document.getElementById("checkoutForm");
if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        let valid = true;

        const customerName = document.getElementById("customerName").value.trim();
        const address = document.getElementById("address").value.trim();
        const phone = document.getElementById("phone").value.trim();

        hideError("nameError");
        hideError("addressError");
        hideError("phoneError");

        if (!customerName) {
            showError("nameError"); valid = false;
        }
        if (!address) {
            showError("addressError"); valid = false;
        }
        if (!/^[0-9]{10}$/.test(phone)) {
            showError("phoneError"); valid = false;
        }
        if (!valid) return;

        const orders = JSON.parse(localStorage.getItem("orders")) || [];
        orders.push({
            customer: customerName,
            address: address,
            phone: phone,
            items: cart,
            date: new Date().toLocaleString()
        });

        localStorage.setItem("orders", JSON.stringify(orders));
        cart = [];
        localStorage.removeItem("cart");
        showToast("Order placed successfully!");
        setTimeout(() => { window.location.href = "orders.html"; }, 800);
    });
}


function displayOrders() {
    const orderList = document.getElementById("orderList");
    if (!orderList) return;

    const orders = JSON.parse(localStorage.getItem("orders")) || [];

    if (orders.length === 0) {
        orderList.innerHTML = `<div class="empty-cart"><p>No orders yet!</p><a href="index.html"><button>Order Now</button></a></div>`;
        return;
    }

    let output = "";
    orders.forEach((order, i) => {
        const itemsList = order.items.map(item =>
            `<li>${escapeHtml(item.name)} × ${item.quantity} — ₹${item.price * item.quantity}</li>`
        ).join("");

        const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        output += `
        <div class="order-card">
            <h3>Order #${i + 1}</h3>
            <p><strong>Name:</strong> ${escapeHtml(order.customer)}</p>
            <p><strong>Address:</strong> ${escapeHtml(order.address)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(order.phone)}</p>
            <p><strong>Date:</strong> ${order.date}</p>
            <ul>${itemsList}</ul>
            <p><strong>Total: ₹${orderTotal}</strong></p>
        </div>`;
    });

    orderList.innerHTML = output;
}

displayOrders();
const passwordInput = document.getElementById("password");
if (passwordInput) {
    passwordInput.addEventListener("keyup", function () {
        const value = this.value;
        const strength = document.getElementById("strength");
        if (!strength) return;

        if (value.length === 0) {
            strength.innerText = "";
            strength.className = "";
        } else if (/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[@$!%*?&])/.test(value) && value.length >= 8) {
            strength.innerText = "Strong Password ✅";
            strength.style.color = "green";
        } else if (/(?=.*[A-Z])(?=.*[0-9])/.test(value) && value.length >= 8) {
            strength.innerText = "Medium Password";
            strength.style.color = "orange";
        } else {
            strength.innerText = "Weak Password ";
            strength.style.color = "red";
        }
    });
}


function togglePassword() {
    const password = document.getElementById("password");
    if (password) {
        password.type = password.type === "password" ? "text" : "password";
    }
}


function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "block";
}

function hideError(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function showToast(message) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.innerText = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
}
