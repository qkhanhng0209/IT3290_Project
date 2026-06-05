import pyodbc

conn = pyodbc.connect(
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=QuanLyThuVien;"
    "Trusted_Connection=yes;"
)

cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM DocGia")

result = cursor.fetchone()

print("So doc gia: ", result[0])

conn.close()