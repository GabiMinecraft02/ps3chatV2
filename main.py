from flask import Flask, render_template, request, redirect, session, url_for, jsonify
import os
from supabase import create_client

# Flask setup
app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "supersecretkey")

# Supabase setup depuis variables d'environnement
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Routes
@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Pour simplifier, on ne vérifie pas le mot de passe
        session["username"] = username
        return redirect(url_for("chat"))
    return render_template("login.html")

@app.route("/chat", methods=["GET"])
def chat():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

# Route sécurisée pour envoyer un message
@app.route("/send_message", methods=["POST"])
def send_message():
    if "username" not in session:
        return jsonify({"error": "Non connecté"}), 401
    data = request.json
    content = data.get("content")
    if not content:
        return jsonify({"error": "Message vide"}), 400
    supabase.table("messages").insert([{
        "username": session["username"],
        "content": content
    }]).execute()
    return jsonify({"success": True})

# Route pour récupérer messages récents
@app.route("/get_messages", methods=["GET"])
def get_messages():
    if "username" not in session:
        return jsonify([]), 401
    messages = supabase.table("messages").select("*").order("created_at").execute().data
    return jsonify(messages)

# Vocal page
@app.route("/vocal")
def vocal():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("vocal.html", username=session["username"])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
