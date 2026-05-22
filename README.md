# Chameleon

Chameleon is a highly optimized, memory-efficient, and fully type-safe Discord API framework for Node.js

It is designed to solve the performance and DX bottlenecks found in traditional Discord libraries, making it perfectly suited for large-scale bot deployments

## What we do different?

- Chameleon uses bitfields in order to store groups of binary fields
- we store all structs in POJOs instead of classes
- all gateway events are strict discriminated unions

## Bugs?

- yes, ton of 'em

## related structs

If possible, chameleon will attach the struct of related resources