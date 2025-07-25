import request from 'supertest';
import app from './dist/index.js';

async function testEndpoints() {
  console.log('Testing API endpoints...');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await request(app).get('/api/health').expect(200);
    console.log('✅ Health endpoint working:', healthResponse.body.message);

    // Test users endpoint (should work without auth for GET)
    console.log('2. Testing users endpoint...');
    const usersResponse = await request(app).get('/api/users').expect(200);
    console.log(
      '✅ Users endpoint working, returned',
      usersResponse.body.data.length,
      'users'
    );

    // Test products endpoint
    console.log('3. Testing products endpoint...');
    const productsResponse = await request(app)
      .get('/api/products')
      .expect(200);
    console.log(
      '✅ Products endpoint working, returned',
      productsResponse.body.data.length,
      'products'
    );

    // Test product search
    console.log('4. Testing product search...');
    const searchResponse = await request(app)
      .get('/api/products/search?q=test')
      .expect(200);
    console.log(
      '✅ Product search working, returned',
      searchResponse.body.data.length,
      'results'
    );

    // Test product categories
    console.log('5. Testing product categories...');
    const categoriesResponse = await request(app)
      .get('/api/products/categories')
      .expect(200);
    console.log(
      '✅ Product categories working, returned',
      categoriesResponse.body.data.length,
      'categories'
    );

    console.log('\n🎉 All core API endpoints are working correctly!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  process.exit(0);
}

testEndpoints();
