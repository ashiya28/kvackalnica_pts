const { Kafka } = require("kafkajs");
const { SchemaRegistry } = require("@kafkajs/confluent-schema-registry");
const fs = require("fs");
const path = require("path");

const kafka = new Kafka({
  clientId: "kvackalnica-backend-1",
  brokers: ["kafka-broker:29092"],
});

const registry = new SchemaRegistry({ host: "http://schema-registry:8081" });
const TOPIC = "user_events_by_day";

let schemaId = null;
let keySchemaId = null;
let producer = null;
let ready = false;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function initSchemaWithRetry() {
  const valueSubject = `${TOPIC}-value`;
  const keySubject = `${TOPIC}-key`;

  for (let attempt = 1; attempt <= 20; attempt++) {
    try {
      // Pokušaj učitati value schema, če ne obstaja jo registriraj
      try {
        schemaId = await registry.getLatestSchemaId(valueSubject);
        console.log(`[kafka] loaded value schema (${valueSubject}), id =`, schemaId);
      } catch (err) {
        if (err.message.includes("not found")) {
          console.log(`[kafka] registering value schema (${valueSubject})...`);
          const valueSchemaPath = path.join(__dirname, "..", "schemas", "user_event.avsc");
          const valueSchemaJson = JSON.parse(fs.readFileSync(valueSchemaPath, "utf-8"));
          const result = await registry.register({
            type: "AVRO",
            schema: JSON.stringify(valueSchemaJson)
          }, { subject: valueSubject });
          schemaId = result.id || result;
          console.log(`[kafka] registered value schema, id =`, schemaId);
        } else {
          throw err;
        }
      }
      
      // Pokušaj učitati key schema, če ne obstaja jo registriraj
      try {
        keySchemaId = await registry.getLatestSchemaId(keySubject);
        console.log(`[kafka] loaded key schema (${keySubject}), id =`, keySchemaId);
      } catch (err) {
        if (err.message.includes("not found")) {
          console.log(`[kafka] registering key schema (${keySubject})...`);
          const keySchema = {
            type: "record",
            name: "UserEventKey",
            namespace: "kvackalnica",
            fields: [
              { name: "day", type: "string" },
              { name: "event_time", type: "long" },
              { name: "event_id", type: "string" }
            ]
          };
          const result = await registry.register({
            type: "AVRO",
            schema: JSON.stringify(keySchema)
          }, { subject: keySubject });
          keySchemaId = result.id || result;
          console.log(`[kafka] registered key schema, id =`, keySchemaId);
        } else {
          throw err;
        }
      }
      
      return;
    } catch (err) {
      console.error(`[kafka] schema init (attempt ${attempt}/20): ${err.message}`);
      await sleep(1000);
    }
  }

  throw new Error("[kafka] schema init failed after retries");
}

async function start() {
  try {
    producer = kafka.producer();
    await producer.connect();
    await initSchemaWithRetry();
    ready = true;
    console.log("[kafka] producer ready, schemaId =", schemaId);
  } catch (err) {
    // Ne pusti, da ubije server - Kafka je optional
    ready = false;
    console.error("[kafka] start failed, continuing without kafka:", err.message);
  }
}

function isReady() {
  return ready;
}

async function emitUserEvent(evt) {
  if (!ready || !schemaId || !keySchemaId || !producer) {
    console.warn("[kafka] emit skipped (not ready)");
    return;
  }

  try {
    // Kodiraj key kao Avro struct sa PK poljima
    const keyObj = {
      day: evt.day,
      event_time: evt.event_time,
      event_id: evt.event_id
    };
    const key = await registry.encode(keySchemaId, keyObj);

    // Kodiraj value kao Avro
    const value = await registry.encode(schemaId, evt);

    await producer.send({
      topic: TOPIC,
      messages: [{ key, value }],
    });

    console.log(`[kafka] emitted event (id=${evt.event_id}, activity=${evt.activity_type})`);
  } catch (err) {
    console.error("[kafka] emit failed:", err.message);
  }
}

// Alias za app.js kompatibilnost
async function emitTestEvent(evt) {
  return emitUserEvent(evt);
}

module.exports = { start, emitUserEvent, emitTestEvent, isReady };
