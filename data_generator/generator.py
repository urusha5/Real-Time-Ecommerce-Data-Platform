# data_generator/generator.py
# Generates fake e-commerce transactions AND
# sends each one to Kafka in real time.

from faker import Faker
import json
import random
import time
import os
from datetime import datetime
from kafka import KafkaProducer
from dotenv import load_dotenv

load_dotenv()

fake = Faker()

CATEGORIES     = ["Electronics","Fashion","Food","Sports","Beauty","Books","Home"]
PAYMENT_METHODS = ["card","bank_transfer","cash","mobile_money"]
KAFKA_SERVER   = os.getenv("KAFKA_BOOTSTRAP_SERVERS","localhost:9092")
KAFKA_TOPIC    = os.getenv("KAFKA_TOPIC","ecommerce-transactions")

def generate_transaction():
    quantity   = random.randint(1, 10)
    unit_price = round(random.uniform(5.0, 500.0), 2)
    return {
        "transaction_id":  fake.uuid4(),
        "customer_id":     fake.uuid4(),
        "customer_name":   fake.name(),
        "customer_email":  fake.email(),
        "product_id":      random.randint(1000, 9999),
        "product_name":    fake.word().capitalize() + " " +
                           random.choice(["Pro","Plus","Max","Lite"]),
        "category":        random.choice(CATEGORIES),
        "quantity":        quantity,
        "unit_price":      unit_price,
        "total_amount":    round(quantity * unit_price, 2),
        "payment_method":  random.choice(PAYMENT_METHODS),
        "city":            fake.city(),
        "country":         fake.country(),
        "timestamp":       datetime.utcnow().isoformat()
    }

def main():
    print("=" * 60)
    print("  Real-Time E-commerce Data Platform | Transaction Generator")
    print(f"  Kafka: {KAFKA_SERVER} | Topic: {KAFKA_TOPIC}")
    print("  Press Ctrl+C to stop")
    print("=" * 60)

    # Connect to Kafka
    print("\n  Connecting to Kafka producer...")
    try:
        producer = KafkaProducer(
            bootstrap_servers=KAFKA_SERVER,
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )
        print("  Kafka producer connected.\n")
    except Exception as e:
        print(f"  Could not connect to Kafka: {e}")
        print("  Make sure Docker is running and Kafka is up.")
        return

    count = 0
    while True:
        transaction = generate_transaction()
        count += 1

        # SEND to Kafka
        producer.send(KAFKA_TOPIC, value=transaction)
        producer.flush()

        # PRINT confirmation
        print(f"  Sent #{count}: {transaction['customer_name']}"
              f" | {transaction['category']}"
              f" | ${transaction['total_amount']}")

        time.sleep(0.5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Generator stopped.")
