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

    const validationResponse = await fetch("https://validate.332712.xyz/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Theme Memories (https://332712.xyz)",
      },
      body: JSON.stringify({ slug, plaintext }),
    });

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
      return new Response("Unauthorized", { status: 401 });
    }

    const jwtSecret = await locals.runtime.env.JWT_SECRET.get();
    if (!jwtSecret) {
      console.error(
        "JWT_SECRET is not configured in Cloudflare environment. Expected environment variable: JWT_SECRET",
      );
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
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
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
