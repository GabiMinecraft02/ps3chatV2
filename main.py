from flask import Flask, render_template, request, redirect, session, url_for
import os
from supabase import create_client

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY")

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mot de passe global
GLOBAL_PASSWORD = os.environ.get("PASSWORD")

@app.route("/", methods=["GET"])
def home():
    return redirect(url_for("login"))

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        if not username:
            return render_template("login.html", error="Pseudo requis")
        if password != GLOBAL_PASSWORD:
            return render_template("login.html", error="Mot de passe incorrect")
        session["username"] = username
        return redirect(url_for("chat"))
    return render_template("login.html")

@app.route("/chat")
def chat():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("index.html", username=session["username"])

@app.route("/vocal")
def vocal():
    if "username" not in session:
        return redirect(url_for("login"))
    return render_template("vocal.html", username=session["username"])

@app.route("/get_messages", methods=["GET"])
def get_messages():
    if "username" not in session:
        return jsonify([]), 401
    messages = supabase.table("messages").select("*").order("created_at").execute().data
    return jsonify(messages)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
