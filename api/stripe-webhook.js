require("dotenv").config();

const stripe = require("stripe")(
  process.env.STRIPE_SECRET_KEY
);

const {
  createClient
} = require(
  "@supabase/supabase-js"
);

// ======================
// SUPABASE
// ======================

const supabase =
  createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

// ======================
// WEBHOOK
// ======================

module.exports = async (
  req,
  res
) => {

  try {

    const event =
      req.body;

    // ======================
    // PAYMENT COMPLETED
    // ======================

    if (
      event.type ===
      "checkout.session.completed"
    ) {

      const session =
        event.data.object;

      const userId =
        session.metadata.userId;

      console.log(
        "Payment completed for:",
        userId
      );

      // ======================
      // UPDATE USER PLAN
      // ======================

      const {
        error
      } =
        await supabase
          .from("profiles")
          .update({
            plan: "max"
          })
          .eq(
            "id",
            userId
          );

      if (error) {

        console.error(
          "Supabase error:",
          error
        );

      } else {

        console.log(
          "User upgraded to MAX"
        );
      }
    }

    // ======================
    // SUCCESS
    // ======================

    return res.status(200).json({
      received: true
    });

  } catch (err) {

    console.error(
      "Webhook Error:",
      err
    );

    return res.status(500).json({
      error: err.message
    });
  }
};