# kafka/consumer.py
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'ecommerce-transactions',
    bootstrap_servers='localhost:9092',
    value_deserializer=lambda v: json.loads(v.decode('utf-8'))
)

for message in consumer:
    transaction = message.value
    print(f"Received: {transaction['transaction_id']}")
    # Pass to Spark for processing