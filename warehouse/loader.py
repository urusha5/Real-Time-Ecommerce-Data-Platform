# warehouse/loader.py
import psycopg2, pandas as pd

def load_to_warehouse(parquet_path):
    df = pd.read_parquet(parquet_path)
    conn = psycopg2.connect("your_connection_string")
    df.to_sql('raw_transactions', conn, if_exists='append', index=False)