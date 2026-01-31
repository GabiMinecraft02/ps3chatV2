from flask import Flask, render_template, request, jsonify, session, redirect
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

# ---- stockage simple en mémoire (OK pour ton projet)
messages = []
connected_users = set()

@app.route("/")
def home():
    if "username" not in session:
        return redirect("/login")
    return render_template("index.html", username=session["username"])

@app.route("/vocal")
def vocal():
    if "username" not in session:
        return redirect("/login")
    return render_template("vocal.html", username=session["username"])

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        # mot de passe global (Render ENV)
        if password != os.environ.get("PASSWORD", "ps3"):
            return "Mot de passe incorrect", 403

        session["username"] = username
        connected_users.add(username)
        return redirect("/")
    return render_template("login.html")

@app.route("/logout")
def logout():
    username = session.get("username")
    if username in connected_users:
        connected_users.remove(username)
    session.clear()
    return redirect("/login")

# ---------- CHAT API ----------

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.json
    messages.append({
        "username": session.get("username"),
        "content": data["content"]
    })
    return jsonify(success=True)

@app.route("/get_messages")
def get_messages():
    return jsonify(messages[-50:])

@app.route("/connected_users")
def get_users():
    return jsonify(list(connected_users))

# ---------- RENDER ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
