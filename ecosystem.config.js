module.exports = {
  apps: [
    {
      name: "rakshak",
      cwd: "./backend",
      script: "venv/bin/uvicorn",
      args: "main:app --host 0.0.0.0 --port 8000",
      interpreter: "none",
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 10000,
      max_restarts: 10,
      restart_delay: 2000,
    },
  ],
};
