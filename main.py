from flask import Flask, render_template, request, redirect, url_for, session
import json
from supabase import create_client

# Charger config
with open("data/config.json") as f:
    config = json.load(f)

SUPABASE_URL = config["SUPABASE_URL"]
SUPABASE_KEY = config["SUPABASE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
app.secret_key = "supersecret"  # pour session

@app.route("/", methods=["GET"])
def home():
    if "username" in session:
        return redirect(url_for("chat"))
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Ici tu peux vérifier user/password depuis Supabase
        session["username"] = username
        return redirect(url_for("chat"))
    return render_template("login.html")

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("login"))
    # Récupération des messages depuis Supabase
    messages = supabase.table("messages").select("*").execute().data
    return render_template("index.html", messages=messages)

@app.route("/vocal")
def vocal():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("vocal.html", username=session["username"])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
