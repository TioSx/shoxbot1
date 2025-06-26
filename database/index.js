const { Worker } = require("worker_threads");
const os = require("os");

/*
  Export a function that queues pending work.
 */

const queue = [];
exports.asyncQuery = (sql, type, ...parameters) => {
	return new Promise((resolve, reject) => {
		queue.push({
			resolve,
			reject,
			message: { sql, parameters, type },
		});
		drainQueue();
	});
};

/*
  Instruct workers to drain the queue.
 */

let workers = [];
function drainQueue() {
	for (const worker of workers) {
		worker.takeWork();
	}
}

/*
  Spawn workers that try to drain the queue.
 */

os.cpus().forEach(function spawn() {
	const worker = new Worker("./database/worker.js");

	let job = null; // Current item from the queue
	let error = null; // Error that caused the worker to crash

	function takeWork() {
		if (!job && queue.length) {
			// If there's a job in the queue, send it to the worker
			job = queue.shift();
			worker.postMessage(job.message);
		}
	}

	worker
		.on("online", () => {
			workers.push({ takeWork });
			takeWork();
		})
		.on("message", (result) => {
			job.resolve(result);
			job = null;
			takeWork(); // Check if there's more work to do
		})
		.on("error", (err) => {
			console.error(err);
			error = err;
		})
		.on("exit", (code) => {
			workers = workers.filter((w) => w.takeWork !== takeWork);
			if (job) {
				job.reject(error || new Error("worker died"));
			}
			if (code !== 0) {
				console.error(`worker exited with code ${code}`);
				spawn(); // Worker died, so spawn a new one
			}
		});
});
