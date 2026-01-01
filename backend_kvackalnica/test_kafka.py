from kafka import KafkaConsumer
import struct

consumer = KafkaConsumer(
    'kvackalnica.user_events',
    bootstrap_servers=['localhost:9092'],
    auto_offset_reset='earliest',
    consumer_timeout_ms=2000
)

for i, message in enumerate(consumer):
    if i >= 3:
        break
    value = message.value
    print(f"\nMessage {i}:")
    print(f"  Length: {len(value)}")
    print(f"  First 20 bytes (hex): {value[:20].hex()}")
    if len(value) > 0:
        magic_byte = value[0]
        print(f"  Magic byte: {hex(magic_byte)}")
        if len(value) > 4:
            schema_id = struct.unpack('>I', value[1:5])[0]
            print(f"  Schema ID: {schema_id}")
