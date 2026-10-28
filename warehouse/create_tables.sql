-- warehouse/create_tables.sql
CREATE TABLE raw_transactions (
    transaction_id    VARCHAR PRIMARY KEY,
    customer_id       VARCHAR,
    product_name      VARCHAR,
    category          VARCHAR,
    quantity          INTEGER,
    unit_price        NUMERIC(10,2),
    total_amount      NUMERIC(10,2),
    payment_method    VARCHAR,
    country           VARCHAR,
    created_at        TIMESTAMP
);