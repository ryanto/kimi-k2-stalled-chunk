import "dotenv/config";

const models = [
  "moonshotai/Kimi-K2-Instruct",
  "moonshotai/Kimi-K2-Instruct-0905",
  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
  "meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "zai-org/GLM-4.5-Air-FP8",
  "openai/gpt-oss-120b",
  "Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8",
  "deepseek-ai/DeepSeek-V3",
  "Qwen/Qwen3-235B-A22B-fp8-tput",
  // "openai/gpt-oss-20b",
  // "deepseek-ai/DeepSeek-R1",
  // "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
  // "meta-llama/Llama-4-Scout-17B-16E-Instruct",
  // "Qwen/Qwen3-235B-A22B-Thinking-2507",
  // "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
  // "meta-llama/Llama-3.2-3B-Instruct-Turbo",
  // "Qwen/Qwen2.5-7B-Instruct-Turbo",
  // "Qwen/Qwen2.5-72B-Instruct-Turbo",
  // "mistralai/Mistral-Small-24B-Instruct-2501",
  // "arcee-ai/virtuoso-medium-v2",
  // "arcee-ai/caller",
  // "arcee-ai/virtuoso-large",
];

const goodPrompt = "write me a recipe for a chocolate cake";

const createPayload = (model: string) => ({
  model,
  messages: [
    {
      role: "system",
      content: "you are an expert coder",
    },
    {
      role: "user",
      content: goodPrompt,
    },
  ],
  tools: [
    {
      type: "function",
      function: {
        name: "getWeather",
        description:
          "Get the current weather in a given location, including the unit of temperature ('celsius' or 'fahrenheit').",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description:
                "The location to get weather for. Include city and state if in the US (e.g. 'Austin, TX'), or city and country for international locations (e.g. 'Paris, France'). This field is required.",
            },
            unit: {
              type: "string",
              description:
                "The unit of temperature to return. The user will not provide this, so you need to pick a default that matches the location's unit.",
              enum: ["celsius", "fahrenheit"],
            },
          },
        },
      },
    },
  ],
  temperature: 0.6,
  max_tokens: 10000,
  stream: true,
});

type Run = {
  id: number;
  model: string;
  startTime: number;
  maxTime: number;
  time: number;
  timer: NodeJS.Timeout | null;
};

async function testModel(model: string, modelIndex: number): Promise<Run> {
  console.log(`\n[${modelIndex + 1}/${models.length}] Testing model: ${model}`);

  const payload = createPayload(model);

  const response = await fetch("https://api.together.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const textDecoder = new TextDecoderStream();

  if (!response.ok) {
    throw new Error(
      `HTTP error! status: ${response.status} for model ${model}`,
    );
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const readableStream = response.body.pipeThrough(textDecoder);

  const run: Run = {
    id: modelIndex,
    model,
    startTime: performance.now(),
    time: performance.now(),
    maxTime: -1,
    timer: null,
  };

  for await (const chunk of readableStream) {
    if (run.timer) {
      clearTimeout(run.timer);
    }

    run.timer = setTimeout(() => {
      process.stdout.write(`[${model} stream stalled]`);
    }, 5000);

    process.stdout.write(".");
    const chunkTime = performance.now();
    const chunkDistance = chunkTime - run.time;
    run.maxTime = Math.max(run.maxTime, chunkDistance);
    run.time = performance.now();
  }

  if (run.timer) {
    clearTimeout(run.timer);
  }

  return run;
}

async function main() {
  console.log(`Starting tests for ${models.length} models`);

  const results: Run[] = [];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    try {
      const result = await testModel(model, i);
      results.push(result);

      console.log(
        `\n[${model}] Total time: ${((result.time - result.startTime) / 1000).toFixed(2)} seconds`,
      );
      console.log(
        `[${model}] Max time between chunks: ${(result.maxTime / 1000).toFixed(2)} seconds`,
      );
    } catch (error) {
      console.error(`\n[${model}] Error:`, error);
    }

    // Add a small delay between models to avoid rate limiting
    if (i < models.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log("\n=== SUMMARY ===");
  console.log(
    `Completed ${results.length}/${models.length} models successfully`,
  );

  for (let result of results) {
    console.log(
      `[${result.model}] Total: ${((result.time - result.startTime) / 1000).toFixed(2)}s, Max chunk delay: ${(result.maxTime / 1000).toFixed(2)}s`,
    );
  }
}

main();
