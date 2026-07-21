import sqlite3
conn = sqlite3.connect('database/app.sqlite')
print(conn.execute('SELECT module, print_start_column, print_end_column FROM excel_templates').fetchall())
