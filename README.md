# Chameleon

Chameleon is a highly optimized, memory-efficient, and fully type-safe Discord API framework for Node.js

It is designed to solve the performance and DX bottlenecks found in traditional Discord libraries, making it perfectly suited for large-scale bot deployments

## What we do different?

- We completely abandon heavy Object-Oriented patterns. All structures (Messages, Users, Guilds) are lightweight Plain Old JavaScript Objects (POJOs), eliminating Garbage Collector pauses and massive memory overhead.

- We use strict discriminated unions for all gateway events. Your IDE always knows exactly what data is available based on the event type, including cached `old` states for updates.

- No more nullable options and manual type casting. Slash command options are defined using helpers that instantly infer exact TypeScript types for your execution context.

- Instead of infinite, memory-leaking Map structures, Chameleon uses an intelligent LRU (Least Recently Used) cache mechanism (`TongueStore`) that only keeps what is actively needed.

- Command registration and API deployment are handled in a single step, without the need for separate synchronization scripts or manual if/else subcommand routing.