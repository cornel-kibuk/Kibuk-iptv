import requests
import sys
import json
from datetime import datetime

class IPTVAPITester:
    def __init__(self, base_url="https://live-tv-streaming-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")

            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "response_preview": response.text[:100] if not success else "OK"
            })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "name": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": "ERROR",
                "success": False,
                "response_preview": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_playlists_endpoints(self):
        """Test playlist management endpoints"""
        print("\n📺 Testing Playlist Endpoints...")
        
        # Get playlists (should work even if empty)
        success, playlists = self.run_test("Get Playlists", "GET", "playlists", 200)
        
        # Try to create a test playlist (this might fail due to invalid URL, but we test the endpoint)
        test_playlist = {
            "name": "Test Playlist",
            "url": "https://example.com/test.m3u"
        }
        playlist_success, playlist_data = self.run_test("Create Playlist", "POST", "playlists", 400, test_playlist)
        
        return success

    def test_channels_endpoints(self):
        """Test channel endpoints"""
        print("\n📡 Testing Channel Endpoints...")
        
        # Get all channels
        success1, channels = self.run_test("Get Channels", "GET", "channels", 200)
        
        # Get channels with radio filter
        success2, radio_channels = self.run_test("Get Radio Channels", "GET", "channels", 200, params={"radio": True})
        
        # Get channel groups
        success3, groups = self.run_test("Get Channel Groups", "GET", "channels/groups", 200)
        
        # Search channels
        success4, search_results = self.run_test("Search Channels", "GET", "channels", 200, params={"search": "test"})
        
        return success1 and success2 and success3 and success4

    def test_vod_endpoints(self):
        """Test VOD endpoints"""
        print("\n🎬 Testing VOD Endpoints...")
        
        # Get VOD items
        success1, vod_items = self.run_test("Get VOD Items", "GET", "vod", 200)
        
        # Get VOD categories
        success2, categories = self.run_test("Get VOD Categories", "GET", "vod/categories", 200)
        
        # Search VOD
        success3, search_results = self.run_test("Search VOD", "GET", "vod", 200, params={"search": "test"})
        
        return success1 and success2 and success3

    def test_series_endpoints(self):
        """Test Series endpoints"""
        print("\n📺 Testing Series Endpoints...")
        
        # Get series
        success1, series = self.run_test("Get Series", "GET", "series", 200)
        
        # Try to get a specific series (might fail if no series exist)
        success2, series_detail = self.run_test("Get Series Detail", "GET", "series/test-id", 404)
        
        return success1 and success2

    def test_favorites_endpoints(self):
        """Test Favorites endpoints"""
        print("\n⭐ Testing Favorites Endpoints...")
        
        # Get favorites
        success1, favorites = self.run_test("Get Favorites", "GET", "favorites", 200)
        
        # Try to add a favorite (might fail if channel doesn't exist)
        test_favorite = {
            "channel_id": "test-channel-id",
            "channel_name": "Test Channel",
            "channel_url": "https://example.com/stream",
            "channel_logo": "https://example.com/logo.png",
            "channel_group": "Test Group"
        }
        success2, add_result = self.run_test("Add Favorite", "POST", "favorites", 400, test_favorite)
        
        return success1

    def test_settings_endpoints(self):
        """Test Settings endpoints"""
        print("\n⚙️ Testing Settings Endpoints...")
        
        # Get settings
        success1, settings = self.run_test("Get Settings", "GET", "settings", 200)
        
        # Update settings
        if success1:
            test_settings = {
                "id": "default",
                "player_quality": "720p",
                "buffer_size": 45,
                "epg_url": "https://example.com/epg.xml",
                "parental_control": True,
                "parental_pin": "1234",
                "ui_scale": "large",
                "language": "en"
            }
            success2, update_result = self.run_test("Update Settings", "PUT", "settings", 200, test_settings)
            return success1 and success2
        
        return success1

    def test_epg_endpoint(self):
        """Test EPG endpoint (mocked)"""
        print("\n📅 Testing EPG Endpoint...")
        
        # Get EPG data
        success1, epg_data = self.run_test("Get EPG", "GET", "epg", 200)
        
        # Get EPG for specific channel
        success2, channel_epg = self.run_test("Get Channel EPG", "GET", "epg", 200, params={"channel_id": "test-channel"})
        
        return success1 and success2

    def test_messages_endpoints(self):
        """Test Messages endpoints"""
        print("\n💬 Testing Messages Endpoints...")
        
        # Get messages
        success1, messages = self.run_test("Get Messages", "GET", "messages", 200)
        
        # Try to mark a message as read (might fail if no messages exist)
        success2, mark_read = self.run_test("Mark Message Read", "POST", "messages/read/test-id", 200)
        
        return success1

    def test_recordings_endpoints(self):
        """Test Recordings endpoints"""
        print("\n🔴 Testing Recordings Endpoints...")
        
        # Get recordings
        success1, recordings = self.run_test("Get Recordings", "GET", "recordings", 200)
        
        return success1

    def test_version_endpoint(self):
        """Test Version endpoint"""
        print("\n🔄 Testing Version Endpoint...")
        
        return self.run_test("Get Version", "GET", "version", 200)[0]

def main():
    print("🚀 Starting IPTV API Tests...")
    print("=" * 50)
    
    tester = IPTVAPITester()
    
    # Run all tests
    tests = [
        tester.test_root_endpoint,
        tester.test_playlists_endpoints,
        tester.test_channels_endpoints,
        tester.test_vod_endpoints,
        tester.test_series_endpoints,
        tester.test_favorites_endpoints,
        tester.test_settings_endpoints,
        tester.test_epg_endpoint,
        tester.test_messages_endpoints,
        tester.test_recordings_endpoints,
        tester.test_version_endpoint
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Summary:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    # Print failed tests
    failed_tests = [t for t in tester.test_results if not t['success']]
    if failed_tests:
        print(f"\n❌ Failed Tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test['name']}: {test['actual_status']} (expected {test['expected_status']})")
            if test['response_preview']:
                print(f"     Error: {test['response_preview']}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())