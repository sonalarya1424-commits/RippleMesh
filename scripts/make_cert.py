#!/usr/bin/env python3
"""Generates self-signed SSL/TLS certificate and key valid for localhost and current LAN IPs."""

import os
import socket
import datetime
import ipaddress
from pathlib import Path

from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

def get_lan_ips():
    """Discovers all non-loopback IPv4 addresses of this machine."""
    ips = set()
    try:
        # Standard UDP socket connect trick to find outgoing default interface
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ":" not in ip and not ip.startswith("127."):
                ips.add(ip)
    except Exception:
        pass

    return list(ips)

def generate_certificates(output_dir="certs"):
    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    cert_file = out_path / "cert.pem"
    key_file = out_path / "key.pem"

    lan_ips = get_lan_ips()
    print(f"[make_cert] Detected local LAN IP(s): {lan_ips}")

    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )

    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
        x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Karnataka"),
        x509.NameAttribute(NameOID.LOCALITY_NAME, "Belagavi"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "RippleMesh"),
        x509.NameAttribute(NameOID.COMMON_NAME, "RippleMesh Local"),
    ])

    # Subject Alternative Names (SANs)
    san_entries = [
        x509.DNSName("localhost"),
        x509.IPAddress(ipaddress.IPv4Address("127.0.0.1")),
    ]

    for ip_str in lan_ips:
        try:
            san_entries.append(x509.IPAddress(ipaddress.IPv4Address(ip_str)))
        except ValueError:
            pass

    now = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - datetime.timedelta(days=1))
        .not_valid_after(now + datetime.timedelta(days=365))  # Valid for 1 year
        .add_extension(
            x509.SubjectAlternativeName(san_entries),
            critical=False,
        )
        .sign(private_key, hashes.SHA256())
    )

    # Write private key
    with open(key_file, "wb") as f:
        f.write(
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )

    # Write certificate
    with open(cert_file, "wb") as f:
        f.write(cert.public_bytes(serialization.Encoding.PEM))

    print(f"[make_cert] Certificate successfully generated at: {cert_file.resolve()}")
    print(f"[make_cert] Private key successfully generated at: {key_file.resolve()}")
    print(f"[make_cert] Valid for: localhost, 127.0.0.1, {', '.join(lan_ips)}")

if __name__ == "__main__":
    generate_certificates()
