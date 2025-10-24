import express from "express";
import path from "path";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Cashfree Environment Setup
const CASHFREE_URL =
  process.env.CASHFREE_ENV === "PROD"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

// ✅ Create Payment Order
app.post("/create-order", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    const orderId = "ORDER_" + Date.now();

    const response = await fetch(`${CASHFREE_URL}/orders`, {
      method: "POST",
      headers: {
        "x-client-id": process.env.CASHFREE_APP_ID,
        "x-client-secret": process.env.CASHFREE_SECRET_KEY,
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: phone,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
        },
        order_note: "Admission Form Payment",
        order_meta: {
          return_url: `https://admision-from-2.onrender.com/success.html?order_id=${orderId}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Cashfree Error:", data);
      return res.status(400).json({ error: data });
    }

    res.json({ payment_session_id: data.payment_session_id, order_id: orderId });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
