import type { APIRoute } from "astro";
import { SignJWT } from "jose";

// Define types for incoming and external data
interface RequestBody {
  slug: string;
  plaintext: string;
}

interface ValidationResult {
  verified: boolean;
}

// Add `redirect` to the function signature to get the helper
export const POST: APIRoute = async ({
  request,
  cookies,
  locals,
  redirect,
}) => {
  try {
    // Use the type assertion for the request body
    const { slug, plaintext } = (await request.json()) as RequestBody;

    if (!slug || !plaintext) {
      return new Response(
        JSON.stringify({ error: "Missing slug or plaintext" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

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
      return new Response(errorBody, {
        status: validationResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use the type assertion for the validation result
    const validationResult =
      (await validationResponse.json()) as ValidationResult;

    if (!validationResult.verified) {
      // On invalid password, redirect to the custom 401 page.
      return redirect("/401");
    }

    // 1. Fetch the secret from Cloudflare's secret store using `locals`
    if (!locals.runtime?.env?.JWT_SECRET) {
      console.error("JWT_SECRET binding not found.");
      return new Response(JSON.stringify({ error: "Internal Server Error" }), {
        status: 500,
      });
    }
    const jwtSecret = await locals.runtime.env.JWT_SECRET.get();

    if (!jwtSecret) {
      console.error("JWT_SECRET is not configured in Cloudflare environment.");
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
      .setAudience("example.com")
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
