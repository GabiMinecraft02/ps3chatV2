from flask import Flask, render_template, request, jsonify, session, redirect
from supabase import create_client
import os

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret")

supabase = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_KEY"]
)

connected_users = set()
offers = {}
answers = {}
candidates = []

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
        username = request.form["username"]
        password = request.form["password"]

        if password != os.environ.get("PASSWORD", "ps3"):
            return "Mot de passe incorrect", 403

        session["username"] = username
        connected_users.add(username)
        return redirect("/")
    return render_template("login.html")

@app.route("/logout")
def logout():
    connected_users.discard(session.get("username"))
    session.clear()
    return redirect("/login")

@app.route("/webrtc/offer", methods=["POST"])
def webrtc_offer():
    offers[session["username"]] = request.json
    return jsonify(success=True)

@app.route("/webrtc/offers")
def webrtc_offers():
    return jsonify(offers)

@app.route("/webrtc/answer", methods=["POST"])
def webrtc_answer():
    answers[session["username"]] = request.json
    return jsonify(success=True)

@app.route("/webrtc/answers")
def webrtc_answers():
    return jsonify(answers)

@app.route("/webrtc/candidate", methods=["POST"])
def webrtc_candidate():
    candidates.append(request.json)
    return jsonify(success=True)

@app.route("/webrtc/candidates")
def webrtc_candidates():
    return jsonify(candidates)


# -------- CHAT --------

@app.route("/send_message", methods=["POST"])
def send_message():
    data = request.json
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
def connected_users_api():
    return jsonify(list(connected_users))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
