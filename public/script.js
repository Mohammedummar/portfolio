/* ============================================================
   Md Ummar — Portfolio  |  script.js (UPDATED)
   ============================================================ */

/* ── SMOOTH SCROLL ───────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ── ACTIVE NAV ON SCROLL ────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.topbar-nav a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(
        `.topbar-nav a[href="#${entry.target.id}"]`
      );
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.4 });

sections.forEach(sec => sectionObserver.observe(sec));

/* ── SCROLL REVEAL ───────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('up');
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ── CONTACT FORM (FIXED — SENDS TO BACKEND) ───────────────── */
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

if (contactForm) {
  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('cname').value;
    const email = document.getElementById('cemail').value;
    const subject = document.getElementById('csubject').value;
    const message = document.getElementById('cmsg').value;

    try {
      const res = await fetch("http://localhost:5000/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message
        })
      });

      const data = await res.json();

      if (res.ok) {
        formStatus.textContent = "✅ Message sent successfully!";
        formStatus.classList.add('show');
        contactForm.reset();
      } else {
        formStatus.textContent = "❌ Failed to send message";
        formStatus.classList.add('show');
      }

    } catch (error) {
      console.error("Contact error:", error);
      formStatus.textContent = "❌ Server error";
      formStatus.classList.add('show');
    }

    setTimeout(() => formStatus.classList.remove('show'), 6000);
  });
}
/* ── CHATBOT ─────────────────────────────────────────────── */
const fab       = document.getElementById('chat-fab');
const chatbox   = document.getElementById('chatbox');
const closeBtn  = document.getElementById('chat-close');
const chatMsgs  = document.getElementById('chat-msgs');
const chatInput = document.getElementById('chat-input');
const chatSend  = document.getElementById('chat-send');

// Toggle chatbox
fab?.addEventListener('click', () => chatbox.classList.toggle('open'));
closeBtn?.addEventListener('click', () => chatbox.classList.remove('open'));

// Send message
chatInput?.addEventListener('keydown', e => {
  if (e.key === 'Enter') sendMessage();
});
chatSend?.addEventListener('click', sendMessage);

/**
 * Append message to chat UI
 */
function appendMessage(text, role) {
  const div = document.createElement('div');
  div.className = `cmsg ${role}`;
  div.textContent = text;
  chatMsgs.appendChild(div);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return div;
}

/**
 * SEND MESSAGE (FIXED — CONNECTS TO BACKEND)
 */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  appendMessage(text, 'user');

  const typingBubble = appendMessage('Thinking…', 'bot typing');

  try {
    const response = await fetch("http://localhost:5000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    // Handle bad response
    if (!response.ok) {
      throw new Error("Server error");
    }

    const data = await response.json();

    typingBubble.remove();
    appendMessage(data.reply || "No response from server", 'bot');

  } catch (error) {
    console.error("Chat error:", error);
    typingBubble.textContent = "Network error — please try again.";
    typingBubble.classList.remove('typing');
  }
}