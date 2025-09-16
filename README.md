# Stalled chunk on many models when streaming w/ tools

When requesting a stream from a lot of our models (including Kimi K2 Instruct 0905, Qwen/Qwen3-235B-A22B-Thinking-2507, OSS GPT 120B, ect...) with tools the stream chunks usually stall. For example, in the middle of the stream there will be a delay from anywhere between 5 and 60 seconds between chunks. This makes it appear as if the stream is frozen or has crashed.

_This SPECIFICALLY happens when requesting code from a model._

This repository contains a reproduction that requests a code sample from all our models that support function calling and then logs whenever any one of those 5 calls has more than 5 seconds between chunks.

## Example

You can see Kimi K2 Instruct 0905 stall in the middle of the stream for 29 seconds for example.

```text
$ pnpm tsx examples/together-tools-fetch-streaming.ts

Starting tests for 9 models

[1/9] Testing model: moonshotai/Kimi-K2-Instruct
............................................[moonshotai/Kimi-K2-Instruct stream stalled].........................................
[moonshotai/Kimi-K2-Instruct] Total time: 37.53 seconds
[moonshotai/Kimi-K2-Instruct] Max time between chunks: 29.81 seconds
```

## Setup

Create a `.env` file in the root directory with the following variables:

```env
# .env
TOGETHER_API_KEY=
FIREWORKS_API_KEY=
```

Install dependencies:

```text
pnpm install
```

## Usage

Run each of the following scripts to see the tool call output from the services:

| Command                                                    | Description                                                              | Streams reasoning   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------- |
| `pnpm tsx examples/together-tools-fetch-bad-streaming.ts`  | Fetch a streaming response from Together AI with tools in the request    | ❌ Streaming stalls |
| `pnpm tsx examples/together-tools-fetch-good-streaming.ts` | Fetch a streaming response from Together AI without tools in the request | ✅ Streams smoothly |
| `pnpm tsx examples/fireworks-tools-fetch-streaming.ts`     | Fetch a streaming response from Fireworks with tools in the request      | ✅ Streams smoothly |
