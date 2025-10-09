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

    const geminiResultText = await geminiResponse.text();
    if (!geminiResponse.ok) {
      let error = 'Failed to generate content';
      try {
        const errorJson = JSON.parse(geminiResultText);
        error = errorJson.error || error;
        if(errorJson.details) {
          error += `: ${errorJson.details}`
        }
      } catch (e) {
        // Not a json response, use the raw text
        if(geminiResultText) {
          error = geminiResultText;
        }
      }
      throw new Error(error);
    }

    const geminiResult = JSON.parse(geminiResultText);
    const { text } = geminiResult;

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
    
    const qrCodeResultText = await qrCodeResponse.text();
    if (!qrCodeResponse.ok) {
      let error = 'Failed to generate QR code';
       try {
        const errorJson = JSON.parse(qrCodeResultText);
        error = errorJson.error || error;
      } catch (e) {
        // Not a json response, use the raw text
        if(qrCodeResultText) {
          error = qrCodeResultText;
        }
      }
      throw new Error(error);
    }
    
    const qrCodeResult = JSON.parse(qrCodeResultText);
    const { qrCodeDataUrl } = qrCodeResult;
    const qrCodeImg = document.createElement('img');
    qrCodeImg.src = qrCodeDataUrl;
    output.appendChild(qrCodeImg);

  } catch (e) {
    output.innerHTML += `<hr>${e.message}`;
  }
};
