import psycopg
from faker import Faker
import random
from datetime import datetime, timedelta

DB_NAME = "mcp"
USER = "postgres"
PASSWORD = "root"
HOST = "localhost"
PORT = "5432"

CONNINFO = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/postgres"
TARGET_DB = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}"

def create_database():
    with psycopg.connect(CONNINFO, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{DB_NAME}'")
            if not cur.fetchone():
                cur.execute(f"CREATE DATABASE {DB_NAME}")
                print(f"Database '{DB_NAME}' created.")
            else:
                print(f"Database '{DB_NAME}' already exists.")

def setup_tables_and_data():
    fake = Faker()
    with psycopg.connect(TARGET_DB, autocommit=True) as conn:
        with conn.cursor() as cur:
            # Drop if they exist
            cur.execute("DROP TABLE IF EXISTS orders, customers, products CASCADE")

            # Create tables
            cur.execute("""
                CREATE TABLE customers (
                    id SERIAL PRIMARY KEY,
                    name TEXT,
                    email TEXT
                );
                CREATE TABLE products (
                    id SERIAL PRIMARY KEY,
                    name TEXT,
                    price DECIMAL
                );
                CREATE TABLE orders (
                    id SERIAL PRIMARY KEY,
                    customer_id INTEGER REFERENCES customers(id),
                    product_id INTEGER REFERENCES products(id),
                    quantity INTEGER,
                    created_at TIMESTAMP
                );
            """)

            # Insert fake customers
            for _ in range(10):
                cur.execute(
                    "INSERT INTO customers (name, email) VALUES (%s, %s)",
                    (fake.name(), fake.email())
                )

            # Insert fake products
            for _ in range(5):
                cur.execute(
                    "INSERT INTO products (name, price) VALUES (%s, %s)",
                    (fake.word().capitalize(), round(random.uniform(10, 100), 2))
                )

            # Insert fake orders
            for _ in range(50):
                cur.execute(
                    "INSERT INTO orders (customer_id, product_id, quantity, created_at) VALUES (%s, %s, %s, %s)",
                    (
                        random.randint(1, 10),
                        random.randint(1, 5),
                        random.randint(1, 10),
                        fake.date_time_between(start_date="-3M", end_date="now")
                    )
                )

    print("Tables created and data inserted.")

if __name__ == "__main__":
    create_database()
    setup_tables_and_data()
