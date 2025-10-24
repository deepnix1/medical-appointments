/**
 * Retell AI Webhook Test Script
 * Bu script, Retell AI webhook'larını test etmek için kullanılır
 */

const https = require('https');
const http = require('http');

// Test configuration
const config = {
  // Local development
  local: {
    baseUrl: 'http://localhost:3001', // Port 3001 kullanıyoruz
    webhookSecret: 'test_secret_123'
  },
  // Production (replace with your actual domain)
  production: {
    baseUrl: 'https://your-domain.com',
    webhookSecret: 'your_production_secret'
  }
};

// Test data
const testAppointmentData = {
  doctor_id: 'test_doctor_id', // Replace with actual doctor ID
  caller_number: '+905551234567',
  patient_first_name: 'Ahmet',
  patient_last_name: 'Yılmaz',
  patient_tc_number: '12345678901',
  requested_date: '2024-02-15',
  requested_time: '14:30'
};

const testCancelData = {
  appointment_id: 'test_appointment_id',
  reason: 'Patient requested cancellation'
};

/**
 * HTTP request helper
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-retell-secret': options.secret,
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: response
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test appointment creation webhook
 */
async function testAppointmentWebhook(environment = 'local') {
  console.log(`\n🧪 Testing Appointment Webhook (${environment})`);
  console.log('=' .repeat(50));
  
  const env = config[environment];
  const url = `${env.baseUrl}/api/webhooks/retell/appointment`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      secret: env.webhookSecret
    }, testAppointmentData);
    
    console.log('📤 Request Data:', JSON.stringify(testAppointmentData, null, 2));
    console.log('📥 Response Status:', response.statusCode);
    console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Appointment webhook test PASSED');
    } else {
      console.log('❌ Appointment webhook test FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error testing appointment webhook:', error.message);
  }
}

/**
 * Test appointment cancellation webhook
 */
async function testCancelWebhook(environment = 'local') {
  console.log(`\n🧪 Testing Cancel Webhook (${environment})`);
  console.log('=' .repeat(50));
  
  const env = config[environment];
  const url = `${env.baseUrl}/api/webhooks/retell/cancel`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      secret: env.webhookSecret
    }, testCancelData);
    
    console.log('📤 Request Data:', JSON.stringify(testCancelData, null, 2));
    console.log('📥 Response Status:', response.statusCode);
    console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Cancel webhook test PASSED');
    } else {
      console.log('❌ Cancel webhook test FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error testing cancel webhook:', error.message);
  }
}

/**
 * Test invalid webhook secret
 */
async function testInvalidSecret(environment = 'local') {
  console.log(`\n🧪 Testing Invalid Secret (${environment})`);
  console.log('=' .repeat(50));
  
  const env = config[environment];
  const url = `${env.baseUrl}/api/webhooks/retell/appointment`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      secret: 'invalid_secret'
    }, testAppointmentData);
    
    console.log('📥 Response Status:', response.statusCode);
    console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 401) {
      console.log('✅ Invalid secret test PASSED (correctly rejected)');
    } else {
      console.log('❌ Invalid secret test FAILED (should have been rejected)');
    }
    
  } catch (error) {
    console.error('❌ Error testing invalid secret:', error.message);
  }
}

/**
 * Test missing required fields
 */
async function testMissingFields(environment = 'local') {
  console.log(`\n🧪 Testing Missing Fields (${environment})`);
  console.log('=' .repeat(50));
  
  const env = config[environment];
  const url = `${env.baseUrl}/api/webhooks/retell/appointment`;
  
  const incompleteData = {
    doctor_id: 'test_doctor_id',
    // Missing other required fields
  };
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      secret: env.webhookSecret
    }, incompleteData);
    
    console.log('📤 Request Data:', JSON.stringify(incompleteData, null, 2));
    console.log('📥 Response Status:', response.statusCode);
    console.log('📥 Response Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 400) {
      console.log('✅ Missing fields test PASSED (correctly rejected)');
    } else {
      console.log('❌ Missing fields test FAILED (should have been rejected)');
    }
    
  } catch (error) {
    console.error('❌ Error testing missing fields:', error.message);
  }
}

/**
 * Run all tests
 */
async function runAllTests(environment = 'local') {
  console.log(`🚀 Starting Retell AI Webhook Tests (${environment})`);
  console.log('=' .repeat(60));
  
  await testAppointmentWebhook(environment);
  await testCancelWebhook(environment);
  await testInvalidSecret(environment);
  await testMissingFields(environment);
  
  console.log('\n🎉 All tests completed!');
  console.log('=' .repeat(60));
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const environment = args[0] || 'local';
  
  if (!config[environment]) {
    console.error('❌ Invalid environment. Use: local or production');
    process.exit(1);
  }
  
  await runAllTests(environment);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testAppointmentWebhook,
  testCancelWebhook,
  testInvalidSecret,
  testMissingFields,
  runAllTests
};
