#!/usr/bin/env python3
"""Starts Uvicorn HTTPS server with generated certificates on port 8443, host 0.0.0.0."""

import os
import sys
import socket
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

def get_primary_lan_ip():
    """Detects primary LAN IP address."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def run():
    certs_dir = ROOT_DIR / "certs"
    cert_path = certs_dir / "cert.pem"
    key_path = certs_dir / "key.pem"

    if not cert_path.exists() or not key_path.exists():
        print(f"[run_server] Certificates not found in {certs_dir}. Running make_cert.py...")
        from scripts.make_cert import generate_certificates
        generate_certificates(output_dir=str(certs_dir))

    lan_ip = get_primary_lan_ip()
    port = 8443

    print("=" * 65)
    print("RippleMesh Secure HTTPS Server Starting")
    print("=" * 65)
    print(f"Detected Laptop LAN IP : {lan_ip}")
    print()
    print("Exact Access URLs:")
    print(f"  Laptop (Local) : https://localhost:{port}/")
    print(f"  Phone (Wi-Fi)  : https://{lan_ip}:{port}/")
    print(f"  Citizen Portal : https://{lan_ip}:{port}/citizen/")
    print(f"  Control Room   : https://{lan_ip}:{port}/coordinator/")
    print("=" * 65)
    print("NOTE: On phone/browser, accept the self-signed certificate warning:")
    print("      Tap 'Advanced' -> 'Proceed to ... (unsafe)' to grant camera & GPS access.")
    print("=" * 65)

    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        ssl_certfile=str(cert_path),
        ssl_keyfile=str(key_path),
        reload=False
    )

if __name__ == "__main__":
    run()
