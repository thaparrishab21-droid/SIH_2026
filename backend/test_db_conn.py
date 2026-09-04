import pymysql

passwords = ['', 'root', '1234', '123456', 'password', 'mysql', 'admin', 'Root@123', 'root123', 'password123', '12345678']
found = False

for p in passwords:
    try:
        conn = pymysql.connect(host='localhost', user='root', password=p, port=3306)
        print(f"SUCCESS: Connected to MySQL with password: '{p}'")
        found = True
        conn.close()
        break
    except Exception as e:
        print(f"Password '{p}' failed: {e}")

if not found:
    print("Could not connect with standard test passwords.")
