export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const file = formData.get('pdf');

        if (!file) {
          return new Response(JSON.stringify({ error: 'No PDF file uploaded' }), {
            status: 400,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        console.log('🚀 Starting conversion for:', file.name, Math.round(file.size/1024) + 'KB');

        // Use a different approach - try Zamzar API instead
        const conversionResult = await convertWithZamzar(file);
        
        if (conversionResult.error) {
          // Fallback to CloudConvert with minimal setup
          const cloudConvertResult = await tryMinimalCloudConvert(file, env.CLOUDCONVERT_API_KEY);
          if (cloudConvertResult.error) {
            return new Response(JSON.stringify({ 
              error: 'All conversion attempts failed',
              details: {
                zamzar: conversionResult.error,
                cloudconvert: cloudConvertResult.error
              },
              note: 'PDF to EPUB conversion is complex and may not be supported by these services'
            }), {
              status: 500,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            });
          }
          return new Response(JSON.stringify(cloudConvertResult), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        return new Response(JSON.stringify(conversionResult), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });

      } catch (error) {
        console.error('Conversion error:', error);
        return new Response(JSON.stringify({ 
          error: 'Conversion failed',
          details: error.message
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return new Response(JSON.stringify({ 
      message: 'PDF to EPUB Converter',
      status: 'Testing conversion services...'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

// Try Zamzar API (often better for PDF conversions)
async function convertWithZamzar(pdfFile) {
  try {
    console.log('🔄 Trying Zamzar API...');
    
    // This would require a Zamzar API key
    // For now, just return a message
    return {
      error: 'Zamzar API not configured',
      note: 'Would need Zamzar API key for PDF to EPUB conversion'
    };
  } catch (error) {
    return {
      error: 'Zamzar failed: ' + error.message
    };
  }
}

// Minimal CloudConvert attempt
async function tryMinimalCloudConvert(pdfFile, apiKey) {
  if (!apiKey) {
    return {
      error: 'CloudConvert API key not configured'
    };
  }

  try {
    console.log('🔄 Trying minimal CloudConvert...');

    // Create the simplest possible job
    const jobResponse = await fetch('https://api.cloudconvert.com/v2/jobs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tasks: {
          'upload-file': {
            'operation': 'import/upload'
          },
          'convert-file': {
            'operation': 'convert',
            'input': ['upload-file'],
            'output_format': 'txt', // Try simple text conversion first
            'engine': 'pdf2txt'
          },
          'export-file': {
            'operation': 'export/url',
            'input': ['convert-file']
          }
        }
      })
    });

    console.log('📤 Job creation response status:', jobResponse.status);

    if (!jobResponse.ok) {
      const errorText = await jobResponse.text();
      return {
        error: `CloudConvert job creation failed: ${jobResponse.status}`,
        debug: errorText.substring(0, 200) // First 200 chars only
      };
    }

    const jobData = await jobResponse.json();
    console.log('✅ Job created:', jobData.data?.id);

    // Get upload URL
    const uploadTask = jobData.data.tasks.find(task => task.operation === 'import/upload');
    if (!uploadTask || !uploadTask.result) {
      return {
        error: 'No upload URL in response',
        debug: JSON.stringify(jobData)
      };
    }

    const uploadUrl = uploadTask.result.form.url;
    const uploadParams = uploadTask.result.form.parameters;

    console.log('⬆️ Uploading file...');

    // Upload file
    const uploadForm = new FormData();
    for (const [key, value] of Object.entries(uploadParams)) {
      uploadForm.append(key, value);
    }
    uploadForm.append('file', pdfFile);

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadForm
    });

    console.log('📤 Upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      return {
        error: `Upload failed: ${uploadResponse.status}`
      };
    }

    console.log('✅ File uploaded, checking status...');

    // Check status once
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const statusResponse = await fetch(`https://api.cloudconvert.com/v2/jobs/${jobData.data.id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!statusResponse.ok) {
      return {
        error: `Status check failed: ${statusResponse.status}`
      };
    }

    const statusData = await statusResponse.json();
    console.log('📊 Final job status:', statusData.data.status);

    return {
      status: 'PARTIAL_SUCCESS',
      message: 'CloudConvert job created and file uploaded',
      jobStatus: statusData.data.status,
      note: 'PDF to TXT conversion attempted. PDF to EPUB may not be supported.'
    };

  } catch (error) {
    console.error('CloudConvert error:', error);
    return {
      error: 'CloudConvert failed: ' + error.message
    };
  }
}