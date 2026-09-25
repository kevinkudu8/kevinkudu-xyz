"""Build the Running tab's map background and sample route from OpenStreetMap.

Usage (from the repo root):
  curl -s -H "Accept: application/json" --data-urlencode "data@scripts/run-map/query.overpassql" \\
    https://overpass-api.de/api/interpreter -o /tmp/yeouido.json
  python3 scripts/run-map/build.py /tmp/yeouido.json

Writes src/assets/run-map.svg (light, site-styled base map) and
src/data/run-route.json (route points in the same coordinates, plus distance).
The sample route is a loop just inside Yeouido's shoreline, along the Han
River paths. Replace it with a real GPX-derived route when available.
Map data (c) OpenStreetMap contributors, ODbL.
"""
import json, math, sys

SRC = sys.argv[1]
W, H = 800, 500
PAD = 10

elements = json.load(open(SRC))["elements"]

def geom(g):
    return [(p["lat"], p["lon"]) for p in g]

def assemble(ways):
    ways = [list(w) for w in ways if len(w) > 1]
    rings = []
    while ways:
        ring = ways.pop()
        changed = True
        while ring[0] != ring[-1] and changed:
            changed = False
            for i, w in enumerate(ways):
                if w[0] == ring[-1]: ring += w[1:]
                elif w[-1] == ring[-1]: ring += w[::-1][1:]
                elif w[-1] == ring[0]: ring = w + ring[1:]
                elif w[0] == ring[0]: ring = w[::-1] + ring[1:]
                else: continue
                ways.pop(i); changed = True; break
        if ring[0] == ring[-1] and len(ring) > 3:
            rings.append(ring)
    return rings

def polygons(e):
    if e["type"] == "way":
        g = geom(e.get("geometry", []))
        return [[g]] if len(g) > 3 and g[0] == g[-1] else []
    members = e.get("members", [])
    outer = assemble([geom(m["geometry"]) for m in members if m.get("role") == "outer" and "geometry" in m])
    inner = assemble([geom(m["geometry"]) for m in members if m.get("role") == "inner" and "geometry" in m])
    return [outer + inner] if outer else []

island = next(e for e in elements if e.get("tags", {}).get("place") == "island")
island_ring = max(polygons(island)[0], key=len)

# Frame: the island with generous room around it, stretched to 16:10
lats = [p[0] for p in island_ring]; lons = [p[1] for p in island_ring]
clat, clon = (min(lats) + max(lats)) / 2, (min(lons) + max(lons)) / 2
K = math.cos(math.radians(clat))
span_x = (max(lons) - min(lons)) * K * 1.7
span_y = (max(lats) - min(lats)) * 1.9
if span_x / span_y < W / H: span_x = span_y * W / H
else: span_y = span_x * H / W
SCALE = W / span_x

# Island sits above centre, leaving the bottom of the card clear for the distance readout
CY = H * 0.4

def proj(lat, lon):
    return ((lon - clon) * K * SCALE + W / 2, (clat - lat) * SCALE + CY)

def clip_poly(pts):
    def clip(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a): out.append(inter(a, b))
        return out
    ix = lambda x: (lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0])))
    iy = lambda y: (lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y))
    for inside, inter in ((lambda p: p[0] >= -PAD, ix(-PAD)), (lambda p: p[0] <= W + PAD, ix(W + PAD)),
                          (lambda p: p[1] >= -PAD, iy(-PAD)), (lambda p: p[1] <= H + PAD, iy(H + PAD))):
        if not pts: break
        pts = clip(pts, inside, inter)
    return pts

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]; n = math.hypot(dx, dy)
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        d = math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]) if n < 1e-9 else abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / n
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)

def fmt_poly(groups, min_area=0):
    out = []
    for rings in groups:
        for ring in rings:
            p = clip_poly([proj(*c) for c in ring])
            if len(p) < 3: continue
            p = simplify(p + [p[0]], 0.6)[:-1]
            if len(p) >= 3: out.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in p) + "Z")
    return "".join(out)

def in_frame(p): return -PAD <= p[0] <= W + PAD and -PAD <= p[1] <= H + PAD

def fmt_lines(lines, tol):
    out = []
    for g in lines:
        seg = []
        for c in g + [None]:
            p = proj(*c) if c else None
            if p and in_frame(p): seg.append(p); continue
            if len(seg) > 1:
                s = simplify(seg, tol); out.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in s))
            seg = []
    return "".join(out)

water, parks = [], []
roads = {"major": [], "minor": []}
for e in elements:
    t = e.get("tags", {})
    if t.get("natural") == "water": water += polygons(e)
    elif t.get("leisure") == "park": parks += polygons(e)
    elif "highway" in t and e["type"] == "way":
        roads["major" if t["highway"] in ("motorway", "trunk", "primary", "secondary") else "minor"].append(geom(e["geometry"]))

# Route: the shoreline pulled ~45 m inland, roughly where the riverside paths run
def haversine(a, b):
    R = 6371.0088
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    return 2 * R * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))

# Drop small shoreline features (like the hook at the western tip) before insetting
ring = simplify([proj(*c) for c in island_ring], 5)[:-1]
ring = [((clat - (y - CY) / SCALE), clon + (x - W / 2) / (K * SCALE)) for x, y in ring]
# Even out vertex spacing before offsetting, so the inset stays smooth
dense = []
for i in range(len(ring)):
    a, b = ring[i], ring[(i + 1) % len(ring)]
    steps = max(1, int(haversine(a, b) / 0.02))
    dense += [(a[0] + (b[0] - a[0]) * s / steps, a[1] + (b[1] - a[1]) * s / steps) for s in range(steps)]
xy = [proj(*p) for p in dense]
area = sum(xy[i - 1][0] * xy[i][1] - xy[i][0] * xy[i - 1][1] for i in range(len(xy))) / 2
inward = 1 if area > 0 else -1
# span_x is already in latitude-degree units (longitude x cos(lat)); ~111.32 km each
metres_per_unit = span_x * 111_320 / W
offset = 45 / metres_per_unit
inset = []
n = len(xy)
for i in range(n):
    (x0, y0), (x2, y2) = xy[i - 3], xy[(i + 3) % n]
    tx, ty = x2 - x0, y2 - y0; L = math.hypot(tx, ty) or 1
    nx, ny = -ty / L * inward, tx / L * inward
    inset.append((xy[i][0] + nx * offset, xy[i][1] + ny * offset))
# Smooth, then start on the north-east shore by Yeouinaru
sm = [(sum(inset[(i + k) % n][0] for k in range(-4, 5)) / 9, sum(inset[(i + k) % n][1] for k in range(-4, 5)) / 9) for i in range(n)]
sx, sy = proj(37.5275, 126.9335)
start = min(range(n), key=lambda i: (sm[i][0] - sx) ** 2 + (sm[i][1] - sy) ** 2)
route = sm[start:] + sm[:start + 1]
# Where the island is narrower than twice the inset (the western tip), the
# inset line crosses itself; cut out any such loops
def cross(p1, p2, p3, p4):
    d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0])
    if abs(d) < 1e-12: return None
    t = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d
    u = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d
    return (p1[0] + t * (p2[0] - p1[0]), p1[1] + t * (p2[1] - p1[1])) if 0 < t < 1 and 0 < u < 1 else None

def untangle(pts):
    changed = True
    while changed:
        changed = False
        for i in range(len(pts) - 1):
            # only short loops: never cut the whole lap
            for j in range(i + 2, min(len(pts) - 1, i + len(pts) // 3)):
                hit = cross(pts[i], pts[i + 1], pts[j], pts[j + 1])
                if hit:
                    pts = pts[: i + 1] + [hit] + pts[j + 1 :]
                    changed = True
                    break
            if changed: break
    return pts

route = untangle(route)
route = simplify(route, 0.35)
km = sum(math.hypot(route[i][0] - route[i - 1][0], route[i][1] - route[i - 1][1]) for i in range(1, len(route))) * metres_per_unit / 1000

cx, cy = proj(clat, clon)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<rect width="{W}" height="{H}" fill="#ecece9"/>
<path d="{fmt_poly(parks)}" fill="#e1e5dd" fill-rule="evenodd"/>
<path d="{fmt_poly(water)}" fill="#d6dbde" fill-rule="evenodd"/>
<g fill="none" stroke="#fbfbfa" stroke-linecap="round" stroke-linejoin="round">
<path d="{fmt_lines(roads["minor"], 0.5)}" stroke-width=".9"/>
<path d="{fmt_lines(roads["major"], 0.5)}" stroke-width="2.2"/>
</g>
<g font-family="ui-monospace, SFMono-Regular, Menlo, monospace" fill="#9a9a95" letter-spacing="2" text-anchor="middle">
<text x="{cx:.0f}" y="{cy:.0f}" font-size="11">YEOUIDO</text>
<text x="{cx + 150:.0f}" y="{cy - 150:.0f}" font-size="10" transform="rotate(-24 {cx + 150:.0f} {cy - 150:.0f})">HAN RIVER</text>
</g>
<text x="{W - 8}" y="{H - 8}" text-anchor="end" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="7.5" fill="#a5a5a0">© OpenStreetMap contributors</text>
</svg>'''
open("src/assets/run-map.svg", "w").write(svg)
json.dump({"width": W, "height": H, "km": round(km, 2), "label": "Yeouido loop, Seoul",
           "d": "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in route)},
          open("src/data/run-route.json", "w"), indent=1)
print(f"route {km:.2f} km, {len(route)} points; svg {len(svg)//1024} KB")
