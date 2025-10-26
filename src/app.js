const convertBtn = document.getElementById('convertBtn');
const pdfInput = document.getElementById('pdfInput');
const readerDiv = document.getElementById('reader');

let book;

convertBtn.addEventListener('click', async () => {
    if (!pdfInput.files.length) {
        alert('Please select a PDF file first.');
        return;
    }

    const pdfFile = pdfInput.files[0];
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
        const response = await fetch("https://workerjs.ahamed338.workers.dev", {
            method: "POST",
            body: formData
        });

        // Check response status
        if (!response.ok) {
            const text = await response.text();
            console.error("Worker returned error:", text);
            alert("Conversion failed. Check console for details.");
            return;
        }

        // Try parsing JSON
        let result;
        try {
            result = await response.json();
        } catch (e) {
            const text = await response.text();
            console.error("Failed to parse JSON from Worker:", text);
            alert("Conversion failed. See console for details.");
            return;
        }

        console.log("Worker response:", result);

        // Load EPUB in epub.js reader
        if (result?.data?.url) {
            // Clear previous reader if any
            readerDiv.innerHTML = "";
            book = ePub(result.data.url);
            const rendition = book.renderTo(readerDiv, {
                width: "100%",
                height: 400
            });
            rendition.display();
        } else {
            alert("Conversion completed, but no EPUB URL returned. Check Worker logs.");
        }

    } catch (err) {
        console.error("Fetch or Worker error:", err);
        alert("Error converting PDF. See console for details.");
    }
});
