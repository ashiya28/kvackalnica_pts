const app = require("./app");
const { start } = require("./kafka/producer");

const PORT = process.env.PORT || 5000;

start(); // inicijalizira Kafka producer in schema registry

app.listen(PORT, () => {
  console.log(`Strežnik teče na portu ${PORT}`);
});
