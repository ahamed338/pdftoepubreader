const convertBtn = document.getElementById('convertBtn');
const pdfInput = document.getElementById('pdfInput');
const readerDiv = document.getElementById('reader');

// Create a status div to show progress/errors
let statusDiv = document.getElementById('statusDiv');
if (!statusDiv) {
    statusDiv = document.createElement('div');
    statusDiv.id = 'statusDiv';
    statusDiv.className = 'mt-2 text-gray-700';
    convertBtn.parentNode.appendChild(statusDiv);
}

let book;

function setStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? 'red' : 'green';
}

convertBtn.addEventListener('click', async () => {
    if (!pdfInput.files.length) {
        alert('Please select a PDF file first.');
        return;
    }

    const pdfFile = pdfInput.files[0];
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
        setStatus("Uploading PDF and starting conversion...");

        const response = await fetch("https://pdftoepubreader-worker.ahamed338.workers.dev", { // <-- Your Worker URL
            method: "POST",
            body: formData
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            throw new Error(`Invalid response from Worker: ${text}`);
        }

        if (!response.ok || result.error) {
            setStatus(result.error || 'Conversion failed.', true);
            alert(`Error: ${result.error || 'Unknown error'}\nDetails: ${JSON.stringify(result.details || '')}`);
            return;
        }

        setStatus("Conversion successful! Loading EPUB...");

        if (!book) {
            book = ePub(result.url);
            const rendition = book.renderTo(readerDiv, {
                width: "100%",
                height: 400
            });
            rendition.display();
        }

        setStatus("EPUB loaded successfully!");

    } catch (err) {
        console.error(err);
        setStatus(`Error: ${err.message}`, true);
        alert(`Error during conversion: ${err.message}`);
    }
});
