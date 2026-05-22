# Chameleon

Chameleon is a highly optimized, memory-efficient, and fully type-safe Discord API framework for Node.js. 

It is designed to solve the performance and DX bottlenecks found in traditional Discord libraries, making it perfectly suited for large-scale bot deployments.

## What we do different

- **POJO Architecture:** We completely abandon heavy Object-Oriented patterns. All structures (Messages, Users, Guilds) are lightweight Plain Old JavaScript Objects (POJOs), eliminating Garbage Collector pauses and massive memory overhead.
- **Type-Safe Event System:** We use strict discriminated unions for all gateway events. Your IDE always knows exactly what data is available based on the event type, including cached `old` states for updates.
- **Fully Inferred Slash Commands:** No more nullable options and manual type casting. Slash command options are defined using helpers that instantly infer exact TypeScript types for your execution context.
- **Smart Caching:** Instead of infinite, memory-leaking Map structures, Chameleon uses an intelligent LRU (Least Recently Used) cache mechanism (`TongueStore`) that only keeps what is actively needed.
- **Zero-Boilerplate Commands:** Command registration and API deployment are handled in a single step, without the need for separate synchronization scripts or manual if/else subcommand routing.