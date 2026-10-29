/* =========================================================
   SITE CONFIG — edit with the admin panel (/admin.html)
   or by hand. Must stay valid JSON inside the braces.
   ========================================================= */
window.SITE_CONFIG = {
  "barber": {
    "firstName": "Lucas",
    "lastName": "Hale",
    "title": "Independent barber",
    "city": "Brooklyn, NY",
    "yearsCutting": 9,
    "rating": "4.9",
    "reviewCount": "300+",
    "phone": "+17185550142",
    "phoneDisplay": "(718) 555-0142",
    "email": "hello@lucashale.example",
    "bookingUrl": "https://booksy.com",
    "social": {
      "instagram": "https://instagram.com",
      "tiktok": "https://tiktok.com",
      "facebook": "https://facebook.com"
    }
  },
  "theme": {
    "mode": "auto",
    "accent": "#b4372b",
    "font": "editorial",
    "corners": "rounded"
  },
  "sections": {
    "finder": true,
    "guards": true,
    "reviews": true,
    "about": true,
    "portfolio": true
  },
  "hero": {
    "headline": [
      "Sharp cuts.",
      "Clean fades.",
      "No rush."
    ],
    "intro": "9 years behind the chair, specialising in skin fades, classic scissor work and beard sculpting. Wherever I'm cutting, the standard stays the same.",
    "image": {
      "src": "https://images.unsplash.com/photo-1553521041-d168abd31de3",
      "alt": "Portrait of a bearded barber in a dark T-shirt holding a pair of scissors up toward the camera"
    },
    "available": "Taking new clients",
    "statLabel": "per appointment, minimum",
    "statValue": "40 min"
  },
  "about": {
    "heading": "The barber, not the building",
    "paragraphs": [
      "I started sweeping floors at my uncle's shop at 15 and never left the trade. Since then I've cut in neighbourhood shops, high-end studios and backstage at fashion week. The shop on the sign may change — the way I work doesn't.",
      "Every appointment starts with a proper consultation. We talk about your hair type, your routine and how much time you actually want to spend on it in the morning. Then I cut for that."
    ],
    "highlights": [
      "Licensed master barber (NY State)",
      "Hot-towel shaves with straight razor",
      "Textured & curly hair specialist",
      "Kids welcome — patient with first cuts"
    ],
    "image": {
      "src": "https://images.unsplash.com/photo-1593702295094-aea22597af65",
      "alt": "A barber in a flat cap and white shirt cutting a client's hair in a bright shop"
    }
  },
  "text": {
    "cuts": {
      "eyebrow": "Explore the cuts",
      "title": "Pick a style, see the details",
      "intro": "Choose a cut to see what it involves, how much upkeep it needs and exactly what to ask for."
    },
    "finder": {
      "eyebrow": "Cut finder",
      "title": "Not sure what to get?",
      "intro": "Answer four quick questions and I'll suggest the cuts that suit your hair and your routine."
    },
    "guards": {
      "eyebrow": "Speak barber",
      "title": "Clipper guard guide",
      "intro": "\"A number 2 on the sides\" — but how short is that? Slide to see each guard length."
    },
    "services": {
      "eyebrow": "Services & prices",
      "title": "What I do",
      "intro": "Prices include a wash, hot towel and style. Card, cash and tap accepted."
    },
    "work": {
      "eyebrow": "Portfolio",
      "title": "Recent work",
      "intro": "Select a photo to see it larger. Filter by style:"
    },
    "find": {
      "eyebrow": "Where I'm cutting now",
      "title": "Find my chair"
    },
    "reviews": {
      "eyebrow": "Reviews",
      "title": "What clients say"
    },
    "book": {
      "eyebrow": "Book",
      "title": "Book a chair",
      "intro": "Send a request and I'll confirm by text within a few hours. Prefer to book instantly? Use my online booking page.",
      "policy": "Need to cancel? Give me 24 hours' notice so someone else can take the spot."
    }
  },
  "shop": {
    "timezone": "America/New_York",
    "name": "The Common Cut",
    "address": [
      "218 Bedford Ave, Chair 3",
      "Brooklyn, NY 11211"
    ],
    "mapUrl": "https://maps.google.com/?q=218+Bedford+Ave+Brooklyn+NY",
    "accessNote": "Step-free entrance. The chair height adjusts for wheelchair transfers — just mention it when you book."
  },
  "hours": [
    [
      "Monday",
      "Closed"
    ],
    [
      "Tuesday",
      "10:00 am – 7:00 pm"
    ],
    [
      "Wednesday",
      "10:00 am – 7:00 pm"
    ],
    [
      "Thursday",
      "11:00 am – 8:00 pm"
    ],
    [
      "Friday",
      "11:00 am – 8:00 pm"
    ],
    [
      "Saturday",
      "9:00 am – 5:00 pm"
    ],
    [
      "Sunday",
      "By appointment"
    ]
  ],
  "services": [
    {
      "id": "signature",
      "name": "Signature cut",
      "desc": "Consultation, precision cut with clippers and scissors, wash and style.",
      "price": 45,
      "duration": 45
    },
    {
      "id": "skin-fade",
      "name": "Skin fade",
      "desc": "Seamless fade down to the skin, crisp line-up and finished top.",
      "price": 50,
      "duration": 50
    },
    {
      "id": "beard",
      "name": "Beard sculpt",
      "desc": "Shape, line and condition. Finished with hot towel and beard oil.",
      "price": 30,
      "duration": 30
    },
    {
      "id": "cut-beard",
      "name": "Cut + beard",
      "desc": "The full reset — signature cut or fade plus a complete beard sculpt.",
      "price": 70,
      "duration": 75,
      "featured": "Most booked"
    },
    {
      "id": "shave",
      "name": "Hot-towel shave",
      "desc": "Traditional straight-razor shave with pre-shave oil and two hot towels.",
      "price": 40,
      "duration": 40
    },
    {
      "id": "kids",
      "name": "Kids cut",
      "note": "under 12",
      "desc": "Relaxed, patient, no pressure. Great for first haircuts.",
      "price": 30,
      "duration": 30
    }
  ],
  "cuts": [
    {
      "id": "skin-fade",
      "name": "Skin fade",
      "service": "skin-fade",
      "image": "https://images.unsplash.com/photo-1593702275687-f8b402bf1fb5",
      "alt": "Close-up of a barber using clippers to fade the side of a client's head down to the skin",
      "summary": "Sides blended from bare skin up into the top. Clean, sharp and the most requested cut in the shop.",
      "askFor": "A mid skin fade starting with no guard, blended up into a #2, and an inch off the top.",
      "maintenance": 3,
      "upkeep": "every 2–3 weeks",
      "styling": "2 min",
      "product": "Matte clay",
      "match": {
        "hair": [
          "straight",
          "wavy",
          "curly",
          "coily"
        ],
        "effort": [
          "low"
        ],
        "vibe": [
          "sharp",
          "bold"
        ],
        "visits": [
          "often"
        ]
      }
    },
    {
      "id": "textured-quiff",
      "name": "Textured quiff",
      "service": "signature",
      "image": "https://images.unsplash.com/photo-1618049049816-43a00d5b0c3d",
      "alt": "Man with short tapered sides and a tall, textured quiff swept up at the front",
      "summary": "Short tapered sides with length and movement on top. Looks styled but forgiving if you skip a day.",
      "askFor": "A #3 taper on the sides, 3–4 inches left on top, point-cut for texture.",
      "maintenance": 2,
      "upkeep": "every 4–5 weeks",
      "styling": "5 min",
      "product": "Sea salt spray + light paste",
      "match": {
        "hair": [
          "straight",
          "wavy"
        ],
        "effort": [
          "medium",
          "high"
        ],
        "vibe": [
          "natural",
          "classic"
        ],
        "visits": [
          "monthly"
        ]
      }
    },
    {
      "id": "pompadour",
      "name": "Pompadour",
      "service": "signature",
      "image": "https://images.unsplash.com/photo-1627100232173-acf3733f02bc",
      "alt": "Black-and-white portrait of a man with a high, glossy pompadour and short sides",
      "summary": "Volume swept up and back with a polished finish. A statement cut with a vintage edge.",
      "askFor": "Scissor-taper the sides, keep the most length at the front, and leave the top heavy for volume.",
      "maintenance": 2,
      "upkeep": "every 4–5 weeks",
      "styling": "10 min",
      "product": "Blow-dry + pomade",
      "match": {
        "hair": [
          "straight",
          "wavy"
        ],
        "effort": [
          "high"
        ],
        "vibe": [
          "classic",
          "bold"
        ],
        "visits": [
          "monthly"
        ]
      }
    },
    {
      "id": "side-part",
      "name": "Side part",
      "service": "signature",
      "image": "https://images.unsplash.com/photo-1562004760-aceed7bb0fe3",
      "alt": "Man with a neat side part, short faded sides and a smooth combed top",
      "summary": "The timeless office-to-weekend cut. A defined part with tidy tapered sides.",
      "askFor": "A low taper, a hard part on the left, and about 2 inches on top combed to the side.",
      "maintenance": 2,
      "upkeep": "every 3–4 weeks",
      "styling": "5 min",
      "product": "Medium-hold cream",
      "match": {
        "hair": [
          "straight",
          "wavy"
        ],
        "effort": [
          "medium"
        ],
        "vibe": [
          "classic",
          "sharp"
        ],
        "visits": [
          "monthly",
          "often"
        ]
      }
    },
    {
      "id": "curly-taper",
      "name": "Curly top + taper",
      "service": "signature",
      "image": "https://images.unsplash.com/photo-1567894340315-735d7c361db0",
      "alt": "Barber shaping a client's bleached curly top with a low faded taper on the sides",
      "summary": "Curls kept long and defined on top, cleaned up with a low taper. Shape without losing the texture.",
      "askFor": "A low taper or burst fade, keep the curls long on top — just shape and define them.",
      "maintenance": 2,
      "upkeep": "every 3–4 weeks",
      "styling": "2 min",
      "product": "Curl cream",
      "match": {
        "hair": [
          "curly",
          "coily"
        ],
        "effort": [
          "low",
          "medium"
        ],
        "vibe": [
          "natural",
          "bold"
        ],
        "visits": [
          "monthly"
        ]
      }
    },
    {
      "id": "undercut",
      "name": "Undercut + design",
      "service": "skin-fade",
      "image": "https://images.unsplash.com/photo-1568339434343-2a640a1a9946",
      "alt": "Back view of a slicked-back undercut with a razor-cut line design above the ear",
      "summary": "Disconnected short sides with length left on top and a custom razor design.",
      "askFor": "A disconnected undercut at #1, a razor-line design on the side, and length on top to slick back.",
      "maintenance": 3,
      "upkeep": "every 2–3 weeks",
      "styling": "5 min",
      "product": "Water-based pomade",
      "match": {
        "hair": [
          "straight",
          "wavy"
        ],
        "effort": [
          "medium"
        ],
        "vibe": [
          "bold"
        ],
        "visits": [
          "often"
        ]
      }
    },
    {
      "id": "natural-flow",
      "name": "Natural flow",
      "service": "signature",
      "image": "https://images.unsplash.com/photo-1621095346111-a25f48b39b66",
      "alt": "Man outdoors with medium-length, wavy textured hair pushed loosely back",
      "summary": "Medium length, scissor cut, built to grow out well. For people who want to go longer between visits.",
      "askFor": "A scissor cut all over, keep it 3–4 inches, remove bulk but keep the wave.",
      "maintenance": 1,
      "upkeep": "every 6–8 weeks",
      "styling": "None",
      "product": "Leave-in conditioner",
      "match": {
        "hair": [
          "wavy",
          "curly"
        ],
        "effort": [
          "low"
        ],
        "vibe": [
          "natural"
        ],
        "visits": [
          "rarely"
        ]
      }
    },
    {
      "id": "fade-beard",
      "name": "Fade + full beard",
      "service": "cut-beard",
      "image": "https://images.unsplash.com/photo-1630827020718-3433092696e7",
      "alt": "Side profile of a man with a faded haircut blending into a thick, sharply lined full beard",
      "summary": "A fade that flows straight into a full, sculpted beard. Sharp lines, one seamless shape.",
      "askFor": "Fade the sides into the beard, a sharp cheek and neck line, and keep the beard full at the chin.",
      "maintenance": 3,
      "upkeep": "every 2–3 weeks",
      "styling": "5 min",
      "product": "Beard oil + balm",
      "match": {
        "hair": [
          "straight",
          "wavy",
          "curly",
          "coily"
        ],
        "effort": [
          "medium"
        ],
        "vibe": [
          "sharp",
          "bold"
        ],
        "visits": [
          "often"
        ]
      }
    }
  ],
  "galleryCategories": {
    "fade": "Fades",
    "classic": "Classic",
    "beard": "Beards",
    "creative": "Creative"
  },
  "gallery": [
    {
      "src": "https://images.unsplash.com/photo-1648221122323-572c13a31663",
      "category": "fade",
      "caption": "Mid fade in progress",
      "alt": "Barber blending a mid fade with clippers on a client with light brown hair"
    },
    {
      "src": "https://images.unsplash.com/photo-1633601851802-ad8eb2bcf1f4",
      "category": "fade",
      "caption": "Drop fade + beard",
      "alt": "Side view of a man with a faded haircut and a full trimmed beard, wearing a checked shirt"
    },
    {
      "src": "https://images.unsplash.com/photo-1672642150228-3fcd5826ec26",
      "category": "fade",
      "caption": "Clipper detail",
      "alt": "Close-up of clippers tidying the hairline on a client with thick dark hair"
    },
    {
      "src": "https://images.unsplash.com/photo-1599834562135-b6fc90e642ca",
      "category": "classic",
      "caption": "Short & tidy",
      "alt": "Man with a short, neat haircut and a trimmed beard"
    },
    {
      "src": "https://images.unsplash.com/photo-1647140655214-e4a2d914971f",
      "category": "classic",
      "caption": "Scissor work",
      "alt": "Barber cutting a client's hair with scissors and a comb"
    },
    {
      "src": "https://images.unsplash.com/photo-1578390432942-d323db577792",
      "category": "classic",
      "caption": "Swept top",
      "alt": "Black-and-white portrait of a young man with a swept-over top and short sides"
    },
    {
      "src": "https://images.unsplash.com/photo-1599011176306-4a96f1516d4d",
      "category": "beard",
      "caption": "Beard shaping",
      "alt": "Barber trimming a client's beard with scissors"
    },
    {
      "src": "https://images.unsplash.com/photo-1517832606299-7ae9b720a186",
      "category": "beard",
      "caption": "Scissor-over-comb beard",
      "alt": "Black-and-white photo of a barber trimming a beard with scissors"
    },
    {
      "src": "https://images.unsplash.com/photo-1587776535733-b4c80a99ef82",
      "category": "beard",
      "caption": "Textured top + beard",
      "alt": "Man with a textured, messy top and a full beard"
    },
    {
      "src": "https://images.unsplash.com/photo-1599351431202-1e0f0137899a",
      "category": "creative",
      "caption": "Razor design",
      "alt": "Tattooed barber carving a line design into the side of a client's fade with a straight razor"
    },
    {
      "src": "https://images.unsplash.com/photo-1695662917617-a1bfc0e2fbed",
      "category": "creative",
      "caption": "Mohawk undercut",
      "alt": "Black-and-white photo of a man in sunglasses with a tall mohawk and shaved sides"
    },
    {
      "src": "https://images.unsplash.com/photo-1635273051839-003bf06a8751",
      "category": "fade",
      "caption": "Taper in progress",
      "alt": "Close-up of a barber's hands tapering the back of a client's head with clippers"
    }
  ],
  "reviews": [
    {
      "name": "Marcus T.",
      "rating": 5,
      "text": "Followed Lucas across two shops now. Best fade I've had in this city, and they actually listen."
    },
    {
      "name": "Andre L.",
      "rating": 5,
      "text": "First barber who knew what to do with my curls. Left with a shape that still looks good three weeks later."
    },
    {
      "name": "Priya S.",
      "rating": 5,
      "text": "Took my son for his first cut. Lucas was patient, funny and made it easy. We're regulars now."
    }
  ]
};
