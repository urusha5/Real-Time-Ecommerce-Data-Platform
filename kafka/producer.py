# kafka/producer.py
from kafka import KafkaProducer
import json, time
from data_generator.generator import generate_transaction, enrich_transaction

producer = KafkaProducer(
    bootstrap_servers='localhost:9092',
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

while True:
    transaction = enrich_transaction(generate_transaction())
    producer.send('ecommerce-transactions', value=transaction)
    print(f"Sent: {transaction['transaction_id']}")
    time.sleep(0.5)  # Send every 0.5 seconds