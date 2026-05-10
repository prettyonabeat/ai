const TELEGRAM_API_BASE = "https://api.telegram.org";

function sanitize(value) {
  return String(value || "").trim();
}

function buildMessage({ name, contactMethod, contactValue, message }) {
  return [
    "New request from PawCierge website 🐾",
    "",
    `Name: ${name}`,
    `Contact method: ${contactMethod}`,
    `Contact: ${contactValue}`,
    `Message: ${message}`,
  ].join("\n");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: "Telegram env is not configured" });
  }

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const name = sanitize(payload.name);
    const contactMethod = sanitize(payload.contactMethod);
    const contactValue = sanitize(payload.contactValue);
    const message = sanitize(payload.message);

    if (!name || !contactMethod || !contactValue || !message) {
      return res.status(400).json({ ok: false, error: "Missing required fields" });
    }

    if (!["Telegram", "WhatsApp"].includes(contactMethod)) {
      return res.status(400).json({ ok: false, error: "Invalid contact method" });
    }

    const telegramResponse = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: buildMessage({ name, contactMethod, contactValue, message }),
        disable_web_page_preview: true,
      }),
    });

    if (!telegramResponse.ok) {
      return res.status(502).json({ ok: false, error: "Telegram API request failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "Unexpected server error" });
  }
};
