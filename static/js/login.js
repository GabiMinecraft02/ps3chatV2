const form = document.getElementById("login-form");
form.addEventListener("submit", (e) => {
    const user = form.username.value;
    const pwd = form.password.value;
    if (!user || !pwd) e.preventDefault();
});
