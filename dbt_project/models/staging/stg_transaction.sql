-- models/staging/stg_transactions.sql
SELECT
    transaction_id,
    customer_id,
    UPPER(category)         AS category,
    quantity,
    unit_price,
    total_amount,
    payment_method,
    UPPER(country)          AS country,
    DATE(created_at)        AS transaction_date,
    created_at
FROM {{ source('raw', 'raw_transactions') }}
WHERE total_amount > 0