"""
Pytest configuration for Selenium tests
"""

import pytest
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.support.ui import WebDriverWait


def pytest_addoption(parser):
    """Add command line options for test configuration"""
    parser.addoption(
        "--browser",
        action="store",
        default="chrome",
        help="Browser to run tests on: chrome, firefox, edge"
    )
    parser.addoption(
        "--headless",
        action="store_true",
        default=False,
        help="Run tests in headless mode"
    )
    parser.addoption(
        "--base-url",
        action="store",
        default="http://localhost:5173",
        help="Base URL for the application"
    )
    parser.addoption(
        "--api-url",
        action="store",
        default="http://localhost:3001",
        help="Base URL for the API"
    )


@pytest.fixture(scope="session")
def browser_name(request):
    """Get browser name from command line"""
    return request.config.getoption("--browser")


@pytest.fixture(scope="session")
def headless(request):
    """Get headless mode from command line"""
    return request.config.getoption("--headless")


@pytest.fixture(scope="session")
def base_url(request):
    """Get base URL from command line"""
    return request.config.getoption("--base-url")


@pytest.fixture(scope="session")
def api_url(request):
    """Get API URL from command line"""
    return request.config.getoption("--api-url")


@pytest.fixture
def driver(browser_name, headless):
    """Create WebDriver instance"""
    if browser_name.lower() == "chrome":
        options = Options()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        
        driver = webdriver.Chrome(options=options)
    
    elif browser_name.lower() == "firefox":
        options = FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        
        driver = webdriver.Firefox(options=options)
    
    else:
        raise ValueError(f"Unsupported browser: {browser_name}")
    
    driver.implicitly_wait(10)
    driver.maximize_window()
    
    yield driver
    
    driver.quit()


@pytest.fixture
def wait(driver):
    """Create WebDriverWait instance"""
    return WebDriverWait(driver, 10)


@pytest.fixture(autouse=True)
def reset_test_data(api_url):
    """Reset test data before each test"""
    import requests
    try:
        requests.post(f"{api_url}/api/test-data/reset", timeout=5)
        requests.post(f"{api_url}/api/test-data/seed/users", timeout=5)
    except Exception as e:
        print(f"Warning: Could not reset test data: {e}")


# Custom markers
def pytest_configure(config):
    """Configure custom markers"""
    config.addinivalue_line(
        "markers", "smoke: mark test as smoke test"
    )
    config.addinivalue_line(
        "markers", "regression: mark test as regression test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )


# HTML report configuration
def pytest_html_report_title(report):
    """Customize HTML report title"""
    report.title = "Automation Testing Website - Selenium Test Report"