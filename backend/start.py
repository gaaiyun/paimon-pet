"""Launcher for Open-LLM-VTuber backend with Paimon configuration."""
import subprocess
import sys
import os
import shutil


def main():
    open_llm_vtuber_dir = os.environ.get(
        "OPEN_LLM_VTUBER_DIR",
        os.path.join(os.path.expanduser("~"), "Open-LLM-VTuber"),
    )

    if not os.path.exists(open_llm_vtuber_dir):
        print(f"Error: Open-LLM-VTuber not found at {open_llm_vtuber_dir}")
        print("Set OPEN_LLM_VTUBER_DIR environment variable to its path.")
        sys.exit(1)

    # Copy Paimon-specific configuration into the backend directory
    conf_src = os.path.join(os.path.dirname(__file__), "conf.yaml")
    conf_dst = os.path.join(open_llm_vtuber_dir, "conf.yaml")
    if os.path.exists(conf_src):
        shutil.copy2(conf_src, conf_dst)
        print(f"Copied Paimon config to {conf_dst}")

    os.chdir(open_llm_vtuber_dir)
    subprocess.run(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "src.open_llm_vtuber.server:app",
            "--host",
            "0.0.0.0",
            "--port",
            "12393",
        ]
    )


if __name__ == "__main__":
    main()
