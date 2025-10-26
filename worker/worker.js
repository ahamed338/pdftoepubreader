addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    if (request.method === "POST") {
        const formData = await request.formData()
        const file = formData.get("pdf")

        if (!file) {
            return new Response("No PDF file uploaded.", { status: 400 })
        }

        // CloudConvert API endpoint
        const apiKey = "YOUR_CLOUDCONVERT_API_KEY" // replace with your key
        const convertResponse = await fetch("https://api.cloudconvert.com/v2/convert", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                input_format: "pdf",
                output_format: "epub",
                file: file,
                engine: "office"
            })
        })

        const data = await convertResponse.json()
        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" }
        })
    }

    return new Response('Worker is ready. POST a PDF file to convert.', { status: 200 })
}
