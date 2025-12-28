#!/usr/bin/env python3
"""
Backend API Testing Script for SecureBank Application
Tests all critical API endpoints to ensure backend functionality
"""

import requests
import sys
import json
from datetime import datetime

class SecureBankAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 200:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw response: {response.text[:200]}")

            return success, response.json() if response.content else {}

        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection Error: Cannot connect to {url}")
            return False, {}
        except requests.exceptions.Timeout:
            print(f"❌ Failed - Timeout: Request took longer than 10 seconds")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        url = f"{self.base_url}/health"  # Health is at root level, not /api
        self.tests_run += 1
        print(f"\n🔍 Testing Health Check...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, timeout=10)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Health Status: {response_data.get('status', 'unknown')}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
            return success, response.json() if response.content else {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_user_data = {
            "email": f"test_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "TestPass123!@#",  # Updated to meet requirements
            "fullName": "Test User",  # Changed from firstName/lastName to fullName
            "accountType": "checking"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            201,
            data=test_user_data
        )
        
        if success and 'accessToken' in response:
            self.token = response['accessToken']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_user_login(self):
        """Test user login with demo credentials"""
        login_data = {
            "email": "alice@demo.com",
            "password": "demo123"
        }
        
        success, response = self.run_test(
            "User Login (Demo)",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'accessToken' in response:
            self.token = response['accessToken']
            if 'user' in response:
                self.user_id = response['user'].get('id')
            print(f"   ✅ Demo login successful, token: {self.token[:20]}...")
            return True
        return False

    def test_profile_fetch(self):
        """Test fetching user profile"""
        if not self.token:
            print("❌ Skipping profile test - no token available")
            return False
            
        return self.run_test("Fetch Profile", "GET", "profile", 200)[0]

    def test_accounts_fetch(self):
        """Test fetching user accounts"""
        if not self.token:
            print("❌ Skipping accounts test - no token available")
            return False
            
        return self.run_test("Fetch Accounts", "GET", "accounts", 200)[0]

    def test_transactions_fetch(self):
        """Test fetching transactions"""
        if not self.token:
            print("❌ Skipping transactions test - no token available")
            return False
            
        return self.run_test("Fetch Transactions", "GET", "transactions", 200)[0]

    def test_kyc_status(self):
        """Test KYC status endpoint"""
        if not self.token:
            print("❌ Skipping KYC test - no token available")
            return False
            
        return self.run_test("KYC Status", "GET", "kyc/status", 200)[0]

def main():
    print("🏦 SecureBank Backend API Testing")
    print("=" * 50)
    
    # Initialize tester
    tester = SecureBankAPITester()
    
    # Test sequence
    print("\n📋 Running API Tests...")
    
    # Basic connectivity
    if not tester.test_health_check():
        print("❌ Health check failed - backend may be down")
        return 1
    
    # Authentication tests
    auth_success = False
    
    # Try demo login first
    if tester.test_user_login():
        auth_success = True
    else:
        # If demo login fails, try registration
        if tester.test_user_registration():
            auth_success = True
    
    if not auth_success:
        print("❌ Authentication failed - cannot test protected endpoints")
        print(f"\n📊 Basic Tests: {tester.tests_passed}/{tester.tests_run} passed")
        return 1
    
    # Protected endpoint tests
    tester.test_profile_fetch()
    tester.test_accounts_fetch()
    tester.test_transactions_fetch()
    tester.test_kyc_status()
    
    # Print final results
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check backend implementation")
        return 1

if __name__ == "__main__":
    sys.exit(main())