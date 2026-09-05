module.exports = {
  apps: [
    {
      name: "job-portal-api",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "worker-email",
      script: "workers/emailWorker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "worker-application",
      script: "workers/applicationWorker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "worker-interview",
      script: "workers/interviewWorker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "worker-saved-search",
      script: "workers/savedSearchWorker.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "scheduler-saved-search",
      script: "workers/savedSearchScheduler.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
