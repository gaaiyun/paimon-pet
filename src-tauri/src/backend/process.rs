use std::process::Command;

/// Check if the Python backend is running by querying its `/health` endpoint.
///
/// Returns `Ok(true)` if the backend responds with HTTP 200,
/// `Ok(false)` if the connection is refused or times out,
/// or an error if the request cannot be constructed.
pub fn is_backend_running(port: u16) -> anyhow::Result<bool> {
    let url = format!("http://127.0.0.1:{}/health", port);
    let client = reqwest::blocking::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()?;

    match client.get(&url).send() {
        Ok(response) => Ok(response.status().is_success()),
        Err(_) => Ok(false),
    }
}

/// Start the Python backend process.
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
