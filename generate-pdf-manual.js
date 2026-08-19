const fetch = require('node:fetch');

const SUPABASE_URL = 'https://lwezzcpvuspezufndvzo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZXp6Y3B2dXNwZXp1Zm5kdnpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkxNzA2NSwiZXhwIjoyMDc1NDkzMDY1fQ.t-zQ5k1YcHWMfhQGW7KZ7K_gP9p5XdJ_5JkIaGUWoHQ';

const orderData = {
  orderId: 'adf108fd-daf4-4821-bb80-19b2ec1cde47',
  title: 'De impact van videoproductie op uw marketingstrategie: Een Uitgebreide Gids',
  subject: 'De impact van videoproductie op uw marketingstrategie',
  chapters: [
    {
      title: 'Inleiding',
      content: 'Hoofdstuk content hier...',
      image: {
        url: 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg',
        photographer: 'Asif Methar',
        photographerUrl: 'https://www.pexels.com/@asifmethar'
      }
    }
  ]
};

async function generatePDF() {
  try {
    console.log('Generating PDF for order:', orderData.orderId);

    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to generate PDF:', response.status, errorText);
      process.exit(1);
    }

    const result = await response.json();
    console.log('PDF generated successfully:', result);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

generatePDF();
