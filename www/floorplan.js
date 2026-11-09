// Grundriss Mumsenstraße 3 (WE 30) – aus gescanntem Plan abgeleitet (Agent 1)
// Koordinaten in Metern, Ursprung = obere linke Außenecke, x rechts, y unten.
window.FLOORPLAN = {
 "name": "Mumsenstraße 3, Hamburg",
 "wallHeight": 2.6,
 "planUpCompassDeg": 0,
 "scaleNote": "aus Grundriss WE 30 abgeleitet, ca. 85 px/m, Genauigkeit ±10 cm",
 "rooms": [
  {
   "id": "wohnen",
   "name": "Wohnzimmer",
   "area": 20.71,
   "polygon": [
    [
     1.035,
     0.294
    ],
    [
     4.8,
     0.294
    ],
    [
     4.8,
     4.718
    ],
    [
     4.624,
     4.718
    ],
    [
     4.624,
     5.835
    ],
    [
     1.0,
     5.835
    ],
    [
     1.0,
     5.482
    ],
    [
     0.8,
     5.482
    ],
    [
     0.8,
     3.929
    ],
    [
     1.035,
     3.929
    ]
   ],
   "floorColor": "#b8916a"
  },
  {
   "id": "schlafen",
   "name": "Schlafzimmer",
   "area": 13.48,
   "polygon": [
    [
     5.035,
     0.306
    ],
    [
     9.882,
     0.306
    ],
    [
     9.882,
     4.2
    ],
    [
     8.671,
     4.2
    ],
    [
     8.671,
     3.047
    ],
    [
     5.035,
     3.047
    ]
   ],
   "floorColor": "#c4a27e"
  },
  {
   "id": "kueche",
   "name": "Küche",
   "area": 6.48,
   "polygon": [
    [
     0.341,
     5.941
    ],
    [
     3.588,
     5.941
    ],
    [
     3.588,
     8.071
    ],
    [
     0.341,
     8.071
    ]
   ],
   "floorColor": "#b9b5ad"
  },
  {
   "id": "flur",
   "name": "Flur",
   "area": 6.65,
   "polygon": [
    [
     3.694,
     5.953
    ],
    [
     5.012,
     5.953
    ],
    [
     5.012,
     5.4
    ],
    [
     6.459,
     5.4
    ],
    [
     6.459,
     8.059
    ],
    [
     3.694,
     8.059
    ]
   ],
   "floorColor": "#a98b6d"
  },
  {
   "id": "bad",
   "name": "Bad",
   "area": 3.78,
   "polygon": [
    [
     6.094,
     3.153
    ],
    [
     8.518,
     3.153
    ],
    [
     8.518,
     4.729
    ],
    [
     6.094,
     4.729
    ]
   ],
   "floorColor": "#c9cdcf"
  },
  {
   "id": "vorraum",
   "name": "Vorraum (11a)",
   "area": 2.21,
   "polygon": [
    [
     5.012,
     3.153
    ],
    [
     6.0,
     3.153
    ],
    [
     6.0,
     5.4
    ],
    [
     5.012,
     5.4
    ]
   ],
   "floorColor": "#ad8f70"
  },
  {
   "id": "abst",
   "name": "Abstellraum",
   "area": 0.82,
   "polygon": [
    [
     6.506,
     5.518
    ],
    [
     7.235,
     5.518
    ],
    [
     7.235,
     6.671
    ],
    [
     6.506,
     6.671
    ]
   ],
   "floorColor": "#a8a196"
  }
 ],
 "walls": [
  {
   "a": [
    0.694,
    0.147
   ],
   "b": [
    10.212,
    0.147
   ],
   "thickness": 0.29,
   "exterior": true
  },
  {
   "a": [
    0.865,
    0.0
   ],
   "b": [
    0.865,
    3.929
   ],
   "thickness": 0.34,
   "exterior": true
  },
  {
   "a": [
    0.718,
    3.929
   ],
   "b": [
    0.718,
    5.482
   ],
   "thickness": 0.16,
   "exterior": true
  },
  {
   "a": [
    0.0,
    5.682
   ],
   "b": [
    1.0,
    5.682
   ],
   "thickness": 0.4,
   "exterior": true
  },
  {
   "a": [
    0.171,
    5.482
   ],
   "b": [
    0.171,
    8.294
   ],
   "thickness": 0.34,
   "exterior": true
  },
  {
   "a": [
    0.0,
    8.182
   ],
   "b": [
    6.671,
    8.182
   ],
   "thickness": 0.22,
   "exterior": true
  },
  {
   "a": [
    6.565,
    6.682
   ],
   "b": [
    6.565,
    8.294
   ],
   "thickness": 0.2,
   "exterior": true
  },
  {
   "a": [
    6.459,
    6.735
   ],
   "b": [
    7.341,
    6.735
   ],
   "thickness": 0.11,
   "exterior": true
  },
  {
   "a": [
    7.294,
    4.729
   ],
   "b": [
    7.294,
    6.788
   ],
   "thickness": 0.09,
   "exterior": true
  },
  {
   "a": [
    7.341,
    4.824
   ],
   "b": [
    8.671,
    4.824
   ],
   "thickness": 0.11,
   "exterior": true
  },
  {
   "a": [
    8.612,
    3.047
   ],
   "b": [
    8.612,
    4.871
   ],
   "thickness": 0.19,
   "exterior": true
  },
  {
   "a": [
    8.612,
    4.229
   ],
   "b": [
    10.212,
    4.229
   ],
   "thickness": 0.11,
   "exterior": true
  },
  {
   "a": [
    10.047,
    0.0
   ],
   "b": [
    10.047,
    4.282
   ],
   "thickness": 0.33,
   "exterior": true
  },
  {
   "a": [
    4.906,
    0.147
   ],
   "b": [
    4.906,
    4.718
   ],
   "thickness": 0.21,
   "exterior": false
  },
  {
   "a": [
    4.818,
    4.718
   ],
   "b": [
    4.818,
    5.953
   ],
   "thickness": 0.39,
   "exterior": false
  },
  {
   "a": [
    0.341,
    5.888
   ],
   "b": [
    4.635,
    5.888
   ],
   "thickness": 0.11,
   "exterior": false
  },
  {
   "a": [
    3.641,
    5.888
   ],
   "b": [
    3.641,
    8.182
   ],
   "thickness": 0.11,
   "exterior": false
  },
  {
   "a": [
    5.012,
    3.1
   ],
   "b": [
    8.671,
    3.1
   ],
   "thickness": 0.11,
   "exterior": false
  },
  {
   "a": [
    6.047,
    3.153
   ],
   "b": [
    6.047,
    4.729
   ],
   "thickness": 0.09,
   "exterior": false
  },
  {
   "a": [
    6.0,
    5.112
   ],
   "b": [
    7.341,
    5.112
   ],
   "thickness": 0.76,
   "exterior": false
  },
  {
   "a": [
    6.459,
    5.494
   ],
   "b": [
    6.459,
    6.735
   ],
   "thickness": 0.08,
   "exterior": false
  }
 ],
 "openings": [
  {
   "type": "window",
   "a": [
    0.865,
    1.424
   ],
   "b": [
    0.865,
    2.953
   ],
   "sill": 0.92,
   "height": 1.38,
   "roomId": "wohnen",
   "outwardNormal": [
    -1,
    0
   ]
  },
  {
   "type": "balcony-door",
   "a": [
    0.718,
    3.965
   ],
   "b": [
    0.718,
    5.4
   ],
   "sill": 0,
   "height": 2.1,
   "roomId": "wohnen",
   "outwardNormal": [
    -1,
    0
   ]
  },
  {
   "type": "window",
   "a": [
    6.341,
    0.147
   ],
   "b": [
    7.682,
    0.147
   ],
   "sill": 0.9,
   "height": 1.4,
   "roomId": "schlafen",
   "outwardNormal": [
    0,
    -1
   ]
  },
  {
   "type": "window",
   "a": [
    0.171,
    6.718
   ],
   "b": [
    0.171,
    7.894
   ],
   "sill": 0.9,
   "height": 1.3,
   "roomId": "kueche",
   "outwardNormal": [
    -1,
    0
   ]
  },
  {
   "type": "door",
   "a": [
    3.741,
    5.888
   ],
   "b": [
    4.612,
    5.888
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "wohnen"
  },
  {
   "type": "door",
   "a": [
    3.641,
    6.388
   ],
   "b": [
    3.641,
    7.118
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "kueche"
  },
  {
   "type": "door",
   "a": [
    5.153,
    3.1
   ],
   "b": [
    5.918,
    3.1
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "schlafen"
  },
  {
   "type": "door",
   "a": [
    6.047,
    3.259
   ],
   "b": [
    6.047,
    3.988
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "bad"
  },
  {
   "type": "door",
   "a": [
    6.459,
    5.576
   ],
   "b": [
    6.459,
    6.129
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "abst"
  },
  {
   "type": "door",
   "a": [
    6.565,
    7.106
   ],
   "b": [
    6.565,
    8.035
   ],
   "sill": 0,
   "height": 2.0,
   "roomId": "flur",
   "entrance": true
  }
 ],
 "balcony": {
  "polygon": [
   [
    -0.824,
    3.847
   ],
   [
    0.647,
    3.847
   ],
   [
    0.647,
    5.659
   ],
   [
    -0.824,
    5.659
   ]
  ]
 }
};
