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

# ---------- WEBRTC (SUPABASE) ----------
@app.route("/webrtc/send", methods=["POST"])
def webrtc_send():
    if "username" not in session:
        return "Non connecté", 403

    data = request.get_json()
    supabase.table("webrtc_signals").insert({
        "from_user": session["username"],
        "to_user": data.get("to"),
        "type": data.get("type"),
        "payload": data.get("payload")
    }).execute()

    return jsonify(success=True)

@app.route("/webrtc/poll")
def webrtc_poll():
    if "username" not in session:
        return jsonify([])

    res = supabase.table("webrtc_signals") \
        .select("*") \
        .eq("to_user", session["username"]) \
        .execute()

    # nettoyage après lecture
    ids = [r["id"] for r in res.data]
    if ids:
        supabase.table("webrtc_signals").delete().in_("id", ids).execute()

    return jsonify(res.data)

# ---------- RUN ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 10000)))
