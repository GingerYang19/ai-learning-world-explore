#!/usr/bin/env python3
"""Generate high-quality Minecraft-style pixel art tool icons at 32x32, upscaled to 512x512."""
from PIL import Image, ImageDraw

OUT = "/Users/yakexi/Documents/mulerun/ai-learning-world/public/img"
SZ = 32
SCALE = 16  # 32x32 -> 512x512
O = (0, 0, 0, 0)

def save(name, img):
    img = img.resize((SZ * SCALE, SZ * SCALE), Image.NEAREST)
    img.save(f"{OUT}/{name}.png")
    print(f"  saved {name}.png")

def outline(img, color=(30, 25, 18, 255)):
    """Add 1px outline around all non-transparent pixels."""
    w, h = img.size
    result = img.copy()
    for y in range(h):
        for x in range(w):
            if img.getpixel((x, y))[3] == 0:
                for dx, dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,-1),(-1,1),(1,1)]:
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < w and 0 <= ny < h and img.getpixel((nx, ny))[3] > 0:
                        result.putpixel((x, y), color)
                        break
    return result

# ========== HAND (Steve's fist, first-person, from bottom-right) ==========
def gen_hand():
    img = Image.new("RGBA", (SZ, SZ), O)
    # Minecraft Steve skin colors
    skin   = (198, 148, 108, 255)
    skinH  = (220, 178, 140, 255)
    skinD  = (170, 118, 78, 255)
    skinDD = (145, 95, 58, 255)

    # Arm shape: chunky rectangular fist coming from bottom-right, angled
    rows = {
        8:  [(14,skinH),(15,skin),(16,skin),(17,skin),(18,skin),(19,skinD)],
        9:  [(13,skinH),(14,skinH),(15,skin),(16,skin),(17,skin),(18,skin),(19,skinD),(20,skinD)],
        10: [(12,skinH),(13,skinH),(14,skin),(15,skin),(16,skin),(17,skin),(18,skinD),(19,skinD),(20,skinDD)],
        11: [(12,skinH),(13,skin),(14,skin),(15,skin),(16,skin),(17,skin),(18,skinD),(19,skinD),(20,skinDD)],
        12: [(11,skinH),(12,skin),(13,skin),(14,skin),(15,skin),(16,skin),(17,skinD),(18,skinD),(19,skinDD)],
        13: [(11,skinH),(12,skin),(13,skin),(14,skin),(15,skin),(16,skin),(17,skinD),(18,skinDD)],
        14: [(12,skinH),(13,skin),(14,skin),(15,skin),(16,skinD),(17,skinD),(18,skinDD)],
        15: [(13,skinH),(14,skin),(15,skin),(16,skinD),(17,skinDD)],
        16: [(14,skin),(15,skinD),(16,skinDD)],
        # Knuckle detail
        17: [(15,skinDD),(16,skinDD)],
        # Wrist/arm going down-right
        18: [(16,skinD),(17,skinD),(18,skinDD),(19,skinDD)],
        19: [(17,skin),(18,skinD),(19,skinD),(20,skinDD),(21,skinDD)],
        20: [(18,skin),(19,skin),(20,skinD),(21,skinD),(22,skinDD)],
        21: [(19,skin),(20,skin),(21,skinD),(22,skinD),(23,skinDD)],
        22: [(20,skinH),(21,skin),(22,skinD),(23,skinD),(24,skinDD)],
        23: [(21,skinH),(22,skin),(23,skinD),(24,skinDD)],
        24: [(22,skinH),(23,skin),(24,skinD)],
    }
    for y, pixels in rows.items():
        for x, c in pixels:
            img.putpixel((x, y), c)

    img = outline(img, (80, 50, 30, 255))
    save("tool_hand", img)

# ========== PICKAXE (Iron Pickaxe - classic diagonal) ==========
def gen_pickaxe():
    img = Image.new("RGBA", (SZ, SZ), O)
    # Wood handle
    w1 = (156, 116, 53, 255)   # oak main
    w2 = (126, 88, 35, 255)    # oak shadow
    w3 = (182, 142, 78, 255)   # oak highlight
    # Iron head
    i1 = (195, 195, 200, 255)  # iron main
    i2 = (225, 225, 232, 255)  # iron highlight
    i3 = (155, 155, 165, 255)  # iron shadow
    i4 = (120, 120, 130, 255)  # iron dark

    # Diagonal handle from bottom-left to upper-center
    for i in range(14):
        hx = 5 + i
        hy = 24 - i
        img.putpixel((hx, hy), w3)
        img.putpixel((hx+1, hy), w1)
        img.putpixel((hx, hy+1), w1)
        img.putpixel((hx+1, hy+1), w2)

    # Pickaxe head: horizontal bar at top
    # Main bar
    for x in range(7, 27):
        for y in range(5, 9):
            if y == 5: c = i2
            elif y == 6: c = i1
            elif y == 7: c = i3
            else: c = i4
            img.putpixel((x, y), c)

    # Left spike (going down-left)
    for i in range(4):
        for dy in range(2):
            x, y = 7+i, 9+i+dy
            if 0 <= x < SZ and 0 <= y < SZ:
                img.putpixel((x, y), i3 if dy else i1)

    # Right spike (going down-right)
    for i in range(4):
        for dy in range(2):
            x, y = 26-i, 9+i+dy
            if 0 <= x < SZ and 0 <= y < SZ:
                img.putpixel((x, y), i4 if dy else i3)

    img = outline(img)
    save("tool_pickaxe", img)

# ========== AXE (Iron Axe - diagonal with large blade) ==========
def gen_axe():
    img = Image.new("RGBA", (SZ, SZ), O)
    w1 = (156, 116, 53, 255)
    w2 = (126, 88, 35, 255)
    w3 = (182, 142, 78, 255)
    i1 = (195, 195, 200, 255)
    i2 = (225, 225, 232, 255)
    i3 = (155, 155, 165, 255)
    i4 = (120, 120, 130, 255)

    # Handle diagonal
    for i in range(16):
        hx = 4 + i
        hy = 26 - i
        if 0 <= hx < SZ and 0 <= hy < SZ:
            img.putpixel((hx, hy), w3)
        if 0 <= hx+1 < SZ and 0 <= hy < SZ:
            img.putpixel((hx+1, hy), w1)
        if 0 <= hx < SZ and 0 <= hy+1 < SZ:
            img.putpixel((hx, hy+1), w1)
        if 0 <= hx+1 < SZ and 0 <= hy+1 < SZ:
            img.putpixel((hx+1, hy+1), w2)

    # Axe blade on the right side of handle top
    blade = [
        # Row: y -> list of (x, color)
        (6, [(20,i2),(21,i2),(22,i1)]),
        (7, [(19,i2),(20,i2),(21,i1),(22,i1),(23,i1)]),
        (8, [(18,i2),(19,i2),(20,i1),(21,i1),(22,i1),(23,i3),(24,i3)]),
        (9, [(18,i2),(19,i1),(20,i1),(21,i1),(22,i3),(23,i3),(24,i3),(25,i4)]),
        (10, [(18,i1),(19,i1),(20,i1),(21,i3),(22,i3),(23,i3),(24,i4),(25,i4)]),
        (11, [(19,i1),(20,i1),(21,i3),(22,i3),(23,i4),(24,i4),(25,i4)]),
        (12, [(19,i3),(20,i3),(21,i3),(22,i4),(23,i4),(24,i4)]),
        (13, [(20,i3),(21,i4),(22,i4),(23,i4)]),
        (14, [(21,i4),(22,i4)]),
    ]
    for y, pixels in blade:
        for x, c in pixels:
            img.putpixel((x, y), c)

    # Binding (where head meets handle)
    for dy in range(3):
        img.putpixel((18, 9+dy), i4)
        img.putpixel((17, 9+dy), i3)

    img = outline(img)
    save("tool_axe", img)

# ========== HAMMER (Iron/Stone Hammer) ==========
def gen_hammer():
    img = Image.new("RGBA", (SZ, SZ), O)
    w1 = (156, 116, 53, 255)
    w2 = (126, 88, 35, 255)
    w3 = (182, 142, 78, 255)
    s1 = (145, 145, 150, 255)   # stone main
    s2 = (175, 175, 182, 255)   # stone light
    s3 = (115, 115, 122, 255)   # stone shadow
    s4 = (88, 88, 95, 255)      # stone dark

    # Handle diagonal
    for i in range(13):
        hx = 6 + i
        hy = 25 - i
        img.putpixel((hx, hy), w3)
        img.putpixel((hx+1, hy), w1)
        img.putpixel((hx, hy+1), w1)
        img.putpixel((hx+1, hy+1), w2)

    # Hammer head: big rectangular block
    for x in range(10, 26):
        for y in range(4, 13):
            if y <= 5:
                c = s2
            elif y >= 11:
                c = s4
            elif x <= 12:
                c = s2
            elif x >= 23:
                c = s3
            else:
                c = s1
            img.putpixel((x, y), c)

    # Add texture detail to hammer face
    img.putpixel((15, 7), s3)
    img.putpixel((20, 9), s3)
    img.putpixel((13, 9), s2)
    img.putpixel((17, 10), s3)
    img.putpixel((22, 7), s3)
    img.putpixel((14, 6), s2)
    img.putpixel((19, 8), s3)

    img = outline(img)
    save("tool_hammer", img)

gen_hand()
gen_pickaxe()
gen_axe()
gen_hammer()
print("Done!")
