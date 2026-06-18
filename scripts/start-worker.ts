import "./load-env";
import { startWorker } from "@/lib/queue/worker";

startWorker();
console.log("[SponsorshipIQ] Background worker running. Press Ctrl+C to stop.");
