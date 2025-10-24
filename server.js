import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ Serve your frontend files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Use environment variables
const PORT = process.env.PORT || 5000;
const CASHFREE_APP_ID = process.env.App_ID;
const CASHFREE_SECRET_KEY = process.env.Secret_Key;
const CASHFREE_API_BASE = "https://sandbox.cashfree.com/pg/orders";

// ✅ Generate random access code (G10-XXXXX)
function generateAccessCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "G10-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ✅ Create new Cashfree order
app.post("/create-order", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    if (!name || !email || !phone || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderData = {
      customer_details: {
        customer_id: "CUST_" + Date.now(),
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_amount: amount,
      order_currency: "INR",
      order_note: "Admission Payment",
      order_id: "ORDER_" + Date.now(),
    };

    const response = await fetch(CASHFREE_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();
    console.log("🟢 Cashfree Order Response:", data);

    if (data.order_status === "ACTIVE") {
      res.json({
        orderId: data.order_id,
        paymentSessionId: data.payment_session_id,
      });
    } else {
      res.status(400).json({ error: "Failed to create order", data });
    }
  } catch (error) {
    console.error("❌ Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Verify payment and generate access code
app.post("/verify-payment", async (req, res) => {
  try {
    const { orderId } = req.body;

    const response = await fetch(`${CASHFREE_API_BASE}/${orderId}`, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
      },
    });

    const data = await response.json();
    console.log("🟢 Payment Verification:", data);

    if (data.order_status === "PAID") {
      const accessCode = generateAccessCode();
      res.json({
        success: true,
        message: "Payment successful",
        accessCode: accessCode,
      });
    } else {
      res.json({ success: false, message: "Payment not completed yet" });
    }
  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// ✅ Default route
app.get("/", (req, res) => {
  res.send("✅ Cashfree Payment Server is running successfully!");
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});