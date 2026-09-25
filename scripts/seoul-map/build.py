"""Build src/assets/seoul-map.svg from OpenStreetMap data.

Usage (from the repo root):
  curl -s -H "Accept: application/json" --data-urlencode "data@scripts/seoul-map/query.overpassql" \
    https://overpass-api.de/api/interpreter -o /tmp/seoul.json
  python3 scripts/seoul-map/build.py /tmp/seoul.json src/assets/seoul-map.svg

Map data (c) OpenStreetMap contributors, ODbL. The credit is drawn into the SVG.
Style follows the muted field-guide reference: sage parks, teal stippled water,
cream roads, faint grid, paper grain.
"""
import json, math, sys

SRC, OUT = sys.argv[1], sys.argv[2]
LAT0, LAT1, LON0, LON1 = 37.488, 37.612, 126.860, 127.120
W = 600
K = math.cos(math.radians((LAT0 + LAT1) / 2))
SCALE = W / ((LON1 - LON0) * K)
H = round((LAT1 - LAT0) * SCALE)
PAD = 12

def proj(lat, lon):
    return ((lon - LON0) * K * SCALE, (LAT1 - lat) * SCALE)

def clip_poly(pts):
    # Sutherland–Hodgman against the padded frame
    def clip(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            if inside(b):
                if not inside(a): out.append(inter(a, b))
                out.append(b)
            elif inside(a):
                out.append(inter(a, b))
        return out
    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))
    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]), y)
    for inside, inter in (
        (lambda p: p[0] >= -PAD, ix(-PAD)), (lambda p: p[0] <= W + PAD, ix(W + PAD)),
        (lambda p: p[1] >= -PAD, iy(-PAD)), (lambda p: p[1] <= H + PAD, iy(H + PAD)),
    ):
        if not pts: break
        pts = clip(pts, inside, inter)
    return pts

def in_frame(p):
    return -PAD <= p[0] <= W + PAD and -PAD <= p[1] <= H + PAD

def simplify(pts, tol):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy)
    best, idx = 0, 0
    for i in range(1, len(pts) - 1):
        if n < 1e-9:  # closed ring: endpoints coincide, use distance to the point
            d = math.hypot(pts[i][0] - a[0], pts[i][1] - a[1])
        else:
            d = abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / n
        if d > best: best, idx = d, i
    if best <= tol: return [a, b]
    return simplify(pts[:idx + 1], tol)[:-1] + simplify(pts[idx:], tol)

def area(pts):
    return abs(sum(pts[i - 1][0] * pts[i][1] - pts[i][0] * pts[i - 1][1] for i in range(len(pts)))) / 2

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

def geom(g):
    return [(round(p["lat"], 7), round(p["lon"], 7)) for p in g]

def kind(t):
    if t.get("highway") in ("motorway", "trunk", "primary", "secondary"): return "road"
    if t.get("natural") == "water" or t.get("waterway") == "riverbank": return "water"
    if t.get("leisure") == "park" or t.get("landuse") == "forest" or t.get("natural") == "wood": return "green"
    return None

polys = {"water": [], "green": []}
roads = {"motorway": [], "trunk": [], "primary": [], "secondary": []}

for e in json.load(open(SRC))["elements"]:
    t = e.get("tags", {}); k = kind(t)
    if k is None: continue
    if e["type"] == "way":
        g = geom(e.get("geometry", []))
        if k == "road":
            roads[t["highway"]].append(g)
        elif len(g) > 3 and g[0] == g[-1]:
            polys[k].append([g])
    else:
        outer = assemble([geom(m["geometry"]) for m in e.get("members", []) if m.get("role") == "outer" and "geometry" in m])
        inner = assemble([geom(m["geometry"]) for m in e.get("members", []) if m.get("role") == "inner" and "geometry" in m])
        if outer: polys[k].append(outer + inner)

def fmt(pts):
    return "M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in pts) + "Z"

def poly_path(groups, min_area):
    parts = []
    for rings in groups:
        sub = []
        for i, ring in enumerate(rings):
            p = clip_poly([proj(*c) for c in ring])
            if len(p) < 3: continue
            p = simplify(p + [p[0]], 0.7)[:-1]
            if len(p) < 3: continue
            if i == 0 and area(p) < min_area: sub = []; break
            sub.append(fmt(p))
        parts += sub
    return "".join(parts)

def road_path(lines, tol):
    parts = []
    for g in lines:
        seg = []
        for c in g + [None]:
            p = proj(*c) if c else None
            if p and in_frame(p): seg.append(p); continue
            if len(seg) > 1:
                s = simplify(seg, tol)
                parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in s))
            seg = []
    return "".join(parts)

green = poly_path(polys["green"], 25)
water = poly_path(polys["water"], 4)
hx, hy = proj(37.5663, 126.9779)  # Seoul City Hall

svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">
<defs>
<pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="#5b5a45" stroke-opacity=".09" stroke-width=".6"/></pattern>
<pattern id="stipple" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".55" fill="#6f918f" fill-opacity=".55"/><circle cx="3.7" cy="3.7" r=".45" fill="#b7cfcc" fill-opacity=".7"/></pattern>
<pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V6" stroke="#6d8f69" stroke-opacity=".35" stroke-width=".8"/></pattern>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 .35  0 0 0 0 .33  0 0 0 0 .25  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<path id="g" d="{green}" fill-rule="evenodd"/><path id="w" d="{water}" fill-rule="evenodd"/>
</defs>
<rect width="{W}" height="{H}" fill="#e7e1cf"/>
<use href="#g" fill="#88a684"/><use href="#g" fill="url(#hatch)"/>
<use href="#w" fill="#9cbab8"/><use href="#w" fill="url(#stipple)"/>
<g fill="none" stroke="#f6f2e4" stroke-linecap="round" stroke-linejoin="round">
<path d="{road_path(roads["secondary"], 1.4)}" stroke-width=".6" stroke-opacity=".75"/>
<path d="{road_path(roads["primary"], 1.0)}" stroke-width="1.1"/>
<path d="{road_path(roads["trunk"] + roads["motorway"], .9)}" stroke-width="1.9"/>
</g>
<rect width="{W}" height="{H}" fill="url(#grid)"/>
<rect width="{W}" height="{H}" fill="#fff" filter="url(#paper)"/>
<g transform="translate({hx:.1f} {hy:.1f})">
<circle r="24" fill="#efd84a" stroke="#1d1d16" stroke-opacity=".15"/>
<g fill="#1a1a14">{"".join(f'<ellipse rx="3.7" ry="9.9" cy="-8.3" transform="rotate({a})"/>' for a in range(0, 360, 45))}<circle r="3.8"/></g>
</g>
<g transform="translate({hx + 34:.1f} {hy - 18:.1f})">
<rect width="146" height="36" rx="9" fill="#f9f8e3" stroke="#1d1d16" stroke-opacity=".12"/>
<text x="15" y="24.5" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" letter-spacing="1" fill="#1a1a14">SEOUL 서울</text>
</g>
<g transform="translate({W - 212} {H - 26})">
<rect width="206" height="21" rx="4" fill="#f9f8e3" fill-opacity=".85"/>
<text x="103" y="14.5" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="11.5" fill="#4a4a3c">© OpenStreetMap contributors</text>
</g>
</svg>'''
open(OUT, "w").write(svg)
print(f"{W}x{H}, {len(svg)/1024:.0f} KB, water {len(water)/1024:.0f}KB green {len(green)/1024:.0f}KB")
