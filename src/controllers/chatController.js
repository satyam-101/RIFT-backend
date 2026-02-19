const chatWithContext = require("../services/chatService");

exports.chat = async (req, res, next) => {
  try {
    const { message, context, history } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    if (!context || !context.drug) {
      return res.status(400).json({ error: "Pharmacogenomic context is required" });
    }

    const safeHistory = Array.isArray(history) ? history.slice(-20) : [];

    const result = await chatWithContext({
      message: message.trim(),
      context,
      history: safeHistory
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};
