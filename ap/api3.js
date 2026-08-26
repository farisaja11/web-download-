const axios = require("axios");

const UA_MOBILE =
  "Mozilla/5.0 (Linux; Android 10; K) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/139.0.0.0 Mobile Safari/537.36";

const UA_DESKTOP =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/120.0.0.0 Safari/537.36";


// ==================================================
// TIKTOK
// Endpoint: POST /api3/tiktok
// Body: { "url": "https://www.tiktok.com/..." }
// ==================================================

function getTikTokId(url) {
  const patterns = [
    /video\/(\d+)/,
    /\/([A-Za-z0-9]+)\/?$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match) {
      return match[1];
    }
  }

  return url;
}

async function tiktok(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method tidak diizinkan."
    });
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL TikTok wajib diisi."
      });
    }

    const id = getTikTokId(url);

    const response = await axios.get(
      "https://api.twitterpicker.com/tiktok/mediav2",
      {
        params: {
          id
        },

        headers: {
          "User-Agent": UA_DESKTOP,
          Accept: "application/json"
        },

        timeout: 20000
      }
    );

    const data = response.data;

    if (!data || !data.video_no_watermark) {
      return res.status(502).json({
        success: false,
        error: "API TikTok mengembalikan data tidak valid."
      });
    }

    return res.status(200).json({
      success: true,

      result: {
        id: data.id || id,

        user: {
          username:
            data.user?.username || null,

          name:
            data.user?.name || null,

          avatar:
            data.user?.image || null
        },

        thumbnail:
          data.thumbnail || null,

        duration:
          data.video_duration_seconds || null,

        download: {
          no_watermark:
            data.video_no_watermark?.url || null,

          watermark:
            data.video_watermark?.url || null,

          hd:
            data.video_no_watermark?.hd || false,

          size_mb:
            data.video_no_watermark?.size_mb || null
        }
      }
    });

  } catch (error) {
    console.error(
      "TikTok API Error:",
      error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      error:
        error.response?.data ||
        error.message ||
        "Gagal memproses TikTok."
    });
  }
}


// ==================================================
// YOUTUBE
// Endpoint: POST /api3/youtube
// Body: { "input": "URL atau username YouTube" }
// ==================================================

async function youtube(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method tidak diizinkan."
    });
  }

  try {
    const { input } = req.body || {};

    if (!input) {
      return res.status(400).json({
        success: false,
        error:
          "Username atau URL YouTube wajib diisi."
      });
    }

    const baseUrl =
      "https://youtubetoolkit.com/tools/account-viewer";

    const fetchUrl =
      "https://youtubetoolkit.com/tools/account-viewer/fetch";

    const pageRes =
      await axios.get(baseUrl, {
        headers: {
          "User-Agent": UA_MOBILE
        },

        timeout: 20000
      });

    const html = pageRes.data;

    const patterns = [
      /'X-CSRF-TOKEN':\s*'([^']+)'/i,

      /"X-CSRF-TOKEN":\s*"([^"]+)"/i,

      /<meta[^>]+name=["']csrf-token["'][^>]+content=["']([^"']+)["']/i
    ];

    let csrfToken = null;

    for (const pattern of patterns) {
      const match =
        html.match(pattern);

      if (match) {
        csrfToken = match[1];
        break;
      }
    }

    if (!csrfToken) {
      return res.status(502).json({
        success: false,
        error:
          "CSRF token YouTube tidak ditemukan."
      });
    }

    const response =
      await axios.post(
        fetchUrl,

        {
          url: input
        },

        {
          headers: {
            "User-Agent": UA_MOBILE,

            Referer: baseUrl,

            Origin:
              "https://youtubetoolkit.com",

            "Content-Type":
              "application/json",

            "X-CSRF-TOKEN":
              csrfToken,

            "X-Requested-With":
              "XMLHttpRequest"
          },

          timeout: 30000
        }
      );

    if (response.data?.success) {
      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    }

    return res.status(502).json({
      success: false,
      error:
        "Gagal mengambil data YouTube.",

      raw:
        response.data
    });

  } catch (error) {
    console.error(
      "YouTube API Error:",
      error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      error:
        error.response?.data ||
        error.message
    });
  }
}


// ==================================================
// DOWNR
// Endpoint: POST /api3/downr
// Body: { "url": "URL video" }
// ==================================================

async function downr(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method tidak diizinkan."
    });
  }

  try {
    const { url } = req.body || {};

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL wajib diisi."
      });
    }

    const base =
      "https://downr.org";

    const session =
      await axios.get(
        `${base}/.netlify/functions/analytics`,
        {
          headers: {
            "User-Agent": UA_MOBILE,
            Accept: "*/*"
          },

          timeout: 20000
        }
      );

    const cookies =
      session.headers["set-cookie"] || [];

    const cookieHeader =
      cookies
        .map(
          cookie =>
            cookie.split(";")[0]
        )
        .join("; ");

    const response =
      await axios.post(
        `${base}/.netlify/functions/bbc`,

        {
          url
        },

        {
          headers: {
            "User-Agent": UA_MOBILE,

            Accept: "*/*",

            "Content-Type":
              "application/json",

            Origin: base,

            Referer: `${base}/`,

            Cookie: cookieHeader
          },

          timeout: 60000
        }
      );

    if (!response.data?.url) {
      return res.status(502).json({
        success: false,
        error:
          "URL download tidak ditemukan.",

        raw:
          response.data
      });
    }

    return res.status(200).json({
      success: true,

      result:
        response.data
    });

  } catch (error) {
    console.error(
      "Downr API Error:",
      error.message
    );

    return res.status(
      error.response?.status || 500
    ).json({
      success: false,

      error:
        error.response?.data ||
        error.message
    });
  }
}


// ==================================================
// ROUTER UTAMA
// ==================================================

module.exports = async (req, res) => {
  const path =
    req.url
      ?.split("?")[0]
      .replace(/\/+$/, "");

  if (path.endsWith("/tiktok")) {
    return tiktok(req, res);
  }

  if (path.endsWith("/youtube")) {
    return youtube(req, res);
  }

  if (path.endsWith("/downr")) {
    return downr(req, res);
  }

  return res.status(404).json({
    success: false,
    error: "Endpoint tidak ditemukan.",

    available: [
      "POST /api3/tiktok",
      "POST /api3/youtube",
      "POST /api3/downr"
    ]
  });
};
