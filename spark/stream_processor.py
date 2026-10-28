# spark/stream_processor.py
# Lightweight stream processor — replaces PySpark for local development
#
# What this does:
# - Reads transactions from Kafka one by one
# - Cleans and validates each one
# - Saves clean records to PostgreSQL database
# - Does this continuously until you stop it
#
# Same logic as Spark — just lighter for your laptop

import json
import time
import os
from datetime import datetime
from kafka import KafkaConsumer
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

# ─────────────────────────────────────────
# SETTINGS — from your .env file
# ─────────────────────────────────────────
DB_HOST     = os.getenv("POSTGRES_HOST",        "localhost")
DB_PORT     = os.getenv("POSTGRES_PORT",         "5432")
DB_NAME     = os.getenv("POSTGRES_DB",           "ecommerce_db")
DB_USER     = os.getenv("POSTGRES_USER",         "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
KAFKA_SERVER = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC  = os.getenv("KAFKA_TOPIC",          "ecommerce-transactions")

# How many records to collect before saving to database in one go
BATCH_SIZE = 10


# ─────────────────────────────────────────
# DATABASE CONNECTION
# ─────────────────────────────────────────
def connect_to_database():
    """
    Opens a connection to PostgreSQL.
    Like opening a filing cabinet so we can put records inside.
    """
    if not DB_PASSWORD:
        print("  Set POSTGRES_PASSWORD in your environment before starting the processor.")
        return None
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print("  Connected to PostgreSQL database.")
        return conn
    except Exception as e:
        print(f"  Could not connect to database: {e}")
        print("  Make sure Docker is running and PostgreSQL is up.")
        return None


def create_table_if_not_exists(conn):
    """
    Creates the raw_transactions table in PostgreSQL if it does not exist yet.
    Like setting up the filing cabinet shelves before putting files in.
    """
    sql = """
    CREATE TABLE IF NOT EXISTS raw_transactions (
        id               SERIAL PRIMARY KEY,
        transaction_id   VARCHAR(100) UNIQUE,
        customer_id      VARCHAR(100),
        customer_name    VARCHAR(200),
        customer_email   VARCHAR(200),
        product_id       INTEGER,
        product_name     VARCHAR(200),
        category         VARCHAR(100),
        quantity         INTEGER,
        unit_price       NUMERIC(10, 2),
        total_amount     NUMERIC(10, 2),
        payment_method   VARCHAR(50),
        city             VARCHAR(100),
        country          VARCHAR(100),
        created_at       TIMESTAMP
    );
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        conn.commit()
    print("  Table raw_transactions is ready.")


# ─────────────────────────────────────────
# DATA CLEANING
# ─────────────────────────────────────────
def clean_transaction(raw):
    """
    Takes one raw transaction and cleans it.
    Returns the clean version, or None if the record is invalid.

    Cleaning rules:
    - transaction_id must exist
    - total_amount must be greater than zero
    - category and country are uppercased
    - timestamp is converted to a proper datetime
    """
    # Rule 1: must have a transaction ID
    if not raw.get("transaction_id"):
        return None

    # Rule 2: total amount must be positive
    try:
        total = float(raw.get("total_amount", 0))
        if total <= 0:
            return None
    except (ValueError, TypeError):
        return None

    # Rule 3: quantity must be a positive integer
    try:
        quantity = int(raw.get("quantity", 0))
        if quantity <= 0:
            return None
    except (ValueError, TypeError):
        return None

    # Parse timestamp — use current time if missing
    try:
        created_at = datetime.fromisoformat(raw.get("timestamp", ""))
    except (ValueError, TypeError):
        created_at = datetime.utcnow()

    return {
        "transaction_id":  str(raw["transaction_id"]),
        "customer_id":     str(raw.get("customer_id", "")),
        "customer_name":   str(raw.get("customer_name", "Unknown")),
        "customer_email":  str(raw.get("customer_email", "")),
        "product_id":      int(raw.get("product_id", 0)),
        "product_name":    str(raw.get("product_name", "Unknown")),
        "category":        str(raw.get("category", "")).upper(),
        "quantity":        quantity,
        "unit_price":      float(raw.get("unit_price", 0)),
        "total_amount":    total,
        "payment_method":  str(raw.get("payment_method", "")),
        "city":            str(raw.get("city", "")),
        "country":         str(raw.get("country", "")).upper(),
        "created_at":      created_at,
    }


# ─────────────────────────────────────────
# SAVE TO DATABASE
# ─────────────────────────────────────────
def save_batch_to_db(conn, batch):
    """
    Saves a list of clean transactions to PostgreSQL all at once.
    Batch saving is faster than saving one by one.
    If a transaction_id already exists it skips it (no duplicates).
    """
    if not batch:
        return 0

    sql = """
    INSERT INTO raw_transactions (
        transaction_id, customer_id, customer_name, customer_email,
        product_id, product_name, category, quantity,
        unit_price, total_amount, payment_method,
        city, country, created_at
    ) VALUES (
        %(transaction_id)s, %(customer_id)s, %(customer_name)s, %(customer_email)s,
        %(product_id)s, %(product_name)s, %(category)s, %(quantity)s,
        %(unit_price)s, %(total_amount)s, %(payment_method)s,
        %(city)s, %(country)s, %(created_at)s
    )
    ON CONFLICT (transaction_id) DO NOTHING;
    """
    try:
        with conn.cursor() as cur:
            psycopg2.extras.execute_batch(cur, sql, batch)
            conn.commit()
        return len(batch)
    except Exception as e:
        conn.rollback()
        print(f"  Save failed: {e}")
        return 0


# ─────────────────────────────────────────
# MAIN PROCESSOR
# ─────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Lightweight Stream Processor Started")
    print(f"  Kafka: {KAFKA_SERVER} | Topic: {KAFKA_TOPIC}")
    print(f"  Database: {DB_NAME} on {DB_HOST}:{DB_PORT}")
    print(f"  Batch size: {BATCH_SIZE} records")
    print("  Press Ctrl+C to stop")
    print("=" * 60)

    # Connect to database
    conn = connect_to_database()
    if not conn:
        print("Exiting — cannot connect to database.")
        return

    # Create table if needed
    create_table_if_not_exists(conn)

    # Connect to Kafka
    print(f"\n  Connecting to Kafka...")
    try:
        consumer = KafkaConsumer(
            KAFKA_TOPIC,
            bootstrap_servers=KAFKA_SERVER,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="latest",
            group_id="ecommerce-processor",
            consumer_timeout_ms=1000  # wait 1 second for messages before looping
        )
        print(f"  Connected to Kafka. Listening for transactions...\n")
    except Exception as e:
        print(f"  Could not connect to Kafka: {e}")
        print("  Make sure Docker is running and Kafka is up.")
        return

    # Counters for display
    total_processed = 0
    total_saved     = 0
    total_invalid   = 0
    batch_number    = 0
    pending_batch   = []

    try:
        while True:
            # Collect messages from Kafka
            for message in consumer:
                raw = message.value
                clean = clean_transaction(raw)

                if clean:
                    pending_batch.append(clean)
                else:
                    total_invalid += 1

                total_processed += 1

                # When batch is full, save to database
                if len(pending_batch) >= BATCH_SIZE:
                    batch_number += 1
                    saved = save_batch_to_db(conn, pending_batch)
                    total_saved += saved

                    print(f"  Batch #{batch_number} saved:"
                          f"  {saved} records to DB "
                          f"| Total saved: {total_saved} "
                          f"| Invalid skipped: {total_invalid}")

                    pending_batch = []  # reset batch

            # Save any remaining records that did not fill a full batch
            if pending_batch:
                batch_number += 1
                saved = save_batch_to_db(conn, pending_batch)
                total_saved += saved
                print(f"  Batch #{batch_number} saved:"
                      f"  {saved} records to DB "
                      f"| Total saved: {total_saved} "
                      f"| Invalid skipped: {total_invalid}")
                pending_batch = []

    except KeyboardInterrupt:
        # Save any last remaining records before stopping
        if pending_batch:
            save_batch_to_db(conn, pending_batch)

        print(f"\n\n  Processor stopped.")
        print(f"  Total processed : {total_processed}")
        print(f"  Total saved     : {total_saved}")
        print(f"  Total invalid   : {total_invalid}")

    finally:
        consumer.close()
        conn.close()
        print("  Connections closed cleanly.")


if __name__ == "__main__":
    main()
