import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), "obsidian", ".queue.json");

export class Queue {
  constructor() {
    this.jobs = [];
    this.handlers = {};
    this.load();
  }

  // Load jobs from file
  load() {
    try {
      if (fs.existsSync(QUEUE_FILE)) {
        const content = fs.readFileSync(QUEUE_FILE, "utf-8");
        this.jobs = JSON.parse(content);
      } else {
        this.jobs = [];
      }
    } catch (err) {
      console.error("⚠️ Failed to load queue database, resetting in-memory queue:", err);
      this.jobs = [];
    }
  }

  // Save jobs to file
  save() {
    try {
      // Ensure the obsidian directory exists
      const dir = path.dirname(QUEUE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(QUEUE_FILE, JSON.stringify(this.jobs, null, 2), "utf-8");
    } catch (err) {
      console.error("🔴 Failed to save queue state to file:", err);
    }
  }

  // Register a handler for a topic
  registerHandler(topic, handlerFn) {
    this.handlers[topic] = handlerFn;
  }

  // Add a new job
  addJob(topic, payload, maxAttempts = 3) {
    // Prevent duplicate pending/processing jobs for the same topic and payload signature (like filePath)
    const exists = this.jobs.find(
      (j) =>
        j.topic === topic &&
        j.payload.filePath === payload.filePath &&
        (j.status === "pending" || j.status === "processing")
    );

    if (exists) {
      return exists;
    }

    const job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      topic,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts,
      runAt: new Date().toISOString(),
      errors: [],
    };

    this.jobs.push(job);
    this.save();
    console.log(`📥 Job queued successfully: [${topic}] for ${path.basename(payload.filePath)}`);
    return job;
  }

  // Run the queue worker
  async runWorker() {
    const now = new Date();
    // Filter jobs that are pending and ready to run
    const pendingJobs = this.jobs.filter(
      (j) => j.status === "pending" && new Date(j.runAt) <= now
    );

    if (pendingJobs.length === 0) {
      return;
    }

    console.log(`🚀 Queue Worker starting. Processing ${pendingJobs.length} job(s)...`);

    for (const job of pendingJobs) {
      job.status = "processing";
      this.save();

      const handler = this.handlers[job.topic];

      if (!handler) {
        const errMsg = `No handler registered for topic "${job.topic}"`;
        console.error(`🔴 ${errMsg}`);
        job.status = "failed";
        job.errors.push({ timestamp: new Date().toISOString(), message: errMsg });
        this.save();
        continue;
      }

      job.attempts++;
      console.log(`⏳ [Attempt ${job.attempts}/${job.maxAttempts}] Running [${job.topic}] for ${path.basename(job.payload.filePath)}`);

      try {
        await handler(job.payload);
        job.status = "completed";
        console.log(`✅ Job completed successfully: [${job.topic}]`);
      } catch (err) {
        const errorMsg = err.message || String(err);
        console.error(`❌ Job failed: ${errorMsg}`);
        job.errors.push({ timestamp: new Date().toISOString(), message: errorMsg });

        if (job.attempts < job.maxAttempts) {
          // Exponential backoff: retry in 2^attempts * 2 seconds (e.g. 4s, 8s, 16s)
          const backoffSec = Math.pow(2, job.attempts) * 2;
          const retryTime = new Date(Date.now() + backoffSec * 1000);
          job.status = "pending";
          job.runAt = retryTime.toISOString();
          console.log(`🔄 Scheduled retry in ${backoffSec}s at ${retryTime.toLocaleTimeString()}`);
        } else {
          job.status = "failed";
          console.error(`🔴 Job permanently failed after ${job.maxAttempts} attempts.`);
        }
      }

      this.save();
    }

    console.log("🏁 Queue Worker execution cycle finished.");
  }
}
