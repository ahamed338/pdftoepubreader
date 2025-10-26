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
        const response = await fetch("/api", { // Worker route
            method: "POST",
            body: formData
        });

        const result = await response.json();
        console.log(result);

        // Load EPUB in epub.js reader if URL returned
        if (result?.data?.url) {
            if (!book) {
                book = ePub(result.data.url);
                const rendition = book.renderTo(readerDiv, {
                    width: "100%",
                    height: 400
                });
                rendition.display();
            }
        } else {
            alert("Conversion completed, but no EPUB URL returned. Check Worker logs.")
        }
    } catch (err) {
        console.error(err);
        alert("Error converting PDF. See console for details.");
    }
});
