[out:json][timeout:120];
(
  way["natural"="water"](37.508,126.895,37.548,126.965);
  relation["natural"="water"](37.508,126.895,37.548,126.965);
  way["leisure"="park"](37.508,126.895,37.548,126.965);
  relation["leisure"="park"](37.508,126.895,37.548,126.965);
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified)$"](37.508,126.895,37.548,126.965);
  way["place"="island"](37.508,126.895,37.548,126.965);
  relation["place"="island"](37.508,126.895,37.548,126.965);
);
out geom;
