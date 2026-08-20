#!/usr/bin/env python3
"""Write a Strides-style app icon (blue square, white ring, three rising bars)."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

SIZE = 1024
BLUE = (0, 122, 255, 255)
WHITE = (255, 255, 255, 255)
TRANSPARENT = (0, 0, 0, 0)


def png(pixels: list[list[tuple[int, int, int, int]]]) -> bytes:
    height = len(pixels)
    width = len(pixels[0])
    raw = b"".join(b"\x00" + bytes(c for px in row for c in px) for row in pixels)

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    header = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def dist(x: float, y: float, cx: float, cy: float) -> float:
    return math.hypot(x - cx, y - cy)


def rounded_rect(x: float, y: float, cx: float, cy: float, w: float, h: float, r: float) -> bool:
    dx = abs(x - cx) - (w / 2 - r)
    dy = abs(y - cy) - (h / 2 - r)
    if dx <= 0 and abs(y - cy) <= h / 2:
        return True
    if dy <= 0 and abs(x - cx) <= w / 2:
        return True
    if dx > 0 and dy > 0:
        return dx * dx + dy * dy <= r * r
    return False


def main() -> None:
    cx = cy = SIZE / 2
    radius = SIZE * 0.32
    stroke = SIZE * 0.038
    pixels: list[list[tuple[int, int, int, int]]] = []
    bars = [
        (cx - SIZE * 0.11, cy + SIZE * 0.04, SIZE * 0.07, SIZE * 0.18),
        (cx, cy - SIZE * 0.02, SIZE * 0.07, SIZE * 0.30),
        (cx + SIZE * 0.11, cy - SIZE * 0.07, SIZE * 0.07, SIZE * 0.40),
    ]
    for y in range(SIZE):
        row = []
        for x in range(SIZE):
            d = dist(x + 0.5, y + 0.5, cx, cy)
            color = BLUE
            if abs(d - radius) <= stroke / 2:
                color = WHITE
            for bx, by, bw, bh in bars:
                if rounded_rect(x + 0.5, y + 0.5, bx, by, bw, bh, bw / 2):
                    color = WHITE
                    break
            row.append(color)
        pixels.append(row)

    out = Path("build/icon.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png(pixels))
    public = Path("public/icon.png")
    public.parent.mkdir(parents=True, exist_ok=True)
    public.write_bytes(out.read_bytes())
    print(f"wrote {out} and {public}")


if __name__ == "__main__":
    main()
