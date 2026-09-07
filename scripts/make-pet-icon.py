#!/usr/bin/env python3
"""Write a coral egg icon for the Pocket Pet desktop app."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

SIZE = 1024
CORAL = (217, 93, 88, 255)
CORAL_HI = (240, 122, 112, 255)
OUTLINE = (59, 36, 53, 255)
WHITE = (255, 255, 255, 255)
LCD = (184, 200, 135, 255)
PIXEL = (36, 51, 41, 255)


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


def egg(x: float, y: float, cx: float, cy: float, rx: float, ry: float) -> bool:
    nx = (x - cx) / rx
    ny = (y - cy) / ry
    return nx * nx + ny * ny <= 1


def main() -> None:
    cx = cy = SIZE / 2
    pixels: list[list[tuple[int, int, int, int]]] = []
    for y in range(SIZE):
        row = []
        for x in range(SIZE):
            px, py = x + 0.5, y + 0.5
            color = CORAL
            if egg(px, py, cx, cy + SIZE * 0.02, SIZE * 0.28, SIZE * 0.36):
                color = WHITE if dist(px, py, cx - SIZE * 0.08, cy - SIZE * 0.08) < SIZE * 0.07 else CORAL_HI
                if egg(px, py, cx, cy + SIZE * 0.04, SIZE * 0.16, SIZE * 0.12):
                    color = LCD
                eye_l = dist(px, py, cx - SIZE * 0.045, cy + SIZE * 0.02)
                eye_r = dist(px, py, cx + SIZE * 0.045, cy + SIZE * 0.02)
                if eye_l < SIZE * 0.018 or eye_r < SIZE * 0.018:
                    color = PIXEL
            elif not egg(px, py, cx, cy + SIZE * 0.02, SIZE * 0.31, SIZE * 0.39):
                color = CORAL
            else:
                color = OUTLINE
            row.append(color)
        pixels.append(row)

    out = Path("build/pet-icon.png")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(png(pixels))
    print(f"wrote {out}")


if __name__ == "__main__":
    main()
