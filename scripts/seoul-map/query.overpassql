[out:json][timeout:120];
(
  way["natural"="water"](37.470,126.845,37.630,127.135);
  relation["natural"="water"](37.470,126.845,37.630,127.135);
  way["waterway"="riverbank"](37.470,126.845,37.630,127.135);
  way["leisure"="park"](37.470,126.845,37.630,127.135);
  relation["leisure"="park"](37.470,126.845,37.630,127.135);
  way["landuse"="forest"](37.470,126.845,37.630,127.135);
  relation["landuse"="forest"](37.470,126.845,37.630,127.135);
  way["natural"="wood"](37.470,126.845,37.630,127.135);
  relation["natural"="wood"](37.470,126.845,37.630,127.135);
  way["highway"~"^(motorway|trunk|primary|secondary)$"](37.470,126.845,37.630,127.135);
);
out geom;
