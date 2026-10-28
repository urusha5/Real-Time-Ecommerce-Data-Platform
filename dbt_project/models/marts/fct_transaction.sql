-- models/marts/fct_transactions.sql
SELECT
    transaction_date,
    category,
    country,
    COUNT(*)                AS total_orders,
    SUM(total_amount)       AS total_revenue,
    AVG(total_amount)       AS avg_order_value
FROM {{ ref('stg_transactions') }}
GROUP BY 1, 2, 3