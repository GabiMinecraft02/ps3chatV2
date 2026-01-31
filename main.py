from flask import Flask, render_template, request, redirect, session, url_for
import json
from supabase import create_client

# Config
with open("data/config.json") as f:
    config = json.load(f)

SUPABASE_URL = config["SUPABASE_URL"]
SUPABASE_KEY = config["SUPABASE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
app.secret_key = "supersecretkey"

@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        # Ici vérif user/mdp sur Supabase si voulu
        session["username"] = username
        return redirect(url_for("chat"))
    return render_template("login.html")

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("login"))
    messages = supabase.table("messages").select("*").execute().data
    return render_template("index.html", username=session["username"], messages=messages)

@app.route("/vocal")
def vocal():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("vocal.html", username=session["username"])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
