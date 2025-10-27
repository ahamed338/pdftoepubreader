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

let currentPdfFile = null;

function setStatus(message, isError = false) {
    statusDiv.textContent = message;
    statusDiv.style.color = isError ? 'red' : 'green';
}

// Extract text from PDF
async function extractTextFromPDF(pdfFile) {
    return new Promise((resolve, reject) => {
        currentPdfFile = pdfFile;
        
        const fileReader = new FileReader();
        
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            
            // Load PDF.js if not already loaded
            if (typeof pdfjsLib === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
                script.onload = async function() {
                    try {
                        await processPDF(typedarray, resolve, reject);
                    } catch (error) {
                        reject(error);
                    }
                };
                script.onerror = reject;
                document.head.appendChild(script);
            } else {
                processPDF(typedarray, resolve, reject);
            }
        };
        
        fileReader.onerror = reject;
        fileReader.readAsArrayBuffer(pdfFile);
    });
}

async function processPDF(typedarray, resolve, reject) {
    try {
        // Initialize PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let chapters = [];
        
        console.log(`📖 Processing ${pdf.numPages} pages...`);
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            let pageText = textContent.items.map(item => item.str).join(' ');
            
            // Clean up the text
            pageText = pageText
                .replace(/\s+/g, ' ')
                .trim();
            
            // Create chapter for every 3-5 pages
            if (i % 3 === 1 || i === 1) {
                chapters.push({
                    title: `Chapter ${Math.ceil(i/3)}`,
                    content: pageText
                });
            } else {
                chapters[chapters.length - 1].content += '\n\n' + pageText;
            }
        }
        
        resolve({
            chapters: chapters,
            totalPages: pdf.numPages,
            title: currentPdfFile ? currentPdfFile.name.replace('.pdf', '').replace(/_/g, ' ') : 'Converted Document'
        });
    } catch (error) {
        reject(error);
    }
}

// Simple EPUB generator without external libraries
function generateSimpleEPUB(bookData) {
    // Basic EPUB structure
    const containerXML = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

    const contentOPF = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:${generateUUID()}</dc:identifier>
    <dc:title>${escapeXML(bookData.title)}</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>PDF to EPUB Converter</dc:creator>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
  </metadata>
  <manifest>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    ${bookData.chapters.map((chapter, index) => 
        `<item id="chapter${index}" href="chapter${index}.xhtml" media-type="application/xhtml+xml"/>`
    ).join('\n    ')}
  </manifest>
  <spine>
    <itemref idref="toc" linear="no"/>
    ${bookData.chapters.map((chapter, index) => 
        `<itemref idref="chapter${index}"/>`
    ).join('\n    ')}
  </spine>
</package>`;

    const tocXHTML = `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc">
    <h1>Table of Contents</h1>
    <ol>
      ${bookData.chapters.map((chapter, index) => 
          `<li><a href="chapter${index}.xhtml">${escapeXML(chapter.title)}</a></li>`
      ).join('\n      ')}
    </ol>
  </nav>
</body>
</html>`;

    const chaptersXHTML = bookData.chapters.map((chapter, index) => 
        `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${escapeXML(chapter.title)}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 2em; }
    h1 { color: #333; border-bottom: 1px solid #ccc; }
    p { margin-bottom: 1em; text-align: justify; }
  </style>
</head>
<body>
  <h1>${escapeXML(chapter.title)}</h1>
  <div>${formatContent(chapter.content)}</div>
</body>
</html>`
    );

    // Create EPUB as ZIP file
    const zip = new JSZip();
    
    // MIME type
    zip.file("mimetype", "application/epub+zip");
    
    // Container
    zip.folder("META-INF").file("container.xml", containerXML);
    
    // Content files
    const oebps = zip.folder("OEBPS");
    oebps.file("content.opf", contentOPF);
    oebps.file("toc.xhtml", tocXHTML);
    
    chaptersXHTML.forEach((chapter, index) => {
        oebps.file(`chapter${index}.xhtml`, chapter);
    });

    return zip.generateAsync({type: "blob"});
}

// Helper functions
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function escapeXML(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

function formatContent(content) {
    // Simple formatting - convert line breaks to paragraphs
    return content.split('\n\n')
        .map(paragraph => paragraph.trim())
        .filter(paragraph => paragraph.length > 0)
        .map(paragraph => `<p>${escapeXML(paragraph)}</p>`)
        .join('\n  ');
}

// Generate EPUB file
async function generateEPUB(bookData) {
    try {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            // Load JSZip dynamically
            await loadJSZip();
        }

        const epubBlob = await generateSimpleEPUB(bookData);
        const url = URL.createObjectURL(epubBlob);
        
        return {
            blob: epubBlob,
            url: url,
            filename: `${bookData.title}.epub`
        };
    } catch (error) {
        throw new Error('EPUB generation failed: ' + error.message);
    }
}

// Load JSZip library
function loadJSZip() {
    return new Promise((resolve, reject) => {
        if (typeof JSZip !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load JSZip library'));
        document.head.appendChild(script);
    });
}

// Display conversion results
function displayConversionResult(bookData, epubResult) {
    readerDiv.innerHTML = `
        <div class="p-6 bg-white rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">✅ PDF to EPUB Conversion Successful!</h3>
            
            <div class="mb-4 p-4 bg-green-50 rounded">
                <p class="font-semibold">📖 "${bookData.title}"</p>
                <p class="text-sm text-gray-600">${bookData.totalPages} pages → ${bookData.chapters.length} chapters</p>
            </div>
            
            <div class="mb-4">
                <h4 class="font-semibold mb-2">Sample Content:</h4>
                <div class="bg-gray-50 p-4 rounded max-h-48 overflow-y-auto">
                    <pre class="whitespace-pre-wrap text-sm">${bookData.chapters[0]?.content?.substring(0, 500) || 'No content extracted'}...</pre>
                </div>
            </div>
            
            <div class="flex flex-col space-y-3">
                <a href="${epubResult.url}" download="${epubResult.filename}" 
                   class="bg-green-500 text-white px-6 py-3 rounded text-center font-semibold hover:bg-green-600 transition">
                   📥 Download EPUB File
                </a>
                
                <button onclick="convertAnother()" 
                   class="bg-gray-500 text-white px-6 py-3 rounded text-center font-semibold hover:bg-gray-600 transition">
                   🔄 Convert Another PDF
                </button>
            </div>
            
            <div class="mt-4 p-3 bg-blue-50 rounded text-sm">
                <p class="font-semibold">💡 Your EPUB is ready!</p>
                <p>Download the file and open it with Apple Books, Calibre, or any EPUB reader.</p>
            </div>
        </div>
    `;
}

// Reset for another conversion
function convertAnother() {
    pdfInput.value = '';
    readerDiv.innerHTML = '';
    currentPdfFile = null;
    setStatus('Ready to convert another PDF');
}

convertBtn.addEventListener('click', async () => {
    if (!pdfInput.files.length) {
        alert('Please select a PDF file first.');
        return;
    }

    const pdfFile = pdfInput.files[0];
    
    // Validate file size (limit to 5MB for browser processing)
    if (pdfFile.size > 5 * 1024 * 1024) {
        setStatus('File too large (max 5MB for browser processing)', true);
        return;
    }

    try {
        setStatus("Step 1: Extracting text from PDF...");

        // Extract text from PDF
        const bookData = await extractTextFromPDF(pdfFile);
        
        if (!bookData.chapters || bookData.chapters.length === 0) {
            setStatus("No readable text could be extracted from this PDF", true);
            return;
        }

        setStatus("Step 2: Generating EPUB file...");

        // Generate actual EPUB file
        const epubResult = await generateEPUB(bookData);

        // Display the results with download option
        displayConversionResult(bookData, epubResult);
        
        setStatus("✅ Conversion complete! Download your EPUB file.");

    } catch (err) {
        console.error('Conversion error:', err);
        setStatus(`Error: ${err.message}`, true);
        alert(`Error during conversion: ${err.message}`);
    }
});

// Make functions available globally
window.convertAnother = convertAnother;

document.addEventListener('DOMContentLoaded', () => {
    console.log("PDF to EPUB Converter loaded");
    setStatus("Ready to convert PDF files to EPUB");
});