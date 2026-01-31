from flask import Flask, render_template, request, jsonify, session, redirect
from supabase import create_client
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

# ---------- Supabase ----------
supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_KEY"]
)

# ---------- WebRTC / vocal ----------
offers = {}
answers = {}
candidates = []

connected_users = set()

# ---------- ROUTES PAGE ----------
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

# ---------- CHAT ----------
@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.get_json()
    if not data or "content" not in data:
        return "Bad request", 400
    supabase.table("messages").insert({
        "username": session["username"],
        "content": data["content"]
    }).execute()
    return jsonify(success=True)

@app.route("/get_messages")
def get_messages():
    res = supabase.table("messages") \
        .select("username, content") \
        .order("id", desc=False) \
        .limit(50) \
        .execute()
    return jsonify(res.data)

@app.route("/connected_users")
def get_users():
    return jsonify(list(connected_users))

# ---------- WEBRTC ----------
@app.route("/webrtc/offer", methods=["POST"])
def webrtc_offer():
    if "username" not in session:
        return "Non connecté", 403
    data = request.get_json()
    if not data:
        return "Données manquantes", 400
    global offers
    offers[session["username"]] = data
    return jsonify(success=True)

@app.route("/webrtc/offers")
def webrtc_offers():
    return jsonify(offers)

@app.route("/webrtc/answer", methods=["POST"])
def webrtc_answer():
    if "username" not in session:
        return "Non connecté", 403
    data = request.get_json()
    if not data:
        return "Données manquantes", 400
    global answers
    answers[session["username"]] = data
    return jsonify(success=True)

@app.route("/webrtc/answers")
def webrtc_answers():
    return jsonify(answers)

@app.route("/webrtc/candidate", methods=["POST"])
def webrtc_candidate():
    data = request.get_json()
    if not data:
        return "Données manquantes", 400
    global candidates
    candidates.append(data)
    return jsonify(success=True)

@app.route("/webrtc/candidates")
def webrtc_candidates():
    return jsonify(candidates)

# ---------- RENDER ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
