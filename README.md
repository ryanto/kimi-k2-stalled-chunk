# Kimi K2 instruct 0905 stalled chunk

When requesting a stream from Kimi K2 Instruct 0905 with tools the stream chunks usually stall. For example, in the middle of the stream there will be a delay from anywhere between 15 and 30 seconds between chunks. This makes it appear as if the stream is frozen or has crashed.

This repository contains a reproduction that requests a code sample from Kimi 5 times and then logs whenever any one of those 5 calls has more than 5 seconds between chunks.

Note: This usually happens when asking Kimi to generate code.

## Example

```text
$ pnpm tsx examples/together-tools-fetch-streaming.ts

Starting 5 streams
................................................................................
..........................[Run #0 stream stalled][Run #1 stream stalled]........
.....................................................[Run #2 stream stalled]....
.....................................[Run #3 stream stalled]....................
.....................................[Run #4 stream stalled]....................
................................................................................
................................................................................
.......................
All runners completed.
[Run #0] Total time: 5726.68 seconds
[Run #1] Total time: 6743.87 seconds
[Run #2] Total time: 11192.75 seconds
[Run #3] Total time: 15962.19 seconds
[Run #4] Total time: 20856.81 seconds
[Run #0] Max time between chunks: 18.51 seconds
[Run #1] Max time between chunks: 33.57 seconds
[Run #2] Max time between chunks: 15.00 seconds
[Run #3] Max time between chunks: 25.96 seconds
[Run #4] Max time between chunks: 22.44 seconds
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

| Command                                                | Description                                                              | Streams reasoning   |
| ------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------- |
| `pnpm tsx examples/together-tools-fetch-streaming.ts`  | Fetch a streaming response from Together AI with tools in the request    | ❌ Streaming stalls |
| `pnpm tsx examples/together-fetch-streaming.ts`        | Fetch a streaming response from Together AI without tools in the request | ✅ Streams smoothly |
| `pnpm tsx examples/fireworks-tools-fetch-streaming.ts` | Fetch a streaming response from Fireworks with tools in the request      | ✅ Streams smoothly |
| `pnpm tsx examples/fireworks-fetch-streaming.ts`       | Fetch a streaming response from Fireworks without tools in the request   | ✅ Streams smoothly |
