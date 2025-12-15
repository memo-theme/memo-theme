import type { APIRoute } from "astro";

export const prerender = false;

interface RequestBody {
  "cf-turnstile-response": string;
}

// Define the shape of the Turnstile validation response
interface TurnstileOutcome {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

// This endpoint now only validates the Turnstile response.
// Cloudflare will automatically set the cf_clearance cookie on the client
// upon successful challenge completion on the frontend.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { "cf-turnstile-response": turnstileResponse } =
      (await request.json()) as RequestBody;

    if (!turnstileResponse) {
      return new Response(
        JSON.stringify({ error: "Missing CAPTCHA response" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const turnstileSecret =
      await locals.runtime?.env?.TURNSTILE_SECRET_KEY.get();
    if (!turnstileSecret) {
      console.error("TURNSTILE_SECRET_KEY binding not found.");
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      });
    }

    const turnstileValidationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `secret=${encodeURIComponent(
          turnstileSecret,
        )}&response=${encodeURIComponent(turnstileResponse)}`,
      },
    );

    const turnstileOutcome =
      (await turnstileValidationResponse.json()) as TurnstileOutcome;

    if (!turnstileOutcome.success) {
      console.error("Turnstile validation failed:", turnstileOutcome);
      return new Response(JSON.stringify({ error: "Invalid CAPTCHA" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If validation is successful, just return success.
    // The cf_clearance cookie is handled by Cloudflare's Turnstile script on the client-side.
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
