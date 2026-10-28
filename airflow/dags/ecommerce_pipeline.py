# airflow/dags/ecommerce_pipeline.py
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'your_name',
    'retries': 2,
    'retry_delay': timedelta(minutes=5)
}

with DAG(
    'ecommerce_pipeline',
    default_args=default_args,
    schedule_interval='@hourly',
    start_date=datetime(2024, 1, 1),
    catchup=False
) as dag:

    generate_data = PythonOperator(
        task_id='generate_transactions',
        python_callable=run_generator
    )

    process_stream = PythonOperator(
        task_id='process_with_spark',
        python_callable=run_spark_job
    )

    load_warehouse = PythonOperator(
        task_id='load_to_warehouse',
        python_callable=load_to_warehouse
    )

    run_dbt = BashOperator(
        task_id='run_dbt_models',
        bash_command='cd /dbt_project && dbt run && dbt test'
    )

    # Pipeline order
    generate_data >> process_stream >> load_warehouse >> run_dbt