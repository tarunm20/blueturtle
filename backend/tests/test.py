import httpx
import json
import time

# ANSI color codes
class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Endpoints
generate_sql_url = "http://127.0.0.1:8000/generate_sql"
execute_sql_url = "http://127.0.0.1:8000/execute_sql"
db_url = "postgresql://postgres:root@localhost/mcp"

# Load prompts from JSON file
with open("prompts.json", "r") as f:
    prompts = json.load(f).get("prompts", [])

# Stats
passed = 0
failed = 0
MAX_RETRIES = 3

for i, prompt in enumerate(prompts, 1):
    print("=" * 60)
    print(f"{bcolors.BOLD}[TEST {i}]{bcolors.ENDC} Prompt: {prompt}")

    success = False
    attempt = 0

    while attempt < MAX_RETRIES and not success:
        attempt += 1
        print(f"\n{bcolors.OKBLUE}[INFO]{bcolors.ENDC} Attempt {attempt} to generate and execute SQL...")

        # Step 1: Generate SQL
        try:
            generate_payload = {
                "user_prompt": prompt,
                "db_url": db_url
            }

            generate_response = httpx.post(generate_sql_url, json=generate_payload)
            print(f"{bcolors.OKCYAN}[DEBUG]{bcolors.ENDC} /generate_sql status:", generate_response.status_code)
            print(f"{bcolors.OKCYAN}[DEBUG]{bcolors.ENDC} /generate_sql response:", generate_response.text)

            sql = generate_response.json().get("sql")

            if not sql:
                print(f"{bcolors.FAIL}[ERROR]{bcolors.ENDC} No 'sql' key in /generate_sql response!")
                continue

            print(f"{bcolors.OKCYAN}[DEBUG]{bcolors.ENDC} Extracted SQL:", sql)

        except Exception as e:
            print(f"{bcolors.FAIL}[ERROR]{bcolors.ENDC} Failed during SQL generation:", e)
            continue

        # Step 2: Execute SQL
        try:
            execute_payload = {
                "sql": sql,
                "db_url": db_url
            }

            execute_response = httpx.post(execute_sql_url, json=execute_payload)
            print(f"{bcolors.OKCYAN}[DEBUG]{bcolors.ENDC} /execute_sql status:", execute_response.status_code)
            print(f"{bcolors.OKCYAN}[DEBUG]{bcolors.ENDC} /execute_sql response:", execute_response.text)

            if execute_response.status_code == 200:
                result = execute_response.json()
                print(f"{bcolors.OKGREEN}[RESULT]{bcolors.ENDC} Columns:", result.get("columns"))
                print(f"{bcolors.OKGREEN}[RESULT]{bcolors.ENDC} Rows:", result.get("rows"))
                success = True
                break
            else:
                print(f"{bcolors.FAIL}[ERROR]{bcolors.ENDC} SQL execution failed with status code:", execute_response.status_code)

        except Exception as e:
            print(f"{bcolors.FAIL}[ERROR]{bcolors.ENDC} Failed during SQL execution:", e)

        # Optional: wait before retrying
        time.sleep(1)

    if success:
        passed += 1
        print(f"{bcolors.OKGREEN}[SUCCESS]{bcolors.ENDC} Test passed.")
    else:
        failed += 1
        print(f"{bcolors.FAIL}[FAILURE]{bcolors.ENDC} Test failed after 3 attempts.")

    print("=" * 60 + "\n")

# Final summary
print(f"\n{bcolors.BOLD}🧪 TESTING COMPLETE{bcolors.ENDC}")
print(f"{bcolors.OKGREEN}✅ Passed: {passed}{bcolors.ENDC}")
print(f"{bcolors.FAIL}❌ Failed: {failed}{bcolors.ENDC}")
print(f"{bcolors.OKBLUE}📊 Total:  {len(prompts)}{bcolors.ENDC}")
