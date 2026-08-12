exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { path, content } = JSON.parse(event.body);
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = "officialshribeatz/shri-beatz-store";

    if (!path || !content) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Missing path or content' }) };
    }

    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;

    // Check if file already exists to get its sha (required for updates)
    let sha = undefined;
    const existingRes = await fetch(apiUrl, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    if (existingRes.ok) {
      const existingData = await existingRes.json();
      sha = existingData.sha;
    }

    const body = {
      message: `Upload ${path}`,
      content: content
    };
    if (sha) body.sha = sha;

    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } else {
      return { statusCode: res.status, body: JSON.stringify({ message: data.message || 'GitHub upload failed' }) };
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
