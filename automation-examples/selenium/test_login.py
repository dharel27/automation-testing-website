"""
Selenium WebDriver Example Test Script
Tests the login functionality of the Automation Testing Website
"""

import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException


class TestLogin:
    @pytest.fixture(autouse=True)
    def setup_and_teardown(self):
        """Setup and teardown for each test"""
        # Setup
        chrome_options = Options()
        chrome_options.add_argument("--headless")  # Remove for debugging
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.driver.implicitly_wait(10)
        self.wait = WebDriverWait(self.driver, 10)
        self.base_url = "http://localhost:5173"
        
        # Reset test data before each test
        self.reset_test_data()
        
        yield
        
        # Teardown
        self.driver.quit()
    
    def reset_test_data(self):
        """Reset test data using the API"""
        import requests
        try:
            # Reset all data
            requests.post(f"http://localhost:3001/api/test-data/reset")
            # Seed with test users
            requests.post(f"http://localhost:3001/api/test-data/seed/users")
        except Exception as e:
            print(f"Warning: Could not reset test data: {e}")
    
    def test_login_page_loads(self):
        """Test that the login page loads correctly"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for login form to be present
        login_form = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='login-form']"))
        )
        
        # Check that all required elements are present
        assert login_form.is_displayed()
        
        email_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='email-input']")
        password_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='password-input']")
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='login-submit']")
        
        assert email_input.is_displayed()
        assert password_input.is_displayed()
        assert submit_button.is_displayed()
        assert submit_button.is_enabled()
    
    def test_successful_login(self):
        """Test successful login with valid credentials"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for form elements
        email_input = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='email-input']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='password-input']")
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='login-submit']")
        
        # Enter valid credentials
        email_input.clear()
        email_input.send_keys("test1@example.com")
        
        password_input.clear()
        password_input.send_keys("password123")
        
        # Submit form
        submit_button.click()
        
        # Wait for redirect to dashboard or home page
        self.wait.until(
            EC.url_contains("/dashboard") or EC.url_contains("/")
        )
        
        # Check that user menu is visible (indicates successful login)
        try:
            user_menu = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='user-menu-button']"))
            )
            assert user_menu.is_displayed()
        except TimeoutException:
            # Alternative check: look for logout button in mobile menu
            mobile_menu_toggle = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='mobile-menu-toggle']")
            mobile_menu_toggle.click()
            
            logout_button = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='mobile-nav-logout']"))
            )
            assert logout_button.is_displayed()
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials shows error"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for form elements
        email_input = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='email-input']"))
        )
        password_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='password-input']")
        submit_button = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='login-submit']")
        
        # Enter invalid credentials
        email_input.clear()
        email_input.send_keys("invalid@example.com")
        
        password_input.clear()
        password_input.send_keys("wrongpassword")
        
        # Submit form
        submit_button.click()
        
        # Wait for error message to appear
        error_message = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='login-error']"))
        )
        
        assert error_message.is_displayed()
        assert "Login failed" in error_message.text or "Invalid" in error_message.text
    
    def test_form_validation(self):
        """Test form validation for empty fields"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for submit button and click without filling fields
        submit_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='login-submit']"))
        )
        submit_button.click()
        
        # Check for validation errors
        try:
            email_error = self.wait.until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='email-error']"))
            )
            assert email_error.is_displayed()
            assert "required" in email_error.text.lower()
        except TimeoutException:
            # Check if HTML5 validation is being used
            email_input = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='email-input']")
            assert email_input.get_attribute("required") is not None
    
    def test_password_toggle(self):
        """Test password visibility toggle functionality"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for password input and toggle button
        password_input = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='password-input']"))
        )
        toggle_button = self.driver.find_element(By.CSS_SELECTOR, "[data-testid='toggle-password']")
        
        # Initially password should be hidden (type="password")
        assert password_input.get_attribute("type") == "password"
        
        # Click toggle to show password
        toggle_button.click()
        time.sleep(0.5)  # Small delay for UI update
        
        # Password should now be visible (type="text")
        assert password_input.get_attribute("type") == "text"
        
        # Click toggle again to hide password
        toggle_button.click()
        time.sleep(0.5)
        
        # Password should be hidden again
        assert password_input.get_attribute("type") == "password"
    
    def test_remember_me_checkbox(self):
        """Test remember me checkbox functionality"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for remember me checkbox
        remember_checkbox = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='remember-checkbox']"))
        )
        
        # Initially should be unchecked
        assert not remember_checkbox.is_selected()
        
        # Click to check
        remember_checkbox.click()
        assert remember_checkbox.is_selected()
        
        # Click to uncheck
        remember_checkbox.click()
        assert not remember_checkbox.is_selected()
    
    def test_forgot_password_link(self):
        """Test forgot password link is present and clickable"""
        self.driver.get(f"{self.base_url}/login")
        
        # Wait for forgot password link
        forgot_link = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='forgot-password-link']"))
        )
        
        assert forgot_link.is_displayed()
        assert forgot_link.is_enabled()
        assert "forgot" in forgot_link.text.lower()
    
    def test_navigation_to_register(self):
        """Test navigation from login to register page"""
        self.driver.get(f"{self.base_url}/login")
        
        # Look for register link (might be in different locations)
        try:
            register_link = self.wait.until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='register-link']"))
            )
        except TimeoutException:
            # Try alternative selectors
            register_link = self.driver.find_element(By.LINK_TEXT, "Sign Up")
        
        register_link.click()
        
        # Wait for register page to load
        self.wait.until(EC.url_contains("/register"))
        
        # Verify we're on the register page
        register_form = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='register-form']"))
        )
        assert register_form.is_displayed()


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])