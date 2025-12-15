import type { APIRoute } from "astro";
import { SignJWT } from "jose";

export const prerender = false;

// Define types for incoming and external data
interface RequestBody {
  slug: string;
  plaintext: string;
}

interface ValidationResult {
  verified: boolean;
}

// Handle GET requests by redirecting to the homepage. This resolves the build warning.
export const GET: APIRoute = ({ redirect }) => {
  return redirect("/");
};

// Handle POST requests for password validation
export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const clearanceCookie = cookies.get("cf_clearance");

    if (!clearanceCookie) {
      console.log("No cf_clearance cookie found");
      return new Response("Unauthorized", { status: 401 });
    }

    // The presence of the cf_clearance cookie is our pre-clearance check.
    // No JWT verification is needed here anymore.

    const body = (await request.json()) as RequestBody;

    // Validate JSON structure and types
    if (
      typeof body !== "object" ||
      body === null ||
      typeof body.slug !== "string" ||
      body.slug.trim() === "" ||
      typeof body.plaintext !== "string" ||
      body.plaintext.trim() === ""
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request body: 'slug' and 'plaintext' must be non-empty strings",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { slug, plaintext } = body;

    // Set a timeout for the fetch request to avoid hanging indefinitely
    const controller = new AbortController();
    const timeoutMs = 10000; // 10 seconds
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let validationResponse;
    try {
      validationResponse = await fetch("https://validate.332712.xyz/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Theme Memories (https://332712.xyz)",
        },
        body: JSON.stringify({ slug, plaintext }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      if (fetchErr instanceof Error && fetchErr.name === "AbortError") {
        clearTimeout(timeout);
        return new Response(
          JSON.stringify({
            error:
              "Upstream timeout (validation service took too long to respond)",
          }),
          {
            status: 504,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
      throw fetchErr;
    } finally {
      clearTimeout(timeout);
    }

    if (!validationResponse.ok) {
      const errorBody = await validationResponse.text();
      // Log raw errorBody for debugging, but do not expose it to client
      console.error("Upstream error:", errorBody);
      return new Response(
        JSON.stringify({ error: "Error validating password" }),
        {
          status: validationResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const validationResult =
      (await validationResponse.json()) as ValidationResult;

    if (!validationResult.verified) {
      return new Response(JSON.stringify({ error: "Invalid password." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let jwtSecret: string | undefined;
    try {
      jwtSecret = await locals.runtime.env.JWT_SECRET.get();
    } catch (jwtSecretError) {
      console.error("Error retrieving JWT secret:", jwtSecretError);
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      });
    }
    // Ensure JWT secret meets minimum length requirements (at least 32 chars for HS256)
    if (!jwtSecret || jwtSecret.length < 32) {
      console.error(
        `JWT_SECRET length is too short (${jwtSecret ? jwtSecret.length : 0} chars). Must be at least 32 characters for HS256.`,
      );
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    const secret = new TextEncoder().encode(jwtSecret);
    const alg = "HS256";

    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg })
      .setExpirationTime("4h")
      .setIssuedAt()
      .setSubject(slug)
      .sign(secret);

    cookies.set(`post_access_${slug}`, jwt, {
      path: `/blog/${slug}`,
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 4, // 4 hours
      sameSite: "strict",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Type guard to safely handle the unknown error type
    if (error instanceof Error) {
      console.error("An unexpected error occurred:", error.message);
    } else {
      console.error("An unexpected and non-error object was caught:", error);
    }
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
