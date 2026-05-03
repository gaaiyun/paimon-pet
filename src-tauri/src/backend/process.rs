use std::process::{Child, Command};

/// HTTP health-check timeout (seconds).
const HEALTH_CHECK_TIMEOUT_SECS: u64 = 2;

/// OpenClaw gateway port.
const OPENCLAW_PORT: u16 = 18789;
/// VITS server port.
const VITS_PORT: u16 = 8020;
/// Open-LLM-VTuber server port.
const VTUBER_PORT: u16 = 12393;

/// Manages the lifecycle of backend child processes.
///
/// `ServiceManager` tracks running VITS and VTuber processes and provides
/// helpers to check whether external services (including OpenClaw) are alive.
pub struct ServiceManager {
    vits_process: Option<Child>,
    vtuber_process: Option<Child>,
}

impl ServiceManager {
    /// Create a new `ServiceManager` with no running processes.
    pub fn new() -> Self {
        Self {
            vits_process: None,
            vtuber_process: None,
        }
    }

    /// Check whether a service is reachable by sending a GET request to
    /// `http://localhost:{port}/health` with a short timeout.
    pub fn is_service_running(port: u16) -> bool {
        let url = format!("http://127.0.0.1:{}/health", port);
        let client = reqwest::blocking::Client::builder()
            .timeout(std::time::Duration::from_secs(HEALTH_CHECK_TIMEOUT_SECS))
            .build();

        match client {
            Ok(c) => match c.get(&url).send() {
                Ok(resp) => resp.status().is_success(),
                Err(_) => false,
            },
            Err(_) => false,
        }
    }

    /// Check whether the OpenClaw gateway is running.
    pub fn check_openclaw(&self) -> bool {
        Self::is_service_running(OPENCLAW_PORT)
    }

    /// Check whether the VITS server is running.
    pub fn check_vits(&self) -> bool {
        Self::is_service_running(VITS_PORT)
    }

    /// Check whether the Open-LLM-VTuber server is running.
    pub fn check_vtuber(&self) -> bool {
        Self::is_service_running(VTUBER_PORT)
    }

    /// Start the VITS server as a child process.
    ///
    /// Runs `python src/vits_server/server.py` with the working directory
    /// set to `ai_paimon_dir`. Returns the child PID on success.
    pub fn start_vits(&mut self, python_path: &str, ai_paimon_dir: &str) -> Result<u32, String> {
        let child = Command::new(python_path)
            .arg("src/vits_server/server.py")
            .current_dir(ai_paimon_dir)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to start VITS server: {}", e))?;

        let pid = child.id();
        self.vits_process = Some(child);
        Ok(pid)
    }

    /// Start the Open-LLM-VTuber server as a child process.
    ///
    /// Runs `uv run run_server.py` with the working directory set to
    /// `open_llm_vtuber_dir`. Returns the child PID on success.
    pub fn start_vtuber(&mut self, open_llm_vtuber_dir: &str) -> Result<u32, String> {
        let child = Command::new("uv")
            .arg("run")
            .arg("run_server.py")
            .current_dir(open_llm_vtuber_dir)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .map_err(|e| format!("Failed to start VTuber server: {}", e))?;

        let pid = child.id();
        self.vtuber_process = Some(child);
        Ok(pid)
    }

    /// Start all backend services in the correct dependency order.
    ///
    /// 1. Checks whether OpenClaw is running (returns error if not).
    /// 2. Starts VITS if it is not already running, then waits 3 seconds.
    /// 3. Starts VTuber if it is not already running, then waits 5 seconds.
    ///
    /// Returns a human-readable status summary on success.
    pub fn start_all(
        &mut self,
        python_path: &str,
        ai_paimon_dir: &str,
        vtuber_dir: &str,
    ) -> Result<String, String> {
        // Step 1: OpenClaw must be running already.
        if !self.check_openclaw() {
            return Err(
                "OpenClaw gateway is not running on port 18789. Please start it first.".to_string(),
            );
        }

        // Step 2: Start VITS if not running.
        let vits_status = if self.check_vits() {
            "already running".to_string()
        } else {
            let pid = self.start_vits(python_path, ai_paimon_dir)?;
            // Give VITS a few seconds to initialise.
            std::thread::sleep(std::time::Duration::from_secs(3));
            format!("started (PID {})", pid)
        };

        // Step 3: Start VTuber if not running.
        let vtuber_status = if self.check_vtuber() {
            "already running".to_string()
        } else {
            let pid = self.start_vtuber(vtuber_dir)?;
            // VTuber typically takes longer to warm up.
            std::thread::sleep(std::time::Duration::from_secs(5));
            format!("started (PID {})", pid)
        };

        Ok(format!(
            "All services ready.\n  OpenClaw: running\n  VITS: {}\n  VTuber: {}",
            vits_status, vtuber_status,
        ))
    }

    /// Stop all managed child processes gracefully.
    pub fn stop_all(&mut self) {
        if let Some(ref mut child) = self.vits_process {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.vits_process = None;

        if let Some(ref mut child) = self.vtuber_process {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.vtuber_process = None;
    }
}

impl Drop for ServiceManager {
    fn drop(&mut self) {
        self.stop_all();
    }
}

// ---------------------------------------------------------------------------
// Backward-compatible free functions (kept so existing call-sites compile).
// ---------------------------------------------------------------------------

/// Check if a backend service is running by querying its `/health` endpoint.
///
/// Returns `Ok(true)` if the backend responds with HTTP 200,
/// `Ok(false)` if the connection is refused or times out,
/// or an error if the request cannot be constructed.
pub fn is_backend_running(port: u16) -> anyhow::Result<bool> {
    Ok(ServiceManager::is_service_running(port))
}

/// Start a Python backend process.
///
/// Spawns the given Python script as a detached child process.
/// Returns the child process ID on success.
pub fn start_backend_process(python_path: &str, script_path: &str) -> anyhow::Result<u32> {
    let child = Command::new(python_path)
        .arg(script_path)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .spawn()?;

    Ok(child.id())
}
