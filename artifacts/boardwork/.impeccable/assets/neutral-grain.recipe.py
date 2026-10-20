"""Deterministic, monochrome paper grain for the far workspace background.

This is a procedural material, with no copied photograph or generated imagery.
Render at 192 CSS pixels per tile and 4.5% opacity behind opaque UI surfaces.
"""
from pathlib import Path
import random
from PIL import Image, PngImagePlugin

SEED = 2601020
SIZE = 256
DESCRIPTION = (
    "Original procedural neutral paper grain. A 256 by 256 pixel grayscale tile "
    "of independent Gaussian samples, mean 128, standard deviation 32, clamped "
    "to 0–255. Python random.Random seed 2601020; opaque L-mode PNG. No color "
    "gradient, shapes, pattern, light falloff, lettering or UI. Used only on the "
    "far workspace background at 4.5% opacity, never on cards or controls."
)

def build():
    root = Path(__file__).resolve().parents[2]
    output = root / "public/images/workspace/neutral-grain.png"
    output.parent.mkdir(parents=True, exist_ok=True)
    rng = random.Random(SEED)
    pixels = bytes(max(0, min(255, round(rng.gauss(128, 32)))) for _ in range(SIZE * SIZE))
    image = Image.frombytes("L", (SIZE, SIZE), pixels)
    info = PngImagePlugin.PngInfo()
    info.add_text("Description", DESCRIPTION)
    info.add_text("Software", "Boardwork procedural texture recipe, seed 2601020")
    image.save(output, pnginfo=info, optimize=True)
    prompt = Path(__file__).with_name("neutral-grain.prompt.txt")
    prompt.write_text(DESCRIPTION + "\n")
    print(f"{output}: {output.stat().st_size} bytes")

if __name__ == "__main__":
    build()
