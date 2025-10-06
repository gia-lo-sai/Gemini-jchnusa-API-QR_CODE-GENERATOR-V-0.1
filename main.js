import MarkdownIt from 'markdown-it';
import './style.css';

let form = document.querySelector('form');
let output = document.querySelector('.output');

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const prompt = `Please summarize the following contact information:\n\n${JSON.stringify(data, null, 2)}`;

    // Call the server-side endpoint
    const geminiResponse = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      throw new Error(`${errorData.error}: ${errorData.details || 'No additional details provided.'}`);
    }

    const { text } = await geminiResponse.json();

    if (!text) {
      throw new Error('Received empty response from Gemini API');
    }

    // Read from the stream and interpret the output as markdown
    let md = new MarkdownIt();
    output.innerHTML = md.render(text);

    // Generate and display QR code
    const qrCodeResponse = await fetch('/api/qrcode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!qrCodeResponse.ok) {
      const errorData = await qrCodeResponse.json();
      throw new Error(errorData.error || 'Failed to generate QR code');
    }

    const { qrCodeDataUrl } = await qrCodeResponse.json();
    const qrCodeImg = document.createElement('img');
    qrCodeImg.src = qrCodeDataUrl;
    output.appendChild(qrCodeImg);

  } catch (e) {
    output.innerHTML += `<hr>${e.message}`;
  }
};
