export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

    if (request.method === "POST") {
      try {
        const formData = await request.formData();
        const file = formData.get("pdf");

        if (!file) {
          return new Response(JSON.stringify({ error: "No PDF file uploaded." }), {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*"
            }
          });
        }

        const apiKey = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIxIiwianRpIjoiZTBhY2Y1MTJmNmVmMTY5ODRiZjY2ZWVhYjk4ODRjNzgzN2ZiNGMzYmQyMjRmYzc3ZTU0OWRmNmFlMjM1MjBhYzJjZGZkZjVlYmE4YWY4ODciLCJpYXQiOjE3NjE0NzIxODEuNjM2NjY2LCJuYmYiOjE3NjE0NzIxODEuNjM2NjY3LCJleHAiOjQ5MTcxNDU3ODEuNjMxNzU5LCJzdWIiOiI3MzI5MzA3OSIsInNjb3BlcyI6WyJ1c2VyLnJlYWQiLCJ1c2VyLndyaXRlIiwidGFzay5yZWFkIiwidGFzay53cml0ZSIsIndlYmhvb2sucmVhZCIsIndlYmhvb2sud3JpdGUiLCJwcmVzZXQucmVhZCIsInByZXNldC53cml0ZSJdfQ.EEdqlEvfSS_FNcH7tPsxnVtTo2MaKX7jOv1pDh0jjypd5hpTe3saF4zVlgXnnsSRuirELhafC4k44mmdWSjYwYNvzstc-5zzqPiXSTMyHiu3ALguhhly2TFhpIujrG-APVkTH32pFB2zi0_1Hyn8QxlyIo8Hx5Df1YhF5HSJcCw1xCN7Ttre3-nHzSseehUpoS1kCHJwsgTbAvADxi0vdNL35I5Ki4wEa0syNiJb9oDRFSSQez_CdjMelAvRRcfGYelkPGXnCA6dD3zL2DPlburhFXLOFFTqjlstTcQVk4c7enpB3Msp9N__3LqcULsWLmAWS_8-gvaN4Y33dO1S_gYGR_a3GNzLnDviZADsSLjxwmJ_1L85R9-dTpEBW1l79L-Nn3qmgoltzLCGra5lJsXyp5485ejVqHWpuVP6KwebvjGN4Nt537UGHlw8W_-AS5cNYPVRcL866k950A59ZA35bygMd4wLPotzdVn0d9BaS3gCv9ZP96Qx-6NlPdFlpGbTGEXrpnajILsmkmZh3euTVmKGANcMSvKzLvSp8umPZDkA9WEE7rnYZHn-lvEwPwFl_EonmpgU4qdUNglqOeIGphCa6dvYlbgb9bALpfaxyfo5UUk7gGOdyl6R7JY037xLqXXIYqnOGsbBBd_j9lYKnUtoVkWz8P_KLv4xngY"; // Replace with your actual key
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
        });

        const data = await convertResponse.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json", 
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    return new Response('Worker is ready. POST a PDF file to convert.', {
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};