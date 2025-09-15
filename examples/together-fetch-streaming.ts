import "dotenv/config";

const payload = {
  model: "moonshotai/Kimi-K2-Instruct-0905",
  messages: [
    {
      role: "system",
      content: "you are an expert coder",
    },
    {
      role: "user",
      content: "write a javascript program that balances a binary tree",
    },
  ],
  temperature: 0.6,
  max_tokens: 10000,
  stream: true,
};

const runners = 5;

type Run = {
  id: number;
  startTime: number;
  maxTime: number;
  time: number;
  timer: NodeJS.Timeout | null;
};

async function main() {
  const runs = Array.from({ length: runners }).map(async (_runner, index) => {
    // delay each run by some offset so they don't all happen at the same time
    await new Promise((resolve) => setTimeout(resolve, 5000 * index));

    const response = await fetch(
      "https://api.together.ai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        },
        body: JSON.stringify(payload),
      },
    );

    const textDecoder = new TextDecoderStream();

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const readableStream = response.body.pipeThrough(textDecoder);

    const run: Run = {
      id: index,
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
        process.stdout.write(`[Run #${index} stream stalled]`);
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
  });

  console.log(`Starting ${runners} streams`);

  const results = await Promise.all(runs);

  console.log("\nAll runners completed.");

  for (let result of results) {
    console.log(
      `[Run #${result.id}] Total time:`,
      (result.startTime - result.time / 1000).toFixed(2),
      "seconds",
    );
  }

  for (let result of results) {
    console.log(
      `[Run #${result.id}] Max time between chunks:`,
      (result.maxTime / 1000).toFixed(2),
      "seconds",
    );
  }
}

main();
