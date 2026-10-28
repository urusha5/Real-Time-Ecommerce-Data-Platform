import { Kafka, logLevel } from 'kafkajs';
import { readConfig, secret } from './config.mjs';
import { PostgresRepository } from './repositories/postgres.mjs';
import { normalizeTransaction } from './validation.mjs';
import { HttpError } from './security.mjs';
const log = (event, fields = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), event, ...fields }));
const config = readConfig();
if (config.mode !== 'postgres') throw new Error('The Kafka worker requires DATA_MODE=postgres.');
const brokers = (process.env.KAFKA_BROKERS || '').split(',').map(v => v.trim()).filter(Boolean);
if (!brokers.length) throw new Error('KAFKA_BROKERS is required.');
if (config.production && process.env.KAFKA_SSL !== 'true') throw new Error('Production Kafka connections require KAFKA_SSL=true.');
const mechanism = process.env.KAFKA_SASL_MECHANISM;
if (mechanism && !['plain', 'scram-sha-256', 'scram-sha-512'].includes(mechanism)) throw new Error('Unsupported Kafka SASL mechanism.');
const saslPassword = secret(process.env, 'KAFKA_SASL_PASSWORD');
if (mechanism && (!process.env.KAFKA_SASL_USERNAME || !saslPassword)) throw new Error('Kafka SASL credentials are required.');
const kafka = new Kafka({ clientId: 'commerce-ingestion', brokers, ssl: process.env.KAFKA_SSL === 'true', ...(mechanism ? { sasl: { mechanism, username: process.env.KAFKA_SASL_USERNAME, password: saslPassword } } : {}), logLevel: logLevel.NOTHING, connectionTimeout: 10000, requestTimeout: 30000 });
const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID || 'commerce-platform-v1', allowAutoTopicCreation: false, maxBytesPerPartition: 1048576 });
const repository = new PostgresRepository(config.database, { listen: false, log });
await repository.init();
await consumer.connect();
await consumer.subscribe({ topics: [process.env.KAFKA_TOPIC || 'ecommerce-transactions'], fromBeginning: false });
await consumer.run({ partitionsConsumedConcurrently: 2, eachMessage: async ({ topic, partition, message }) => {
  const payload = message.value?.toString('utf8') || '';
  try {
    if (payload.length > 131072) throw new HttpError(422, 'Message exceeds the transaction size limit.');
    let parsed;
    try { parsed = JSON.parse(payload); } catch { throw new HttpError(422, 'Message is not valid JSON.'); }
    await repository.ingest([normalizeTransaction(parsed)]);
  } catch (error) {
    if (!(error instanceof HttpError) || ![409, 422].includes(error.status)) throw error;
    // The offset is committed only after the invalid event is durably quarantined.
    await repository.deadLetter({ topic, partition, offset: message.offset, payload, reason: error.message });
    log('event_quarantined', { topic, partition, offset: message.offset, reason: error.message });
  }
} });
log('worker_started');
let stopping = false;
const stop = async () => { if (stopping) return; stopping = true; const deadline = setTimeout(() => process.exit(1), 25000); deadline.unref(); await consumer.disconnect(); await repository.close(); clearTimeout(deadline); };
process.on('SIGINT', stop); process.on('SIGTERM', stop);
