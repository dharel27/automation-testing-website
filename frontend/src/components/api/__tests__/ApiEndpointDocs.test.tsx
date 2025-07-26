import { render, screen, fireEvent } from '@testing-library/react';
import { ApiEndpointDocs } from '../ApiEndpointDocs';

describe('ApiEndpointDocs', () => {
  it('renders API documentation title and description', () => {
    render(<ApiEndpointDocs />);

    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Available endpoints for testing. Click on an endpoint to see detailed documentation.'
      )
    ).toBeInTheDocument();
  });

  it('displays list of API endpoints', () => {
    render(<ApiEndpointDocs />);

    expect(screen.getByTestId('api-endpoints-list')).toBeInTheDocument();

    // Check for some key endpoints
    expect(screen.getByText('/api/health')).toBeInTheDocument();
    expect(screen.getByText('/api/users')).toBeInTheDocument();
    expect(screen.getByText('/api/test/delay/:ms')).toBeInTheDocument();
    expect(screen.getByText('/api/test/error/:code')).toBeInTheDocument();
  });

  it('displays HTTP method badges with correct colors', () => {
    render(<ApiEndpointDocs />);

    // Check for different HTTP methods
    const getMethods = screen.getAllByText('GET');
    const postMethods = screen.getAllByText('POST');

    expect(getMethods.length).toBeGreaterThan(0);
    expect(postMethods.length).toBeGreaterThan(0);

    // Check that methods have appropriate styling classes
    getMethods.forEach((method) => {
      expect(method).toHaveClass('bg-green-100', 'text-green-800');
    });

    postMethods.forEach((method) => {
      expect(method).toHaveClass('bg-blue-100', 'text-blue-800');
    });
  });

  it('shows endpoint descriptions', () => {
    render(<ApiEndpointDocs />);

    expect(screen.getByText('Health check endpoint')).toBeInTheDocument();
    expect(
      screen.getByText('Get all users with pagination')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Test endpoint with configurable delay')
    ).toBeInTheDocument();
  });

  it('expands endpoint details when clicked', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');
    fireEvent.click(healthEndpoint);

    // Should show expanded documentation
    expect(screen.getByText('Responses')).toBeInTheDocument();
    expect(screen.getByText('API is healthy')).toBeInTheDocument();
  });

  it('collapses endpoint details when clicked again', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');

    // Expand
    fireEvent.click(healthEndpoint);
    expect(screen.getByText('Responses')).toBeInTheDocument();

    // Collapse
    fireEvent.click(healthEndpoint);
    expect(screen.queryByText('Responses')).not.toBeInTheDocument();
  });

  it('shows parameters for endpoints that have them', () => {
    render(<ApiEndpointDocs />);

    const usersEndpoint = screen.getByTestId('endpoint-get-api-users');
    fireEvent.click(usersEndpoint);

    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
    expect(screen.getByText('limit')).toBeInTheDocument();
    expect(screen.getByText('Page number (default: 1)')).toBeInTheDocument();
  });

  it('shows request body for POST endpoints', () => {
    render(<ApiEndpointDocs />);

    const loginEndpoint = screen.getByTestId('endpoint-post-api-auth-login');
    fireEvent.click(loginEndpoint);

    expect(screen.getByText('Request Body')).toBeInTheDocument();
    expect(
      screen.getByText('Content-Type: application/json')
    ).toBeInTheDocument();
  });

  it('displays response examples with status codes', () => {
    render(<ApiEndpointDocs />);

    const loginEndpoint = screen.getByTestId('endpoint-post-api-auth-login');
    fireEvent.click(loginEndpoint);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('401')).toBeInTheDocument();
    expect(screen.getByText('Login successful')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('shows required parameters with proper indication', () => {
    render(<ApiEndpointDocs />);

    const delayEndpoint = screen.getByTestId('endpoint-get-api-test-delay--ms');
    fireEvent.click(delayEndpoint);

    expect(screen.getByText('ms')).toBeInTheDocument();
    expect(screen.getByText('required')).toBeInTheDocument();
    expect(
      screen.getByText('Delay in milliseconds (max: 30000)')
    ).toBeInTheDocument();
  });

  it('displays different status code colors correctly', () => {
    render(<ApiEndpointDocs />);

    const errorEndpoint = screen.getByTestId(
      'endpoint-get-api-test-error--code'
    );
    fireEvent.click(errorEndpoint);

    const status400 = screen.getByText('400');
    expect(status400).toHaveClass('text-red-600');
  });

  it('handles endpoints without parameters gracefully', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');
    fireEvent.click(healthEndpoint);

    // Should not show Parameters section
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
    // But should show Responses
    expect(screen.getByText('Responses')).toBeInTheDocument();
  });

  it('handles endpoints without request body gracefully', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');
    fireEvent.click(healthEndpoint);

    // Should not show Request Body section
    expect(screen.queryByText('Request Body')).not.toBeInTheDocument();
  });

  it('shows parameter types correctly', () => {
    render(<ApiEndpointDocs />);

    const productsEndpoint = screen.getByTestId('endpoint-get-api-products');
    fireEvent.click(productsEndpoint);

    expect(screen.getByText('number')).toBeInTheDocument(); // for page, limit, minPrice, maxPrice
    expect(screen.getByText('string')).toBeInTheDocument(); // for q, category
    expect(screen.getByText('boolean')).toBeInTheDocument(); // for inStock
  });

  it('displays JSON examples in proper format', () => {
    render(<ApiEndpointDocs />);

    const echoEndpoint = screen.getByTestId('endpoint-post-api-test-echo');
    fireEvent.click(echoEndpoint);

    // Should show formatted JSON examples
    expect(screen.getByText(/"message": "Hello, API!"/)).toBeInTheDocument();
    expect(screen.getByText(/"method": "POST"/)).toBeInTheDocument();
  });

  it('allows only one endpoint to be expanded at a time', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');
    const usersEndpoint = screen.getByTestId('endpoint-get-api-users');

    // Expand health endpoint
    fireEvent.click(healthEndpoint);
    expect(screen.getByText('API is healthy')).toBeInTheDocument();

    // Expand users endpoint
    fireEvent.click(usersEndpoint);
    expect(screen.getByText('List of users')).toBeInTheDocument();

    // Health endpoint should be collapsed
    expect(screen.queryByText('API is healthy')).not.toBeInTheDocument();
  });

  it('shows arrow icon rotation when expanding/collapsing', () => {
    render(<ApiEndpointDocs />);

    const healthEndpoint = screen.getByTestId('endpoint-get-api-health');
    const arrow = healthEndpoint.querySelector('svg');

    expect(arrow).not.toHaveClass('rotate-180');

    fireEvent.click(healthEndpoint);
    expect(arrow).toHaveClass('rotate-180');

    fireEvent.click(healthEndpoint);
    expect(arrow).not.toHaveClass('rotate-180');
  });

  it('displays all supported HTTP methods', () => {
    render(<ApiEndpointDocs />);

    // Should have GET, POST methods visible
    expect(screen.getAllByText('GET').length).toBeGreaterThan(0);
    expect(screen.getAllByText('POST').length).toBeGreaterThan(0);
  });

  it('shows comprehensive test endpoints', () => {
    render(<ApiEndpointDocs />);

    // Check for test-specific endpoints
    expect(screen.getByText('/api/test/delay/:ms')).toBeInTheDocument();
    expect(screen.getByText('/api/test/error/:code')).toBeInTheDocument();
    expect(screen.getByText('/api/test/echo')).toBeInTheDocument();
    expect(screen.getByText('/api/test/large-dataset')).toBeInTheDocument();
    expect(screen.getByText('/api/test/random-failure')).toBeInTheDocument();
  });
});
