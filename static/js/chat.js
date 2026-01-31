const supabaseUrl = "TON_SUPABASE_URL";
const supabaseKey = "TON_SUPABASE_KEY";
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const chatBox = document.getElementById("chat-box");

chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = chatInput.value;
    if (!message) return;

    await supabase.from("messages").insert([{ username: "<?= username ?>", content: message }]);
    chatInput.value = "";
});

// Écoute en temps réel
supabase
  .from("messages")
  .on("INSERT", payload => {
      const msg = payload.new;
      const el = document.createElement("div");
      el.textContent = `${msg.username}: ${msg.content}`;
      chatBox.appendChild(el);
  })
  .subscribe();
