require("dotenv").config();

const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);

module.exports = async (req, res) => {

  // ======================
  // ONLY ALLOW POST
  // ======================

  if (req.method !== "POST") {

    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    // ======================
    // GET USER ID
    // ======================

    const { userId } =
      req.body;

    // ======================
    // CREATE CHECKOUT SESSION
    // ======================

    const session =
      await stripe.checkout.sessions.create({

        mode: "subscription",

        metadata: {
          userId: userId
        },

        payment_method_types: [
          "card"
        ],

        line_items: [
          {
            price:
              process.env.STRIPE_PRICE_ID,

            quantity: 1
          }
        ],

        success_url:
          "http://localhost:3000/success.html",

        cancel_url:
          "http://localhost:3000/cancel.html"
      });

    // ======================
    // RETURN CHECKOUT URL
    // ======================

    return res.status(200).json({
      url: session.url
    });

  } catch (err) {

    console.error(
      "Stripe Checkout Error:",
      err
    );

    return res.status(500).json({
      error: err.message
    });
  }
};