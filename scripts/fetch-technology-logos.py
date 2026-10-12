"""Fetch original artwork from its publisher; no third-party icon package."""
import gzip
import hashlib
import io
import json
import re
import urllib.request
import zipfile
from pathlib import Path

ASSETS = {
    'go': ('https://go.dev/blog/go-brand/Go-Logo/SVG/Go-Logo_Aqua.svg', None),
    'python': ('https://s3.dualstack.us-east-2.amazonaws.com/pythondotorg-assets/media/files/python-logo-only.svg', None),
    'kafka': ('https://raw.githubusercontent.com/apache/kafka-site/asf-site/43/images/kafka-logo-readme-dark.svg', None),
    'redis': ('https://redis.io/', 'inline SVG, viewBox="0 0 85 27"'),
    'kubernetes': ('https://raw.githubusercontent.com/cncf/artwork/main/projects/kubernetes/icon/color/kubernetes-icon-color.svg', None),
    'docker': ('https://www.docker.com/static/Docker-Logos-1.zip', 'docker-logos/SVG/docker-mark-ocean-blue.svg'),
    'prometheus': ('https://raw.githubusercontent.com/cncf/artwork/main/projects/prometheus/icon/color/prometheus-icon-color.svg', None),
    'grafana': ('https://raw.githubusercontent.com/grafana/grafana/main/public/img/grafana_icon.svg', None),
    'cloudrun': ('https://services.google.com/fh/files/misc/core-products-icons.zip', 'Unique Icons/Cloud Run/SVG/CloudRun-512-color-rgb.svg'),
}

def record(destination):
    sources = []
    for name, (url, member) in ASSETS.items():
        data = (destination / f'{name}.svg').read_bytes()
        sources.append(dict(id=name, source=url, archive_member=member, sha256=hashlib.sha256(data).hexdigest()))
    (destination / 'SOURCES.json').write_text(json.dumps(sources, indent=2) + '\n')

if __name__ == '__main__':
    import sys
    destination = Path('public/logos')
    destination.mkdir(parents=True, exist_ok=True)
    if '--record-only' not in sys.argv:
        for name, (url, member) in ASSETS.items():
            request = urllib.request.Request(url, headers={'User-Agent': 'PortfolioAssetFetch/1.0'})
            with urllib.request.urlopen(request, timeout=40) as response:
                data = response.read()
            if data[:2] == b'\x1f\x8b':
                data = gzip.decompress(data)
            if name == 'redis':
                choices = re.findall(r'<svg\b.*?</svg>', data.decode(), re.S)
                data = next(svg for svg in choices if 'viewBox="0 0 85 27"' in svg and '#FF4438' in svg).encode()
            elif member:
                data = zipfile.ZipFile(io.BytesIO(data)).read(member)
            if b'<svg' not in data:
                raise ValueError(f'{name}: source did not contain SVG artwork')
            (destination / f'{name}.svg').write_bytes(data)
            print(name, len(data))
    record(destination)
