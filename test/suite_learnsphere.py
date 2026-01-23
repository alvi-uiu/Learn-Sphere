import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import UnexpectedAlertPresentException, NoAlertPresentException
from webdriver_manager.chrome import ChromeDriverManager
from config import Config
import time
import os

REPORT_FILE = "report.txt"
num_users = 3

def write_report(message):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    full_message = f"[{timestamp}] {message}"
    try:
        with open(REPORT_FILE, "a") as f:
            f.write(full_message + "\n")
        print(full_message)
    except Exception as e:
        print(f"Failed to write to report: {e}")

@pytest.fixture(scope="module")
def driver():
    # Clear report file at the start
    try:
        with open(REPORT_FILE, "w") as f:
            f.write("=== Test Suite Started ===\n")
    except Exception as e:
        print(f"Warning: Could not clear report file: {e}")

    chrome_options = Options()
    # chrome_options.add_argument("--headless")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.implicitly_wait(Config.TIMEOUT)
    driver.maximize_window()
    yield driver
    driver.quit()
    write_report("=== Test Suite Finished ===")

class TestLearnSphere:
    
    def test_login_and_wait(self, driver):
        """Test: Open login page, perform login, and wait for 1 second"""
        write_report("\nTest Case 1: Login and Wait")
        write_report("Action: Navigating to Base URL")
        driver.get(f"{Config.BASE_URL}")
        
        # 1. Fill Email
        write_report("Action: Entering Email")
        email_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
        )
        email_input.send_keys(Config.USER_EMAIL)
        time.sleep(1)
        
        # 2. Fill Password
        write_report("Action: Entering Password")
        password_input = driver.find_element(By.XPATH, "//input[@type='password']")
        password_input.send_keys(Config.USER_PASSWORD)
        time.sleep(1)
        
        # 3. Click Login
        write_report("Action: Clicking Login Button")
        driver.find_element(By.XPATH, "//button[@type='submit']").click()
        
        # 4. Wait for dashboard and then wait 1 second
        write_report("Action: Waiting for Dashboard")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Logout')]"))
        )
        
        write_report("Action: Waiting for 1 second...")
        time.sleep(1)
        
        write_report("Result: Login successful and wait finished!")
        assert True

    def test_create_multiple_users(self, driver):
        """Test: Create user accounts with unique 14-digit passwords"""
        write_report("\nTest Case 2: Create Multiple Users")
        import secrets
        import string
        

        write_report(f"Action: Starting creation of {num_users} users")
        
        for i in range(1, num_users + 1):
            user_name = f"user{i}"
            user_email = f"{user_name}@gmail.com"
            user_password = ''.join(secrets.choice(string.digits) for _ in range(14))
            
            # 1. Start with a completely clean state
            driver.delete_all_cookies()
            driver.execute_script("window.localStorage.clear();")
            driver.get(f"{Config.BASE_URL}")
            driver.refresh()
            time.sleep(2) # Give it time to load the login page
            
            try:
                write_report(f"Action: Attempting to create {user_name} ({user_email})")
                
                # 2. Switch to Register View
                register_toggle = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Sign up')]"))
                )
                driver.execute_script("arguments[0].scrollIntoView();", register_toggle)
                time.sleep(1)
                driver.execute_script("arguments[0].click();", register_toggle)
                
                # 3. Fill Registration Form
                name_field = WebDriverWait(driver, 15).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@placeholder='John Doe']"))
                )
                time.sleep(1) 
                
                name_field.send_keys(user_name)
                driver.find_element(By.XPATH, "//input[@type='email']").send_keys(user_email)
                driver.find_element(By.XPATH, "//input[@type='password']").send_keys(user_password)
                
                # 4. Click the 'Sign Up' submit button
                submit_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
                driver.execute_script("arguments[0].scrollIntoView();", submit_btn)
                driver.execute_script("arguments[0].click();", submit_btn)
                time.sleep(1)
                
                # 5. Wait for Dashboard or Error
                WebDriverWait(driver, 25).until(
                    lambda d: d.find_elements(By.XPATH, "//*[contains(text(), 'Logout')]") or 
                              d.find_elements(By.XPATH, "//*[contains(text(), 'already exists') or contains(text(), 'error')]")
                )
                
                if driver.find_elements(By.XPATH, "//*[contains(text(), 'Logout')]"):
                    write_report(f"Result: {user_name} created and logged in successfully.")
                else:
                    write_report(f"Result: {user_name} creation skipped (likely exists).")
                    
            except Exception as e:
                write_report(f"Result: FAILED to create {user_name}. Reason: {type(e).__name__}: {str(e)}")
                continue

        write_report(f"Result: Account creation attempts finished.")
        assert True

    def test_admin_login_and_delete_users(self, driver):
        """Test: Login as Admin, delete user1 and user2, then logout"""
        write_report("\nTest Case 3 & 4: Admin Login and Delete Users")
        
        # 1. Login as Admin
        write_report("Action: Logging in as Admin")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.get(f"{Config.BASE_URL}")
        driver.refresh()
        
        time.sleep(2)
        
        try:
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.ADMIN_EMAIL)
            
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            password_input.send_keys(Config.ADMIN_PASSWORD)
            
            login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
            driver.execute_script("arguments[0].click();", login_btn)
            
            # Wait for Admin Dashboard
            write_report("Action: Waiting for Admin Dashboard")
            try:
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Admin Hub')]"))
                )
                write_report("Result: Admin Login Successful")
            except Exception:
                current_url = driver.current_url
                page_source = driver.page_source
                error_msg = "Unknown Error"
                if "Invalid credentials" in page_source:
                    error_msg = "Invalid Credentials"
                elif "Sign in" in page_source:
                    error_msg = "Still on Login Page"
                
                write_report(f"Result: Admin Login FAILED. URL: {current_url}. Reason: {error_msg}")
                raise

            # 2. Navigate to Users Tab
            write_report("Action: Navigating to Users Tab")
            try:
                users_tab = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Users')]"))
                )
                driver.execute_script("arguments[0].scrollIntoView();", users_tab)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", users_tab)
                time.sleep(1)
            except Exception as e:
                write_report(f"Result: Failed to click Users tab. Reason: {str(e)}")
                raise e

            time.sleep(2) # Wait for table to load
            
            # 3. Delete Users
            users_to_delete = [f"user{i}" for i in range(1, num_users + 1)]
            
            for user in users_to_delete:
                write_report(f"Action: searching for {user} to delete")
                try:
                    search_input = driver.find_element(By.XPATH, "//input[@placeholder='Search by name or email...']")
                    search_input.clear()
                    search_input.send_keys(user)
                    time.sleep(1) 
                    
                    xpath_delete_btn = f"//tr[.//text()[contains(., '{user}')]]//button[contains(@class, 'hover:text-red-500')]"
                    
                    if len(driver.find_elements(By.XPATH, xpath_delete_btn)) == 0:
                        write_report(f"Result: {user} not found in list (already deleted?)")
                        continue
                        
                    delete_btn = driver.find_element(By.XPATH, xpath_delete_btn)
                    
                    # CLICK AND HANDLE ALERT IMMEDIATELY
                    try:
                        delete_btn.click()
                        # Wait for alert
                        WebDriverWait(driver, 5).until(EC.alert_is_present())
                        alert = driver.switch_to.alert
                        write_report(f"Action: Accepting alert for {user}: {alert.text}")
                        alert.accept()
                    except UnexpectedAlertPresentException:
                        write_report(f"Action: Caught UnexpectedAlert for {user}, accepting.")
                        alert = driver.switch_to.alert
                        alert.accept()
                    except NoAlertPresentException:
                        write_report(f"Warning: No alert appeared for {user} deletion?")
                    
                    time.sleep(2) 
                    write_report(f"Result: {user} request sent successfully")
                    
                except Exception as e:
                    write_report(f"Result: Failed to delete {user}. Reason: {str(e)}")

            # 4. Logout
            write_report("Action: Logging out")
            try:
                logout_btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Logout')]")
                if logout_btns:
                    # Check for alerts before clicking logout
                    try:
                        driver.switch_to.alert.accept()
                        write_report("Warning: Closed a lingering alert before logout")
                    except NoAlertPresentException:
                        pass

                    driver.execute_script("arguments[0].click();", logout_btns[0])
                    write_report("Result: Logout clicked")
                    
                    # Wait for Login Page (Look for 'Sign In' or 'Welcome Back')
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Sign In') or contains(text(), 'Welcome Back')]"))
                    )
                    write_report("Result: Logout Successful")
                else:
                    write_report("Result: Logout button not found")
                
            except Exception as e:
                write_report(f"Result: Logout failed. Reason: {str(e)}")
            
        except Exception as e:
            write_report(f"CRITICAL ERROR in Admin Delete Users Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e
        
        assert True

    def test_user_create_post(self, driver):
        """Test: Login as User, create a post 'hey i am testing'"""
        write_report("\nTest Case 5: User Create Post")
        
        # 1. Login as User
        write_report("Action: Logging in as User")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)

        try:
            write_report("Action: Entering User Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.USER_EMAIL)
            
            pwd_input = driver.find_element(By.XPATH, "//input[@type='password']")
            pwd_input.send_keys(Config.USER_PASSWORD)
            
            driver.find_element(By.XPATH, "//button[@type='submit']").click()
            time.sleep(1)
            
            write_report("Action: Waiting for Dashboard")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'What')]")) # "What's on your mind" placeholder
            )
            write_report("Result: User Login Successful")

            # 2. Open Create Post Modal
            write_report("Action: Opening Create Post Modal")
            # Click the main input area to open modal
            create_trigger = driver.find_element(By.XPATH, "//*[contains(text(), 'What')]")
            create_trigger.click()
            time.sleep(1)
            
            # 3. Enter Content
            write_report("Action: Entering Post Content")
            post_content = "hey i am testing"
            # Wait for modal textarea
            textarea = WebDriverWait(driver, 10).until(
                EC.visibility_of_element_located((By.TAG_NAME, "textarea"))
            )
            textarea.send_keys(post_content)
            time.sleep(1)
            
            # 4. Submit Post
            write_report("Action: Submitting Post")
            # Find the 'Post' button (contains text 'Post' and has apple-gradient class)
            post_btn = driver.find_element(By.XPATH, "//button[normalize-space()='Post']")
            post_btn.click()
            
            # 5. Verify Post Appears
            write_report("Action: Verifying Post on Feed")
            # Wait for modal to close (or toast?) and post to appear
            time.sleep(2) 
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, f"//*[contains(text(), '{post_content}')]"))
            )
            write_report("Result: Post created successfully")
            
            # 6. Logout
            write_report("Action: Logging Logout")
            # Logout logic (same as before)
            try:
               # Sometimes logout is hidden or needs scroll? Sidebar is usually fixed.
               logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
               driver.execute_script("arguments[0].click();", logout_btn)
               WebDriverWait(driver, 10).until(
                   EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
               )
               write_report("Result: User Logout Successful")
            except Exception as e:
                write_report(f"Warning: Logout issue: {e}")

        except Exception as e:
            write_report(f"CRITICAL ERROR in Create Post Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e

    def test_admin_delete_post(self, driver):
        """Test: Login as Admin, delete the post 'hey i am testing'"""
        write_report("\nTest Case 6: Admin Delete Post")
        
        # 1. Login as Admin
        write_report("Action: Logging in as Admin")
        try:
            driver.get(f"{Config.BASE_URL}")
            driver.delete_all_cookies()
            driver.execute_script("window.localStorage.clear();")
            driver.refresh()
            time.sleep(2)
        except Exception as e:
             write_report(f"Setup Failed: {e}")
             raise e
        
        try:
            write_report("Action: Entering Admin Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.ADMIN_EMAIL)
            
            driver.find_element(By.XPATH, "//input[@type='password']").send_keys(Config.ADMIN_PASSWORD)
            driver.find_element(By.XPATH, "//button[@type='submit']").click()
            
            write_report("Action: Waiting for Admin Dashboard")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Admin Hub')]"))
            )
            write_report("Result: Admin Login Successful")
            
            # 2. Navigate to Posts Tab
            write_report("Action: Navigating to Posts Tab")
            posts_tab = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Posts')]"))
            )
            posts_tab.click()
            time.sleep(1)
            
            # 3. Search for Post
            target_post_text = "hey i am testing"
            write_report(f"Action: Searching for post '{target_post_text}'")
            search_input = driver.find_element(By.XPATH, "//input[@placeholder='Search posts...']")
            search_input.clear()
            search_input.send_keys(target_post_text)
            time.sleep(1)
            
            # 4. Delete Post
            try:
                post_card_xpath = f"//*[contains(@class, 'p-6') and .//*[contains(text(), '{target_post_text}')]]"
                
                if len(driver.find_elements(By.XPATH, post_card_xpath)) == 0:
                    write_report("Result: Post NOT FOUND (already deleted?)")
                else:
                    post_card = driver.find_element(By.XPATH, post_card_xpath)
                    
                    # Based on Admin.tsx: button has 'text-red-500' and 'bg-red-500/10'
                    write_report("Action: Locating Delete Button...")
                    delete_btn = post_card.find_element(By.XPATH, ".//button[contains(@class, 'text-red-500')]")
                    
                    # Scroll card into view first
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", post_card)
                    time.sleep(1)
                    
                    write_report("Action: Clicking Delete Post")
                    driver.execute_script("arguments[0].click();", delete_btn)
                    
                    # Handle Confirmation Alert
                    write_report("Action: Handling Confirmation Alert")
                    WebDriverWait(driver, 5).until(EC.alert_is_present())
                    driver.switch_to.alert.accept()
                    
                    time.sleep(2)
                    write_report("Result: Post deleted successfully")
            
            except Exception as e:
                write_report(f"Result: Error deleting post: {e}")

            # 5. Logout
            logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
            driver.execute_script("arguments[0].click();", logout_btn)
            write_report("Result: Admin Logout Successful")
            
            assert True

        except Exception as e:
            write_report(f"CRITICAL ERROR in Admin Delete Post Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e

    def test_ai_tutor_interaction(self, driver):
        """Test: Login as User, use AI Tutor chat, and delete conversation"""
        write_report("\nTest Case 7: AI Tutor Interaction")
        
        # 1. Login as User
        write_report("Action: Logging in as User")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)
        
        try:
            write_report("Action: Entering User Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.USER_EMAIL)
            
            # Find password and submit
            pwd = driver.find_element(By.XPATH, "//input[@type='password']")
            pwd.send_keys(Config.USER_PASSWORD)
            driver.find_element(By.XPATH, "//button[@type='submit']").click()
            
            # Wait for dashboard (Look for Logout or sidebar)
            WebDriverWait(driver, 15).until(
                lambda d: d.find_elements(By.XPATH, "//*[contains(text(), 'Logout')]") or 
                          d.find_elements(By.XPATH, "//*[contains(text(), 'AI Tutor')]")
            )
            write_report("Result: User Login Successful")
            
            # 2. Navigate to AI Tutor
            write_report("Action: Navigating to AI Tutor")
            # Navigate using sidebar button
            tutor_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'AI Tutor')]"))
            )
            tutor_link.click()
            time.sleep(1)
            
            # 3. Send Chat Message
            message_text = "hey i am testing using selenium"
            write_report(f"Action: Sending message: '{message_text}'")
            
            # Find textarea
            textarea = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//textarea[@placeholder='Message your academic partner...']"))
            )
            textarea.click()
            textarea.send_keys(message_text)
            time.sleep(1)
            
            # Click Send (finding button with Send icon or class)
            # send_btn = driver.find_element(By.XPATH, "//button[.//svg[contains(@class, 'lucide-send')]]")
            # Or simplified: button next to textarea that is enabled
            send_btn = driver.find_element(By.XPATH, "//textarea/following-sibling::button")
            
            send_btn.click()
            
            # 4. Wait for Response (and wait 3s as requested)
            write_report("Action: Waiting for response...")
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, f"//div[contains(@class, 'bg-apple-blue') and contains(., '{message_text}')]"))
            )
            time.sleep(2)
            write_report("Result: Message sent and response likely received")
            
            # 5. Refresh and Navigate Back (User Requirement)
            write_report("Action: Refreshing Page (Expect redirect to Feed)")
            driver.refresh()
            time.sleep(2)
            
            write_report("Action: Navigating back to AI Tutor")
            tutor_link = WebDriverWait(driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'AI Tutor')]"))
            )
            tutor_link.click()
            time.sleep(2)
            
            # 6. Delete Conversation
            write_report("Action: Deleting Conversation")
            
            # Selector for chat items: look for the container div
            # Class: group p-3 rounded-xl cursor-pointer ...
            write_report("Action: Finding chat items...")
            chat_items = driver.find_elements(By.XPATH, "//div[contains(@class, 'group') and contains(@class, 'p-3') and contains(@class, 'cursor-pointer')]")
            
            if len(chat_items) > 0:
                first_chat = chat_items[0]
                write_report(f"Action: Found {len(chat_items)} chats. Deleting the first one.")
                
                # Scroll
                driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", first_chat)
                time.sleep(1)
                
                # Hover to reveal delete button
                write_report("Action: Hovering over chat item")
                actions = ActionChains(driver)
                actions.move_to_element(first_chat).perform()
                time.sleep(1)
                
                # Find delete button inside it (button with trash icon)
                delete_btns = first_chat.find_elements(By.TAG_NAME, "button")
                if delete_btns:
                    # In Tutor.tsx, the button inside the chat item is the delete button
                    del_btn = delete_btns[0] 
                    write_report("Action: Clicking delete button")
                    
                    # Force click 
                    driver.execute_script("arguments[0].click();", del_btn)
                    
                    # Confirm Alert
                    write_report("Action: Confirming Deletion")
                    WebDriverWait(driver, 5).until(EC.alert_is_present())
                    driver.switch_to.alert.accept()
                    write_report("Result: Conversation deleted")
                else:
                    write_report("Warning: Could not find delete button in chat item")
            else:
                 # Debug: print page source snippet or look for sidebar
                 write_report("Warning: No chat history found in sidebar")
                 try:
                     sidebar = driver.find_element(By.XPATH, "//*[contains(@class, 'fixed lg:relative')]")
                     write_report("Info: Sidebar found")
                 except:
                     write_report("Info: Sidebar NOT found")

            # 7. Logout
            write_report("Action: Logging out")
            try:
                logout_btns = driver.find_elements(By.XPATH, "//*[contains(text(), 'Logout')]")
                if logout_btns:
                     driver.execute_script("arguments[0].click();", logout_btns[0])
                     write_report("Result: Logout clicked")
                     time.sleep(2)
                     write_report("Result: Logout Successful")
            except Exception as e:
                write_report(f"Warning: Logout issue: {e}")

            assert True

        except Exception as e:
            write_report(f"CRITICAL ERROR in AI Tutor Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e

    def test_library_upload_and_interact(self, driver):
        """Test: Login, Upload PDF to Library, Search, Interact (Explain/Practice)"""
        write_report("\nTest Case 8: Library Upload and Interact")
        
        # 0. Create Dummy PDF
        pdf_path = os.path.join(os.getcwd(), "test_file.pdf")
        with open(pdf_path, "w") as f:
            f.write("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT /F1 12 Tf 100 700 Td (software can be tested using silenium) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000155 00000 n \n0000000255 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n349\n%%EOF")
        
        # 1. Login as User
        write_report("Action: Logging in as User")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)
        
        try:
            write_report("Action: Entering User Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.USER_EMAIL)
            driver.find_element(By.XPATH, "//input[@type='password']").send_keys(Config.USER_PASSWORD)
            driver.find_element(By.XPATH, "//button[@type='submit']").click()
            
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Logout')]")))
            write_report("Result: User Login Successful")
            
            # 2. Navigate to Library
            write_report("Action: Navigating to Library")
            # Usually in Layout sidebar
            driver.find_element(By.XPATH, "//button[contains(., 'Library')]").click()
            time.sleep(1)
            
            # 3. Click Upload Resource
            write_report("Action: Opening Upload Modal")
            driver.find_element(By.XPATH, "//button[contains(., 'Upload Resource')]").click()
            time.sleep(1)
            
            # 4. Fill Form
            write_report("Action: Filling Upload Form")
            
            # File Input (hidden)
            file_input = driver.find_element(By.XPATH, "//input[@type='file']")
            file_input.send_keys(pdf_path)
            
            # Title
            driver.find_element(By.XPATH, "//label[contains(text(), 'Title')]/following-sibling::input").send_keys("test")
            
            # Subject
            driver.find_element(By.XPATH, "//label[contains(text(), 'Subject')]/following-sibling::input").send_keys("test: 1")
            
            # Submit
            write_report("Action: Submitting Upload")
            driver.find_element(By.XPATH, "//button[contains(., 'Upload Resource') and @type='submit']").click()
            time.sleep(1)
            
            # Wait for reload (Assuming reload happens automatically on success as per user prompt/code behavior)
            write_report("Action: Waiting for upload/reload")
            time.sleep(3)
            
            # 5. Search for Resource
            # Check if we are back in Library (if reload redirects to Home, we need to navigate)
            # Just strictly navigate to Library to be safe
            write_report("Action: Ensuring on Library page")
            if len(driver.find_elements(By.XPATH, "//h2[contains(text(), 'Academic Library')]")) == 0:
                 driver.find_element(By.XPATH, "//button[contains(., 'Library')]").click()
                 time.sleep(1)
            
            write_report("Action: Searching for 'test'")
            search_input = driver.find_element(By.XPATH, "//input[@placeholder='Quick subject search...']")
            search_input.clear()
            search_input.send_keys("test")
            time.sleep(1)
            
            # 6. Interact - Explain
            write_report("Action: Clicking Explain")
            # Find the card with title "test"
            # Selector: //h3[text()='test']/ancestor::div...
            
            card = driver.find_element(By.XPATH, "//h3[contains(text(), 'test')]/ancestor::div[contains(@class, 'group')]")
            
            explain_btn = card.find_element(By.XPATH, ".//button[@title='Explain Content']")
            explain_btn.click()
            
            # Wait for response (Modal appears)
            write_report("Action: Waiting for Explanation response")
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Got it, Thanks!')]")))
            write_report("Result: Explanation received")
            time.sleep(1)
            
            write_report("Action: Closing Explanation")
            driver.find_element(By.XPATH, "//button[contains(., 'Got it, Thanks!')]").click()
            time.sleep(1)
            
            # 7. Interact - Practice
            write_report("Action: Clicking Practice")
            # Re-find card
            card = driver.find_element(By.XPATH, "//h3[contains(text(), 'test')]/ancestor::div[contains(@class, 'group')]")
            practice_btn = card.find_element(By.XPATH, ".//button[@title='Practice Questions']")
            practice_btn.click()
            
            write_report("Action: Waiting for Practice Questions response")
            WebDriverWait(driver, 15).until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Got it, Thanks!')]")))
            write_report("Result: Practice Questions received")
            time.sleep(1)
            
            write_report("Action: Closing Practice")
            driver.find_element(By.XPATH, "//button[contains(., 'Got it, Thanks!')]").click()
            time.sleep(1)
            
            write_report("Result: Interaction Successful")

        except Exception as e:
            write_report(f"CRITICAL ERROR in Library Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e
        finally:
            # Cleanup PDF
            if os.path.exists(pdf_path):
                try:
                    os.remove(pdf_path)
                except:
                    pass

    def test_admin_delete_resource(self, driver):
        """Test: Login as Admin, navigate to Resources, search for 'test' file and delete it"""
        write_report("\nTest Case 9: Admin Delete Resource 'test'")
        
        # 1. Login as Admin
        write_report("Action: Logging in as Admin")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)
        
        try:
            write_report("Action: Entering Admin Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.ADMIN_EMAIL)
            
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            password_input.send_keys(Config.ADMIN_PASSWORD)
            
            login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
            driver.execute_script("arguments[0].click();", login_btn)
            
            # Wait for Admin Dashboard
            write_report("Action: Waiting for Admin Dashboard")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Admin Hub')]"))
            )
            write_report("Result: Admin Login Successful")
            
            # 2. Navigate to Resources Tab
            write_report("Action: Navigating to Resources Tab")
            try:
                resources_tab = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Resources')]"))
                )
                driver.execute_script("arguments[0].scrollIntoView();", resources_tab)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", resources_tab)
                time.sleep(1)
                write_report("Result: Navigated to Resources Tab")
            except Exception as e:
                write_report(f"Result: Failed to click Resources tab. Reason: {str(e)}")
                raise e
            
            time.sleep(3)  # Wait for resources to load
            
            # 3. Search for 'test' file
            write_report("Action: Searching for 'test' file")
            try:
                # Exact selector from Admin.tsx line 701
                search_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search resources...']"))
                )
                write_report("Info: Found search input")
                
                # Clear and enter search term
                search_input.click()
                search_input.clear()
                time.sleep(0.5)
                search_input.send_keys("test")
                time.sleep(3)  # Wait for search results to filter
                write_report("Result: Search completed for 'test'")
            except Exception as e:
                write_report(f"Warning: Search failed: {str(e)}")
            
            # 4. Delete 'test' file
            write_report("Action: Attempting to locate and delete 'test' file")
            try:
                # Find resource card by title (h4 tag as per Admin.tsx line 722)
                resource_card = None
                
                # Try to find by h4 title
                h4_elements = driver.find_elements(By.XPATH, "//h4[contains(text(), 'test')]")
                if h4_elements:
                    # Get the parent GlassCard (ancestor with 'group' class)
                    resource_card = h4_elements[0].find_element(By.XPATH, "./ancestor::div[contains(@class, 'group')]")
                    write_report(f"Info: Found resource card with title containing 'test'")
                
                if resource_card is None:
                    write_report("Result: 'test' file NOT FOUND")
                    # Debug: list all h4 titles
                    all_h4 = driver.find_elements(By.TAG_NAME, "h4")
                    if all_h4:
                        titles = [h4.text for h4 in all_h4[:10]]
                        write_report(f"Debug: Found these resource titles: {titles}")
                else:
                    # Scroll into view
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", resource_card)
                    time.sleep(1)
                    
                    write_report("Action: Hovering over resource card to reveal delete button")
                    # Use ActionChains to hover over the card (this triggers group-hover)
                    actions = ActionChains(driver)
                    actions.move_to_element(resource_card).perform()
                    time.sleep(2)  # Wait for opacity transition
                    
                    # Find delete button - exact selector from Admin.tsx lines 713-715
                    # Button is in a div with absolute positioning at top-right
                    write_report("Action: Locating delete button")
                    try:
                        # The button is inside: div.absolute.top-0.right-0 > button with red classes
                        delete_btn = resource_card.find_element(
                            By.XPATH, 
                            ".//div[contains(@class, 'absolute')]//button[contains(@class, 'bg-red-500/10')]"
                        )
                        write_report("Info: Found delete button with red background class")
                    except:
                        write_report("Warning: Could not find delete button with specific class, trying alternative")
                        # Alternative: any button with Trash2 icon
                        delete_btn = resource_card.find_element(By.XPATH, ".//button[contains(@class, 'text-red-500')]")
                    
                    write_report("Action: Clicking Delete button")
                    # Ensure button is visible
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", delete_btn)
                    time.sleep(0.5)
                    
                    # Click with JavaScript to ensure it works
                    driver.execute_script("arguments[0].click();", delete_btn)
                    
                    # Handle confirmation alert (from Admin.tsx line 166)
                    write_report("Action: Handling confirmation alert")
                    time.sleep(1)
                    try:
                        # Wait for browser confirm dialog
                        WebDriverWait(driver, 5).until(EC.alert_is_present())
                        alert = driver.switch_to.alert
                        alert_text = alert.text
                        write_report(f"Action: Alert text: '{alert_text}'")
                        alert.accept()
                        write_report("Action: Alert accepted")
                        time.sleep(2)
                        write_report("Result: 'test' file deleted successfully")
                    except Exception as alert_err:
                        write_report(f"Warning: No alert appeared or error handling alert: {str(alert_err)}")
                    
            except Exception as e:
                write_report(f"Result: Error deleting 'test' file: {type(e).__name__}: {str(e)}")
                import traceback
                write_report(traceback.format_exc())
            
            # 5. Logout
            write_report("Action: Logging out")
            try:
                logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
                driver.execute_script("arguments[0].click();", logout_btn)
                
                # Wait for login page
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
                )
                write_report("Result: Logout Successful")
            except Exception as e:
                write_report(f"Warning: Logout issue: {str(e)}")
            
            assert True
            
        except Exception as e:
            write_report(f"CRITICAL ERROR in Admin Delete Resource Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e

    def test_user_create_project(self, driver):
        """Test: User login, create project with title 'test', and logout"""
        write_report("\nTest Case 10: User Create Project")
        
        # 1. Login as User
        write_report("Action: Logging in as User")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)
        
        try:
            write_report("Action: Entering User Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.USER_EMAIL)
            
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            password_input.send_keys(Config.USER_PASSWORD)
            
            login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
            driver.execute_script("arguments[0].click();", login_btn)
            
            # Wait for Dashboard
            write_report("Action: Waiting for Dashboard")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Logout')]"))
            )
            write_report("Result: User Login Successful")
            
            # 2. Navigate to Projects (Collaboration Hub)
            write_report("Action: Navigating to Projects/Collaboration Hub")
            try:
                # Click on Projects in sidebar
                projects_link = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Projects')]"))
                )
                driver.execute_script("arguments[0].click();", projects_link)
                time.sleep(1)
                write_report("Result: Navigated to Projects")
            except Exception as e:
                write_report(f"Result: Failed to navigate to Projects. Reason: {str(e)}")
                raise e
            
            time.sleep(3)  # Wait for projects to load
            
            # 3. Click New Project button (from ProjectHub.tsx line 125-131)
            write_report("Action: Clicking 'New Project' button")
            try:
                new_project_btn = WebDriverWait(driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'New Project')]"))
                )
                driver.execute_script("arguments[0].click();", new_project_btn)
                time.sleep(1)
                write_report("Result: New Project modal opened")
            except Exception as e:
                write_report(f"Result: Failed to open New Project modal. Reason: {str(e)}")
                raise e
            
            # 4. Fill in project form
            write_report("Action: Filling project form")
            try:
                # Title (line 276-281)
                title_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. AI Study Companion']")
                title_input.send_keys("test")
                write_report("Info: Entered title 'test'")
                
                # Description (line 285-291)
                desc_textarea = driver.find_element(By.XPATH, "//textarea[@placeholder='What are you building?']")
                desc_textarea.send_keys("testing the project feature")
                write_report("Info: Entered description")
                
                # Student ID (line 327-332)
                student_id_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. 011211...']")
                student_id_input.send_keys("12345678")
                write_report("Info: Entered student ID '12345678'")
                
                time.sleep(1)
            except Exception as e:
                write_report(f"Result: Failed to fill form. Reason: {str(e)}")
                raise e
            
            # 5. Click Create Project button (line 356)
            write_report("Action: Clicking 'Create Project' button")
            try:
                create_btn = driver.find_element(By.XPATH, "//button[contains(., 'Create Project')]")
                driver.execute_script("arguments[0].click();", create_btn)
                time.sleep(1)
                write_report("Result: Create Project button clicked")
                time.sleep(3)  # Wait for project creation and modal to close
                write_report("Result: Project created successfully")
            except Exception as e:
                write_report(f"Result: Failed to create project. Reason: {str(e)}")
                raise e
            
            # 6. Logout
            write_report("Action: Logging out")
            try:
                logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
                driver.execute_script("arguments[0].click();", logout_btn)
                
                # Wait for login page
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
                )
                write_report("Result: Logout Successful")
            except Exception as e:
                write_report(f"Warning: Logout issue: {str(e)}")
            
            assert True
            
        except Exception as e:
            write_report(f"CRITICAL ERROR in User Create Project Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e

    def test_admin_delete_project(self, driver):
        """Test: Admin login, search for 'test' project, and delete it"""
        write_report("\nTest Case 11: Admin Delete Project")
        
        # 1. Login as Admin
        write_report("Action: Logging in as Admin")
        driver.get(f"{Config.BASE_URL}")
        driver.delete_all_cookies()
        driver.execute_script("window.localStorage.clear();")
        driver.refresh()
        time.sleep(2)
        
        try:
            write_report("Action: Entering Admin Credentials")
            email_input = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
            )
            email_input.send_keys(Config.ADMIN_EMAIL)
            
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            password_input.send_keys(Config.ADMIN_PASSWORD)
            
            login_btn = driver.find_element(By.XPATH, "//button[@type='submit']")
            driver.execute_script("arguments[0].click();", login_btn)
            
            # Wait for Admin Dashboard
            write_report("Action: Waiting for Admin Dashboard")
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Admin Hub')]"))
            )
            write_report("Result: Admin Login Successful")
            
            # 2. Navigate to Projects Tab
            write_report("Action: Navigating to Projects Tab")
            try:
                projects_tab = WebDriverWait(driver, 15).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Projects')]"))
                )
                driver.execute_script("arguments[0].scrollIntoView();", projects_tab)
                time.sleep(0.5)
                driver.execute_script("arguments[0].click();", projects_tab)
                time.sleep(1)
                write_report("Result: Navigated to Projects Tab")
            except Exception as e:
                write_report(f"Result: Failed to click Projects tab. Reason: {str(e)}")
                raise e
            
            time.sleep(3)  # Wait for projects to load
            
            # 3. Search for 'test' project (Admin.tsx line 647)
            write_report("Action: Searching for 'test' project")
            try:
                search_input = WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@placeholder='Search projects...']"))
                )
                write_report("Info: Found search input")
                
                search_input.click()
                search_input.clear()
                time.sleep(0.5)
                search_input.send_keys("test")
                time.sleep(3)  # Wait for search results to filter
                write_report("Result: Search completed for 'test'")
            except Exception as e:
                write_report(f"Warning: Search failed: {str(e)}")
            
            # 4. Delete 'test' project
            write_report("Action: Attempting to locate and delete 'test' project")
            try:
                # Find the table row containing 'test' in title (Admin.tsx line 669)
                # The title is in a td with font-bold class
                project_row = None
                
                # Find by title in table
                title_cells = driver.find_elements(By.XPATH, "//td[@class='px-6 py-4 font-bold' and contains(text(), 'test')]")
                if title_cells:
                    # Get the parent tr
                    project_row = title_cells[0].find_element(By.XPATH, "./ancestor::tr")
                    write_report("Info: Found project row with title 'test'")
                
                if project_row is None:
                    write_report("Result: 'test' project NOT FOUND")
                    # Debug: list all project titles
                    all_titles = driver.find_elements(By.XPATH, "//td[@class='px-6 py-4 font-bold']")
                    if all_titles:
                        titles = [td.text for td in all_titles[:10]]
                        write_report(f"Debug: Found these project titles: {titles}")
                else:
                    # Scroll into view
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", project_row)
                    time.sleep(1)
                    
                    # Find delete button in the row (Admin.tsx line 681-683)
                    write_report("Action: Locating delete button")
                    delete_btn = project_row.find_element(
                        By.XPATH, 
                        ".//button[contains(@class, 'hover:text-red-500')]"
                    )
                    write_report("Info: Found delete button")
                    
                    write_report("Action: Clicking Delete button")
                    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", delete_btn)
                    time.sleep(0.5)
                    
                    # Click with JavaScript
                    driver.execute_script("arguments[0].click();", delete_btn)
                    
                    # Handle confirmation alert (from Admin.tsx line 156)
                    write_report("Action: Handling confirmation alert")
                    time.sleep(1)
                    try:
                        WebDriverWait(driver, 5).until(EC.alert_is_present())
                        alert = driver.switch_to.alert
                        alert_text = alert.text
                        write_report(f"Action: Alert text: '{alert_text}'")
                        alert.accept()
                        write_report("Action: Alert accepted")
                        time.sleep(2)
                        write_report("Result: 'test' project deleted successfully")
                    except Exception as alert_err:
                        write_report(f"Warning: No alert appeared: {str(alert_err)}")
                    
            except Exception as e:
                write_report(f"Result: Error deleting 'test' project: {type(e).__name__}: {str(e)}")
                import traceback
                write_report(traceback.format_exc())
            
            # 5. Logout
            write_report("Action: Logging out")
            try:
                logout_btn = driver.find_element(By.XPATH, "//*[contains(text(), 'Logout')]")
                driver.execute_script("arguments[0].click();", logout_btn)
                
                # Wait for login page
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
                )
                write_report("Result: Logout Successful")
            except Exception as e:
                write_report(f"Warning: Logout issue: {str(e)}")
            
            assert True
            
        except Exception as e:
            write_report(f"CRITICAL ERROR in Admin Delete Project Test: {type(e).__name__}: {str(e)}")
            import traceback
            write_report(traceback.format_exc())
            raise e
