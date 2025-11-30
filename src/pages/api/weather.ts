import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ request, locals }: APIContext) {
  const cache = await caches.open("weather");
  const cachedResponse = await cache.match(request.url);

  if (cachedResponse) {
    return cachedResponse;
  }

  const lat = 43.33003301715253;
  const lon = 145.5976092292395;
  const apiKey = await locals.runtime.env.OPENWEATHERMAP_APIKEY.get();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${apiKey}&units=metric&lang=ja`;

  try {
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      return new Response(
        JSON.stringify({
          error: "Failed to fetch weather data",
          details: errorText,
        }),
        {
          status: weatherResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const weatherData = await weatherResponse.json();

    const response = new Response(JSON.stringify(weatherData), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Cache for 10 minutes
    response.headers.set("Cache-Control", "public, max-age=600");

    await cache.put(request.url, response.clone());

    return response;
  } catch (e) {
    let message = "Unknown error";
    if (e instanceof Error) {
      message = e.message;
    }
    return new Response(
      JSON.stringify({
        error: "Failed to fetch weather data",
        details: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
