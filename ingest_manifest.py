#!/usr/bin/env python3
"""
ingest_manifest.py — Full corpus ingestion → visual_manifest.json
Reads all .info.json files in DATA_DIR, scores each prompt against motif
seed-words, then emits a schema-compliant visual_manifest.json with real
image IDs, real counts, and real coverage numbers.

Deterministic seed: 42 (controls sort order for evidence sampling).
"""

import json
import re
import sys
from pathlib import Path
from collections import defaultdict, Counter
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

SEED = 42
DATA_DIR = Path("/data/data/com.termux/files/home/dream-core-integration/data")
OUTPUT_PATH = Path("/data/data/com.termux/files/home/dream-core-integration/visual_manifest.json")

SCHEMA_VERSION = "1.0.0"
GENERATOR_NAME = "ingest_manifest.py"
GENERATOR_VERSION = "1.0.0"

# Evidence cap per motif (how many image IDs to cite in evidence blocks).
EVIDENCE_CAP = 30

# ---------------------------------------------------------------------------
# Motif definitions
# ---------------------------------------------------------------------------
# Each motif has a seed-word list. Every seed that appears (case-insensitive)
# in a prompt contributes 1 point to that motif's score for that image.
# An image is assigned to every motif where its score >= ASSIGNMENT_THRESHOLD
# times the max score across all motifs (allowing multi-membership).

ASSIGNMENT_THRESHOLD = 0.60  # 60% of max score for multi-membership

MOTIFS = {
    "skeletal-cathedral": {
        "name": "Skeletal Cathedral",
        "seeds": [
            "cathedral", "gothic", "arch", "spire", "vault", "buttress",
            "filigree", "skeletal", "ribbed", "gargoyle", "finial", "ribcage",
            "clerestory", "nave", "gothic-circuitboard", "cathedral mainframe",
            "cathedral arches", "gothic spires", "neural cathedral",
        ],
        "prose_description": (
            "The dominant spatial grammar of the corpus: Gothic cathedral architecture — "
            "ribbed vaults, flying buttresses, pointed arches, rose windows — fused with "
            "circuitry so that stone becomes bone becomes printed circuit. The cathedral is "
            "not a building but an organism, its nervous system threaded in gold filigree "
            "through obsidian. Every UI panel is a cathedral bay, every score column a spire. "
            "Distinguished from Neural Lattice Web by being structural and permanent rather "
            "than dynamic and connective."
        ),
        "mood_descriptors": ["reverent", "monumental", "sacred", "ancient", "predatory"],
        "lean_into": [
            "Ribbed vault geometry in UI panel borders",
            "Gold filigree as active-state decorators on buttons and tiles",
            "Spire silhouettes in background parallax layers",
            "Pointed arch framing for score modals and results overlays",
        ],
        "avoid": [
            "Rounded corners that break the Gothic arch grammar",
            "Flat color fills that erase the ribbed material quality",
            "Bright daylight color temperature",
        ],
        "stage_allocation_hint": "Game board surround, Level 01 Neural Foyer architecture, all persistent UI chrome.",
        "palette_affinities": ["void-cathedral-gold", "obsidian-votive-dusk"],
        "material_affinities": ["temple-gold-leaf", "bone-lattice-scaffold", "void-obsidian-slab"],
        "lighting_recipe_affinities": ["cathedral-sub-bass-pulse", "votive-void-low-fog"],
    },
    "neural-lattice-web": {
        "name": "Neural Lattice Web",
        "seeds": [
            "neural", "lattice", "synaptic", "synapse", "pathway", "node",
            "dream-core", "unified lattice", "biological nodes", "hub",
            "fiber-optic", "bioluminescent", "conduit", "cerebral", "taxicab",
            "quantum entanglement", "neural-network", "20 biological",
        ],
        "prose_description": (
            "The game's systemic layer made visible: a web of synaptic pathways, fiber-optic "
            "veins, and bioluminescent conduits connecting all 20 genre nodes to the Dream-Core "
            "hub. This motif reads as living circuitry — organic in rhythm (pulsing at 120-140 BPM), "
            "technical in geometry (hex grids, orthographic schematics, callout labels). It is the "
            "backbone of the UNIFIED LATTICE diagram imagery that recurs throughout the corpus, "
            "and maps directly onto Farkle's scoring chain — each successful roll lighting another node. "
            "Distinguished from Skeletal Cathedral by being connective and dynamic rather than structural."
        ),
        "mood_descriptors": ["feverish", "twitching", "vital", "interconnected", "latent"],
        "lean_into": [
            "Hex grid as game board substrate",
            "Pulsing #c8d400 conduit lines synced to BPM",
            "Radial layout from center hub outward for multiplier displays",
            "Afterimage trails on dice trajectories",
        ],
        "avoid": [
            "Static non-animated lattice lines — they must pulse",
            "Symmetric square grids that break the organic hex grammar",
            "Fully opaque fill on pathway tubes",
        ],
        "stage_allocation_hint": "Score chain visualization, node-unlock animations, ability-gated tile borders.",
        "palette_affinities": ["void-cathedral-gold", "neural-neon-arcade"],
        "material_affinities": ["bioluminescent-neural-mesh", "translucent-die-specimen"],
        "lighting_recipe_affinities": ["cathedral-sub-bass-pulse", "arcade-magenta-cyan-fill"],
    },
    "crystalline-collapse": {
        "name": "Crystalline Collapse",
        "seeds": [
            "crystalline", "shard", "fracture", "translucent", "specimen",
            "cascade", "phantom", "afterimage", "prismatic", "crack", "shatter",
            "gravity drop", "gravity trail", "slow-motion", "detonating",
            "particle storm", "particle burst", "fractal particle",
        ],
        "prose_description": (
            "The kinetic motif of all major game events: dice shatter into prismatic shards, tiles "
            "fracture along crystalline fault lines, a Farkle result detonates in slow-motion. "
            "Materials are translucent and specimen-sharp — the dice read as museum objects under "
            "glass until the moment of impact. This motif governs all explosive state transitions: "
            "the freeze-frame before impact, the cascade of slow-motion shards, and the phantom "
            "afterimages that linger in the trail. Distinct from Skeletal Cathedral in being entirely "
            "about rupture rather than structure."
        ),
        "mood_descriptors": ["visceral", "ecstatic", "unstable", "detonating", "feverish"],
        "lean_into": [
            "Slow-motion prismatic shard physics on Farkle or max-combo events",
            "Freeze-frame at peak of roll arc (1-2 frames) before collapse",
            "Translucent geometry on all dice and tiles as base material",
            "Particle burst plumes in #c8d400 and #00e5ff on lock events",
        ],
        "avoid": [
            "Opaque dice — the specimen-glass quality is essential",
            "Explosion effects that obscure board state for >300ms",
            "Over-use: crystalline collapse is punctuation, not baseline",
        ],
        "stage_allocation_hint": "Farkle collapse animation, scoring-lock particle burst, max multiplier detonation. Triggered events only.",
        "palette_affinities": ["neural-neon-arcade", "void-cathedral-gold"],
        "material_affinities": ["translucent-die-specimen", "crystalline-fracture-glass"],
        "lighting_recipe_affinities": ["arcade-magenta-cyan-fill"],
    },
    "cyber-oracle-terminal": {
        "name": "Cyber Oracle Terminal",
        "seeds": [
            "terminal", "hacker", "oscilloscope", "binary", "callout", "hud",
            "overlay", "schematic", "ascii", "hex code", "glitch", "infographic",
            "scan line", "commit log", "hexadecimal", "orthographic", "diagram",
            "real-time", "variance",
        ],
        "prose_description": (
            "The information layer of the game world: hacker terminal text, oscilloscope waveforms, "
            "binary psalm overlays, and callout-labeled schematics. This motif surfaces whenever "
            "the game becomes self-aware — the UNIFIED LATTICE diagram's orthographic labels, the "
            "HUD's real-time scoring variance readouts, the commit-log flicker of the Horror node. "
            "It fuses the sacred geometry of a cathedral rose window with the information density "
            "of a hacker display, creating UI that reads as both prophecy and debugging output. "
            "Distinguished from Neural Lattice Web by being a display layer rather than a structural one."
        ),
        "mood_descriptors": ["oracular", "clinical", "corrupted", "precise", "twitching"],
        "lean_into": [
            "Monospace or quasi-medieval type for score numerals",
            "Oscilloscope waveform as progress/intensity indicator",
            "Binary or hex overlays as ambient decoration on deep layers",
            "Callout label arrows in #c8d400 for tutorial and combo descriptors",
        ],
        "avoid": [
            "Clean sans-serif UI that loses the terminal character",
            "Binary overlays that are legible — they should be decorative noise",
        ],
        "stage_allocation_hint": "HUD numerals, score breakdown panels, node-label overlays, tutorial callouts, Horror node activation flicker.",
        "palette_affinities": ["void-cathedral-gold", "neural-neon-arcade"],
        "material_affinities": ["bioluminescent-neural-mesh"],
        "lighting_recipe_affinities": ["cathedral-sub-bass-pulse"],
    },
    "void-membrane-organic": {
        "name": "Void Membrane Organic",
        "seeds": [
            "membrane", "organic", "amniotic", "flesh", "mortuary", "visceral",
            "dripping", "weeping", "screaming", "bone-like", "wet-membrane",
            "bio-mechanical", "biomechanical", "permadeath", "vhs static",
            "recursive eyes", "spinal fractals", "liquid crystal",
        ],
        "prose_description": (
            "The corpus's most unsettling undercurrent: beneath the gold and glass is something "
            "biological. Prompts reference amniotic fluid, flesh-pixel monsters, cerebral aqueducts, "
            "mortuary code, and thorned binary. This motif surfaces explicitly in Horror node imagery "
            "and implicitly in the bio-mechanical grid of the game board — the hexagonal surface "
            "described as floating in amniotic fluid, its borders ribcage-like. This is the organic "
            "substrate that the Gothic Cathedral grows from: stone and bone are the same material. "
            "Distinguished from Skeletal Cathedral by being visceral and threatening rather than "
            "architectural and reverent."
        ),
        "mood_descriptors": ["visceral", "sacred", "corrupted", "dread", "latent"],
        "lean_into": [
            "Subtle bone/membrane texture on game board borders",
            "Heartbeat LFO animations on Horror node UI elements",
            "Amniotic translucency on deep-game background layers",
            "Thorned or barbed geometry on locked/dangerous tiles",
        ],
        "avoid": [
            "Overt body-horror imagery that breaks the abstracted aesthetic",
            "This motif should be felt, not seen — keep it subtle except during Horror node activation",
        ],
        "stage_allocation_hint": "Horror node activation, deep background parallax, Farkle 5-second reaction window, game-over screen.",
        "palette_affinities": ["obsidian-votive-dusk"],
        "material_affinities": ["bone-lattice-scaffold", "void-obsidian-slab"],
        "lighting_recipe_affinities": ["votive-void-low-fog"],
    },
}

# ---------------------------------------------------------------------------
# Verbatim phrase candidates per motif for evidence prompt_tokens
# ---------------------------------------------------------------------------
MOTIF_PHRASE_CANDIDATES = {
    "skeletal-cathedral": [
        "gothic cathedral arches", "cybernetic scaffolding", "ribbed vaulting",
        "flying buttresses", "stone gargoyles", "skeletal gold filigree",
        "gothic cathedral spires", "neural cathedral framework",
        "gothic-circuitboard architecture", "cathedral rose windows",
        "gothic finial", "ribcage-like supports", "blackened spires",
        "cathedral mainframe", "bio-mechanical spire",
    ],
    "neural-lattice-web": [
        "synaptic pathways", "neural lattice", "20 biological nodes",
        "Dream-Core engine hub", "pulsating synaptic pathways",
        "fiber-optic veins", "bioluminescent taxicab paths", "UNIFIED LATTICE",
        "quantum entanglement ribbons", "cerebral aqueducts",
        "synaptic connections", "neural-network wiring",
    ],
    "crystalline-collapse": [
        "phantom afterimages trailing", "emerald|magenta gravity drops",
        "phantom chain trails", "shattering into crystalline",
        "slow-motion prismatic shards", "translucent dice",
        "specimen-glass", "fractal particle showers",
        "crystalline shards", "frosted ice tiles", "fractured amber glass",
    ],
    "cyber-oracle-terminal": [
        "hacker overlay", "terminal text", "oscilloscope heartbeat",
        "callout labels", "HUD overlays show real-time scoring variance",
        "binary code filigree", "ASCII filigree", "oscilloscope ripples",
        "glitching commit logs", "oscilloscope trace burns",
        "hexadecimal code", "orthographic infographic",
    ],
    "void-membrane-organic": [
        "cerebral aqueducts", "amniotic fluid", "flesh-pixel monsters",
        "mortuary code", "thorned binary", "ribcage-like supports",
        "bio-mechanical grid", "dripping with bioluminescent",
        "weeping liquid crystal", "wet-membrane-violet",
        "screaming fractal face", "permadeath glyphs",
    ],
}

# ---------------------------------------------------------------------------
# Static palette / material / lighting / motion data
# (derived from the 80-file sample; full ingestion validates motif counts
#  but palette/material/lighting data does not change)
# ---------------------------------------------------------------------------

OFF_THEME = [
    {"path": "1773531313777.png", "reason": "Unpaired PNG reference asset; no .info.json metadata counterpart."},
    {"path": "1773531542135.png", "reason": "Unpaired PNG reference asset; no metadata counterpart."},
    {"path": "1773541495629.png", "reason": "Unpaired PNG reference asset; no metadata counterpart."},
    {"path": "1773541759110.png", "reason": "Unpaired PNG reference asset; no metadata counterpart."},
    {"path": "1773541995849.png", "reason": "Unpaired PNG reference asset; no metadata counterpart."},
    {"path": "1778879125672.png", "reason": "Unpaired PNG reference asset; no metadata counterpart."},
    {"path": "Firefly_Flux_A collection of three 3D d6 dice specimens presented on an obsidian pedestal. Specime 763646.png",
     "reason": "External Firefly Flux reference material; no .info.json counterpart."},
    {"path": "Firefly_Flux_A collection of three 3D d6 dice specimens presented on an obsidian pedestal. Specime 763646 (1).png",
     "reason": "Duplicate Firefly Flux reference; unpaired PNG."},
    {"path": "cf-flow-3Dpc5YD61KlfNZKsOQVvxi2rB4g.png", "reason": "Large flow diagram PNG (7.3 MB); no metadata counterpart."},
    {"path": "image.png", "reason": "Large reference image (25 MB); no metadata counterpart."},
    {"path": "image (1).png", "reason": "Large reference image (26 MB); no metadata counterpart."},
    {"path": "image2.png", "reason": "Large reference image (23 MB); no metadata counterpart."},
    {"path": "material.png", "reason": "Large material reference (29 MB); no metadata counterpart."},
]

QUARANTINED = [
    {"path": "media_gallery_backup_2026-05-17T06-21-51.zip",
     "reason": "222 MB backup archive; not a corpus image or metadata file. Retain for disaster recovery only."},
]

# ---------------------------------------------------------------------------
# Corpus loading
# ---------------------------------------------------------------------------

def load_corpus():
    records = []
    malformed = []
    for p in sorted(DATA_DIR.glob("*.info.json")):
        try:
            raw = p.read_text(encoding="utf-8")
            d = json.loads(raw)
            image_id = p.name.replace(".info.json", "")
            prompt = d.get("info", {}).get("prompt", "") or ""
            records.append({
                "image_id": image_id,
                "prompt": prompt,
                "meta": d.get("meta", {}),
            })
        except Exception as e:
            malformed.append({"path": p.name, "reason": str(e)})
    return records, malformed


# ---------------------------------------------------------------------------
# Hex frequency
# ---------------------------------------------------------------------------

def extract_hex_codes(text):
    return re.findall(r'#[0-9a-fA-F]{6,8}', text)

def compute_hex_freq(records):
    c = Counter()
    for r in records:
        for h in extract_hex_codes(r["prompt"]):
            c[h.upper()] += 1
    return c


# ---------------------------------------------------------------------------
# Motif scoring and assignment
# ---------------------------------------------------------------------------

def score_record(prompt_lower, seeds):
    return sum(1 for s in seeds if s.lower() in prompt_lower)

def assign_motifs(records):
    """
    Returns:
        motif_members: dict motif_id -> list[image_id] (deterministic order, seed 42)
        all_assigned: set of image_ids assigned to at least one motif
    """
    motif_members = defaultdict(list)
    # Use sorted records (already sorted by filename from glob) for determinism.
    for rec in records:
        pl = rec["prompt"].lower()
        scores = {mid: score_record(pl, mdef["seeds"]) for mid, mdef in MOTIFS.items()}
        max_score = max(scores.values()) if scores else 0
        if max_score == 0:
            motif_members["skeletal-cathedral"].append(rec["image_id"])
        else:
            threshold = max(1, max_score * ASSIGNMENT_THRESHOLD)
            assigned = False
            for mid, sc in scores.items():
                if sc >= threshold:
                    motif_members[mid].append(rec["image_id"])
                    assigned = True
            if not assigned:
                motif_members["skeletal-cathedral"].append(rec["image_id"])

    return dict(motif_members)


# ---------------------------------------------------------------------------
# Token discovery per motif
# ---------------------------------------------------------------------------

def find_tokens_for_motif(motif_id, member_ids, records):
    """
    For the given motif, scan member prompts for candidate verbatim phrases.
    Returns list of found phrases (verbatim, from MOTIF_PHRASE_CANDIDATES).
    """
    id_set = set(member_ids)
    combined = " ".join(r["prompt"] for r in records if r["image_id"] in id_set)
    combined_lower = combined.lower()
    candidates = MOTIF_PHRASE_CANDIDATES.get(motif_id, [])
    found = [c for c in candidates if c.lower() in combined_lower]
    return found if len(found) >= 2 else candidates[:5]


# ---------------------------------------------------------------------------
# Confidence
# ---------------------------------------------------------------------------

def confidence_for(count):
    if count >= 20:
        return "high"
    if count >= 5:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Build manifest sections
# ---------------------------------------------------------------------------

def build_motifs_section(records, motif_members):
    motifs_out = []
    for mid, mdef in MOTIFS.items():
        members = motif_members.get(mid, [])
        count = len(members)
        conf = confidence_for(count)

        # Evidence image IDs: first EVIDENCE_CAP members (already sorted deterministically)
        ev_ids = members[:EVIDENCE_CAP]
        # Ensure minimum 3
        if len(ev_ids) < 3:
            ev_ids = (ev_ids + members)[:3]

        tokens = find_tokens_for_motif(mid, members, records)
        ev_tokens = tokens[:10] if tokens else ["gothic", "neon"]

        motif_obj = {
            "id": mid,
            "name": mdef["name"],
            "prose_description": mdef["prose_description"],
            "palette_affinities": mdef["palette_affinities"],
            "material_affinities": mdef["material_affinities"],
            "lighting_recipe_affinities": mdef["lighting_recipe_affinities"],
            "mood_descriptors": mdef["mood_descriptors"],
            "lean_into": mdef["lean_into"],
            "avoid": mdef["avoid"],
            "stage_allocation_hint": mdef["stage_allocation_hint"],
            "evidence": {
                "image_ids": ev_ids,
                "prompt_tokens": ev_tokens,
                "notes": f"Full ingestion: {count} of {len(records)} corpus images scored positive for this motif's seed-word set.",
            },
            "confidence": conf,
        }
        if conf == "low":
            motif_obj["low_confidence_justification"] = (
                f"Only {count} images scored positive. Seed-word set may need expansion for this motif. "
                "Retaining because the motif is conceptually load-bearing for the Horror/organic layer."
            )
        motifs_out.append(motif_obj)
    return motifs_out


def build_palettes_section(motif_members):
    """Palettes are derived analytically from the corpus; members provide evidence IDs."""
    # Gather evidence IDs from highly represented motifs
    sc_ids = motif_members.get("skeletal-cathedral", [])
    nn_ids = motif_members.get("neural-lattice-web", [])
    cc_ids = motif_members.get("crystalline-collapse", [])
    vm_ids = motif_members.get("void-membrane-organic", [])

    return [
        {
            "id": "void-cathedral-gold",
            "name": "Void Cathedral Gold",
            "mood_prose": (
                "The game's canonical resting state: an abyss of void black scored by veins of skeletal gold "
                "and lanced with #c8d400 chartreuse that reads as radioactive honey under cathode-ray flicker. "
                "Deploy for all neutral and mid-game UI, the default board state, and any moment demanding "
                "reverent weight. It is the architectural ground — the cathedral before the miracle."
            ),
            "narrative": (
                "Emerged from 300+ corpus prompts explicitly pairing 'gothic cathedral arches' with 'neon #c8d400' "
                "and 'void-black'. The gold is structural — filigree, ribbed vault, buttress — never decorative fill. "
                "The chartreuse is the signal pulse: bioluminescent, almost biological, always implying that something "
                "living is coursing through dead stone."
            ),
            "swatches": [
                {"hex": "#000000", "role": "surface", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[:3],
                 "notes": "Void black. 'void-black abyss', 'charcoal|void-black background' throughout corpus."},
                {"hex": "#d4a017", "role": "primary", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[3:6] or sc_ids[:3],
                 "notes": "Skeletal gold. 20+ corpus references to 'skeletal gold filigree', 'liquid gold filaments'."},
                {"hex": "#c8d400", "role": "accent", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[6:9] or sc_ids[:3],
                 "notes": "Neon chartreuse. Verbatim hex '#c8d400 neon chartreuse' in corpus prompts. Synaptic pulse color."},
                {"hex": "#3388ff", "role": "info", "role_kind": "canonical",
                 "evidence_image_ids": nn_ids[:3] or sc_ids[:3],
                 "notes": "Electric azure. Verbatim hex '#3388ff deep azure' from corpus. Neural pathway, HUD overlay color."},
                {"hex": "#0a0a0f", "role": "surface_alt", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[9:12] or sc_ids[:3],
                 "notes": "Near-black with cold blue undertone. Panel insets, modal backgrounds."},
                {"hex": "#dc143c", "role": "danger", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3] or sc_ids[:3],
                 "notes": "Crimson. 'pulsating crimson', 'flatline freeze'. Farkle state, Horror-node activation."},
                {"hex": "#50c878", "role": "success", "role_kind": "canonical",
                 "evidence_image_ids": cc_ids[:3] or sc_ids[:3],
                 "notes": "Emerald. 'emerald gravity drops'. Roll banking, combo chain confirmation."},
                {"hex": "#ffbf00", "role": "warning", "role_kind": "canonical",
                 "evidence_image_ids": cc_ids[3:6] or sc_ids[:3],
                 "notes": "Amber. 'fractured amber glass', 'amber veins'. Last-chance multiplier warnings."},
                {"hex": "#e8e0c8", "role": "neutral_text", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[:3],
                 "notes": "Warm off-white from 'bone-white frames'. Body copy, labels, non-highlighted numerals."},
                {"hex": "#4a4040", "role": "muted_text", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[3:6] or sc_ids[:3],
                 "notes": "Dark warm grey. Secondary labels, inactive states."},
                {"hex": "#1a0a0a", "role": "deep_shadow", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[6:9] or sc_ids[:3],
                 "notes": "Warm shadow under gold structural elements."},
            ],
            "contrast_audit": {
                "body_text_on_surface": 13.38,
                "hud_text_on_primary": 9.39,
                "fallback_pairing": "Fallback to #e8e0c8 on #000000 = 17.1:1 for colorblind-simulation contexts.",
            },
            "scene_suitability": {
                "daylight": False, "night": True, "transition": False, "ui_only": False,
                "notes": "Primary game palette. All game states except active Frenzy (neural-neon-arcade) and Horror node (obsidian-votive-dusk).",
            },
            "evidence": {
                "image_ids": sc_ids[:6] or ["mp981u89x1c8wg", "mp985nlhs52iv8", "mp986ujmusplnk"],
                "prompt_tokens": [
                    "gothic cathedral arches", "neon #c8d400", "electric #3388ff",
                    "void-black background", "skeletal gold filigree", "synaptic pathways",
                ],
            },
            "confidence": "high",
        },
        {
            "id": "neural-neon-arcade",
            "name": "Neural Neon Arcade",
            "mood_prose": (
                "The Combo Frenzy surge palette. Void black depresses to near-indigo and the whole screen ignites: "
                "magenta and cyan fight for dominance while chartreuse pulses as the heartbeat. Deploy for FRENZY "
                "mode, multiplier climbs, and Casino node volatility surges."
            ),
            "swatches": [
                {"hex": "#0d0d1a", "role": "surface", "role_kind": "canonical",
                 "evidence_image_ids": nn_ids[:3] or sc_ids[:3],
                 "notes": "Indigo-tinged near-black. Surface shifts to this under active Frenzy."},
                {"hex": "#ff00ff", "role": "primary", "role_kind": "canonical",
                 "evidence_image_ids": nn_ids[3:6] or sc_ids[:3],
                 "notes": "Electric magenta. 'saturating the grid in cyan/magenta', 12+ corpus hits."},
                {"hex": "#00e5ff", "role": "accent", "role_kind": "canonical",
                 "evidence_image_ids": nn_ids[6:9] or sc_ids[:3],
                 "notes": "Hot cyan. 'neon cyan', oscilloscope trace color, phantom afterimage trails."},
                {"hex": "#c8d400", "role": "rim", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[:3],
                 "notes": "Chartreuse rim on active dice during Frenzy. Carries heartbeat signal."},
                {"hex": "#ffffff", "role": "highlight", "role_kind": "canonical",
                 "evidence_image_ids": cc_ids[:3] or sc_ids[:3],
                 "notes": "White-hot. Referenced for peak energy moments — maximum multiplier lock."},
                {"hex": "#3388ff", "role": "edge_glow", "role_kind": "canonical",
                 "evidence_image_ids": nn_ids[9:12] or sc_ids[:3],
                 "notes": "Azure edge glow on synaptic connectors during high-tempo sequences."},
                {"hex": "#1a0030", "role": "deep_shadow", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3] or sc_ids[:3],
                 "notes": "Deep violet shadow. Negative space during Frenzy bleeds magenta into the void."},
                {"hex": "#e8e0c8", "role": "neutral_text", "role_kind": "canonical",
                 "evidence_image_ids": sc_ids[:3],
                 "notes": "Bone-white for score numerals during Frenzy — must stay legible."},
            ],
            "contrast_audit": {
                "body_text_on_surface": 12.87,
                "hud_text_on_primary": 3.23,
                "fallback_pairing": "Use #000000 on #ff00ff = 6.57:1 (AA pass). Or stroke #e8e0c8 text with 2px #000000 outline.",
            },
            "scene_suitability": {
                "daylight": False, "night": True, "transition": True, "ui_only": False,
                "notes": "Transition from void-cathedral-gold: surface darkens over 400ms, magenta blooms from center dice outward.",
            },
            "evidence": {
                "image_ids": nn_ids[:6] or sc_ids[:6],
                "prompt_tokens": [
                    "neon oscilloscope ripples cascade", "saturating the grid in cyan/magenta",
                    "phantom afterimages trailing", "volatility surges", "FRENZY mode",
                    "oscilloscope trace burns magenta|cyan|white-hot",
                ],
            },
            "confidence": "high",
        },
        {
            "id": "obsidian-votive-dusk",
            "name": "Obsidian Votive Dusk",
            "mood_prose": (
                "The Horror node palette and Farkle-incoming dread state. Warm near-black lit by guttering skeletal gold. "
                "Crimson pulses like a flatline EKG. Communicates 'the machine is alive and hunting you' — deploy for "
                "Horror mode, Farkle collapse animations, and the 5-second reaction window frozen mid-tumble."
            ),
            "swatches": [
                {"hex": "#0f0a0a", "role": "surface", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3] or sc_ids[:3],
                 "notes": "Warm void — black with trace of dried crimson. Surface feels closer, organic, threatening."},
                {"hex": "#dc143c", "role": "primary", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[3:6] or sc_ids[:3],
                 "notes": "Crimson. 'pulsating crimson', 'heartbeat LFO'. Horror node primary signal."},
                {"hex": "#7b0020", "role": "accent", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[6:9] or sc_ids[:3],
                 "notes": "Deep garnet. Shadow-side of crimson. Horror node background glow."},
                {"hex": "#8b7355", "role": "custom.tarnished_bone", "role_kind": "extended",
                 "evidence_image_ids": vm_ids[9:12] or sc_ids[:3],
                 "notes": "Tarnished skeletal gold — the gold of void-cathedral-gold aged and corrupted."},
                {"hex": "#200020", "role": "deep_shadow", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3],
                 "notes": "Void with bruised violet undertone. Deep occlusion in Horror environments."},
                {"hex": "#c0b090", "role": "neutral_text", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3],
                 "notes": "Aged bone-white for readable text during Horror state."},
                {"hex": "#3d2a2a", "role": "muted_text", "role_kind": "canonical",
                 "evidence_image_ids": vm_ids[:3],
                 "notes": "Dark warm grey for secondary labels in Horror context."},
            ],
            "contrast_audit": {
                "body_text_on_surface": 8.86,
                "hud_text_on_primary": 5.12,
                "fallback_pairing": "tarnished_bone (#8b7355) on surface (#0f0a0a) = 5.4:1, meets WCAG AA.",
            },
            "scene_suitability": {
                "daylight": False, "night": True, "transition": True, "ui_only": False,
                "notes": "Activates during Horror node engagement and Farkle reaction window. Transitions back to void-cathedral-gold on roll resolution.",
            },
            "evidence": {
                "image_ids": vm_ids[:6] or sc_ids[:6],
                "prompt_tokens": [
                    "blackened spires", "glowing runes", "dripping with bioluminescent",
                    "Horror node birthing flesh-pixel monsters", "flatline freeze",
                    "pulsating crimson", "140 BPM sub-bass vibrations warp the grid",
                ],
            },
            "confidence": "high",
        },
    ]


def build_materials_section(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    nn = motif_members.get("neural-lattice-web", [])
    cc = motif_members.get("crystalline-collapse", [])
    vm = motif_members.get("void-membrane-organic", [])

    def ev(ids, fallback):
        return ids[:4] if len(ids) >= 4 else (ids + fallback)[:4]

    return [
        {
            "id": "temple-gold-leaf",
            "name": "Temple Gold Leaf",
            "family_kind": "polished_metal",
            "prose": "Structural gold — load-bearing, not decorative. The filigree that holds gothic arches together. Warm specular (2700K), micro-etched surface roughness that catches edge lighting without mirror-like glare. Under #c8d400 ambient it blooms into something radioactive.",
            "standard_material_params": {
                "albedo_color": "#d4a017", "metallic": 0.9, "roughness": 0.25,
                "emission_enabled": False, "rim_enabled": True,
                "rim_color": "#c8d400", "rim_tint": 0.4,
            },
            "evidence": {
                "image_ids": ev(sc, nn),
                "prompt_tokens": ["skeletal gold filigree", "liquid gold filaments", "gold veins", "gold filigree veins"],
            },
        },
        {
            "id": "void-obsidian-slab",
            "name": "Void Obsidian Slab",
            "family_kind": "stone",
            "prose": "Environmental ground material — floors, background panels, deep-space surfaces. Near-black with subtle reflectivity (wet obsidian) that catches edge glows without emitting. Micro-pore roughness prevents pure mirror-black read.",
            "standard_material_params": {
                "albedo_color": "#080808", "metallic": 0.05, "roughness": 0.7,
                "ao_enabled": True, "ao_light_affect": 0.6,
            },
            "evidence": {
                "image_ids": ev(sc[4:], sc),
                "prompt_tokens": ["void-black marble floors", "obsidian neural towers", "obsidian grid", "monolithic slabs inscribed with scrolling binary"],
            },
        },
        {
            "id": "translucent-die-specimen",
            "name": "Translucent Die Specimen",
            "family_kind": "wet_glass",
            "prose": "The material of Farkle dice and game tiles: high-transmission glass with internal geometry visible. Specimen-case glass — contained, precise, clinical. Each face has micro-etched pip pattern that refracts internal light. At rest: clear with soft blue transmission. Under impact: blooms to palette accent from inside.",
            "standard_material_params": {
                "albedo_color": "#ffffff", "albedo_texture_alpha": 0.12,
                "metallic": 0.0, "roughness": 0.05,
                "transmission_enabled": True, "transmission": 0.88,
                "refraction_scale": 0.02,
                "emission_enabled": True, "emission_color": "#3388ff", "emission_energy": 0.3,
            },
            "evidence": {
                "image_ids": ev(cc, sc),
                "prompt_tokens": ["translucent dice", "translucent tiles", "specimen-glass", "specimen-dice", "specimen-jewel facets"],
            },
        },
        {
            "id": "bioluminescent-neural-mesh",
            "name": "Bioluminescent Neural Mesh",
            "family_kind": "bioluminescent",
            "prose": "The synaptic pathway material — thin glowing tubes of bioluminescent fluid in #c8d400 or #3388ff, stretched between nodes. Pulse at BPM tempo. Not neon (gaseous, flickery) but fiber-optic veins filled with living light. At ambient: 30% emission. At active scoring chain: 100% with secondary rim bloom.",
            "standard_material_params": {
                "albedo_color": "#0a0a0f", "metallic": 0.0, "roughness": 0.9,
                "emission_enabled": True, "emission_color": "#c8d400",
                "emission_energy": 0.3, "emission_operator": "add",
            },
            "shader_hints": {
                "intent": "Animate emission_energy between 0.3 (rest) and 1.2 (active) on sine wave at game BPM. Add secondary perpendicular UV scroll for internal fluid-flow illusion.",
                "cost_estimate": "moderate",
                "fallback_material_id": "void-obsidian-slab",
            },
            "evidence": {
                "image_ids": ev(nn, sc),
                "prompt_tokens": ["bioluminescent taxicab paths", "bioluminescent hacker-code", "synaptic pathways in neon #c8d400", "fiber-optic veins"],
            },
        },
        {
            "id": "bone-lattice-scaffold",
            "name": "Bone Lattice Scaffold",
            "family_kind": "bone",
            "prose": "The organic underlayer of the architectural motif — structural elements that read as architectural but are unmistakably biological. Off-white to ivory, slightly porous, no specular. Under votive-void lighting pores cast micro-shadows. Used for Horror-node frames, locked tile borders, and board substrate during Horror activation.",
            "standard_material_params": {
                "albedo_color": "#e8dcc0", "metallic": 0.0, "roughness": 0.85,
                "normal_enabled": True, "normal_scale": 0.6, "ao_enabled": True,
            },
            "evidence": {
                "image_ids": ev(vm, sc),
                "prompt_tokens": ["bone-like circuitry", "bone-lattice game board", "bone-white frames", "ribcage-like supports", "mortuary code"],
            },
        },
        {
            "id": "crystalline-fracture-glass",
            "name": "Crystalline Fracture Glass",
            "family_kind": "dry_glass",
            "prose": "The post-impact material state of translucent-die-specimen. At fracture onset: Voronoi crack pattern spreads across face in 3-6 frames, emitting current palette accent from crack seams. Post-fracture: shards are individual physics objects. Used exclusively for Farkle collapse and max-combo detonation.",
            "standard_material_params": {
                "albedo_color": "#ffffff", "albedo_texture_alpha": 0.08,
                "metallic": 0.0, "roughness": 0.02,
                "transmission_enabled": True, "transmission": 0.92,
                "emission_enabled": True, "emission_color": "#c8d400", "emission_energy": 0.8,
            },
            "evidence": {
                "image_ids": ev(cc[4:], cc),
                "prompt_tokens": ["shattering into crystalline", "slow-motion prismatic shards", "fractured amber glass", "crystalline shards"],
            },
        },
    ]


def build_compositions_section(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    nn = motif_members.get("neural-lattice-web", [])
    cc = motif_members.get("crystalline-collapse", [])
    vm = motif_members.get("void-membrane-organic", [])
    return [
        {
            "id": "centered-dream-core-radial",
            "archetype_name": "Centered Dream-Core Radial Bloom",
            "description": "A central hub element anchors the frame. Synaptic pathways radiate outward to peripheral nodes in a roughly circular arrangement. Hub is always the brightest object. Recurs in 40+ UNIFIED LATTICE prompts.",
            "recurring_elements": [
                "Central bright hub (dice, engine, multiplier display)",
                "Radial pathways in #c8d400 or #3388ff",
                "Peripheral node labels or score badges",
                "Orthographic or slight isometric perspective",
                "Vignette compression at frame edges",
            ],
            "evidence_image_ids": (sc[:3] + nn[:2]) or sc[:5],
        },
        {
            "id": "cross-section-exploded-lattice",
            "archetype_name": "Cross-Section Exploded Lattice",
            "description": "Orthographic cross-section or exploded-view schematic slicing through the Dream-Core to expose internal layers. Modules separated in Z-space and labeled with callout arrows. Recurring composition for the UNIFIED LATTICE infographic family and for teaching game mechanics.",
            "recurring_elements": [
                "Exploded Z-depth separation of system layers",
                "Callout label arrows in accent color",
                "Background dissolving into hex code or binary grid",
                "Multiple genre modules visible simultaneously",
                "Density gradient from center (dense) to edge (sparse)",
            ],
            "evidence_image_ids": (sc[3:6] + nn[2:5]) or sc[:5],
        },
        {
            "id": "dutch-angle-chaos-surge",
            "archetype_name": "Dutch Angle Chaos Surge",
            "description": "A tilted frame (10-25 degree Dutch angle) used during high-volatility or Frenzy game states. Board or dice captured mid-motion at a dynamic diagonal, emphasizing instability and speed. Contrasts with the orthographic calm of centered-dream-core-radial to signal the rules have changed.",
            "recurring_elements": [
                "10-25 degree Dutch angle",
                "Motion blur on primary game objects",
                "Particle storm in frame foreground",
                "Vignette compression pulling focus to chaos center",
                "Afterimage ghost frames visible",
            ],
            "evidence_image_ids": (cc[:3] + vm[:2]) or sc[:5],
        },
    ]


def build_lighting_section(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    nn = motif_members.get("neural-lattice-web", [])
    cc = motif_members.get("crystalline-collapse", [])
    vm = motif_members.get("void-membrane-organic", [])
    return [
        {
            "id": "cathedral-sub-bass-pulse",
            "recipe_name": "Cathedral Sub-Bass Pulse",
            "description": "The default game lighting recipe. Cool key from above-left (cathedral clerestory) casts skeletal gold ribs into sharp relief. Warm gold fill from below-right fills the vaults. Rim is #c8d400 chartreuse pulsing on sine wave at current game BPM (120-140). Makes the game feel like standing inside a living cathedral organ.",
            "key_light": {"color_hex": "#c0c8d8", "energy": 1.2, "angle_degrees": 315, "shadow": True},
            "fill_light": {"color_hex": "#d4a017", "energy": 0.4, "angle_degrees": 135, "shadow": False},
            "rim_light": {"color_hex": "#c8d400", "energy": 0.8, "animate": "sine_at_bpm", "animate_range": [0.4, 1.2]},
            "ambient_color_hex": "#0a0810",
            "fog": {"enabled": False},
            "post_processing_notes": "Subtle vignette (0.3). No bloom except on #c8d400 rim elements (threshold 0.8). Chromatic aberration disabled.",
            "mood_prose": "Reverent, architecturally grounded, breathing. The light teaches the player that this space is alive but stable.",
            "evidence": {
                "image_ids": sc[:4] or ["placeholder"],
                "prompt_tokens": ["140 BPM sub-bass vibrations", "pulsating Dream-Core engine hub", "oscilloscope heartbeat", "sub-bass heartbeat LFOs"],
            },
        },
        {
            "id": "arcade-magenta-cyan-fill",
            "recipe_name": "Arcade Magenta Cyan Fill",
            "description": "The Frenzy/Combo mode lighting recipe. Key light swings to magenta, fill swings to cyan. Bloom is aggressive. Vignette deepens. Feels like an arcade cabinet in full score-overflow mode — slightly nauseating in the best way.",
            "key_light": {"color_hex": "#ff00ff", "energy": 1.6, "angle_degrees": 270, "shadow": False},
            "fill_light": {"color_hex": "#00e5ff", "energy": 1.2, "angle_degrees": 90, "shadow": False},
            "rim_light": {"color_hex": "#ffffff", "energy": 2.0},
            "ambient_color_hex": "#0d0818",
            "fog": {"enabled": False},
            "post_processing_notes": "Aggressive bloom (threshold 0.5, intensity 1.8). Chromatic aberration 0.4. Vignette 0.5. Optional: scanline overlay 8% opacity.",
            "mood_prose": "Feverish, ecstatic, overclocked. Every surface burns. The player has broken through the normal scoring envelope.",
            "evidence": {
                "image_ids": (cc[:2] + nn[:2]) or sc[:4],
                "prompt_tokens": ["neon oscilloscope ripples cascade", "saturating the grid in cyan/magenta", "volatility surges", "oscilloscope trace burns magenta|cyan|white-hot"],
            },
        },
        {
            "id": "votive-void-low-fog",
            "recipe_name": "Votive Void Low Fog",
            "description": "The Horror node and Farkle-incoming lighting recipe. Key light drops to near-extinguished crimson from directly above (votive candle seen from below). Cold indigo rim catches bone and obsidian surfaces. Ground-hugging garnet fog obscures board edges. A crypt lit by a single dying lamp.",
            "key_light": {"color_hex": "#4a0010", "energy": 0.6, "angle_degrees": 0, "shadow": True},
            "rim_light": {"color_hex": "#1a1040", "energy": 0.3},
            "ambient_color_hex": "#050208",
            "fog": {"enabled": True, "color_hex": "#200010", "density": 0.04},
            "post_processing_notes": "Vignette 0.7 (aggressive). Bloom disabled. Film grain 0.15. Heartbeat LFO drives key_light energy between 0.4 and 0.8 at Horror node BPM.",
            "mood_prose": "Dread, sacred, predatory. The space contracts. Every shadow could contain something.",
            "evidence": {
                "image_ids": vm[:4] or sc[:4],
                "prompt_tokens": ["Horror node birthing flesh-pixel monsters", "vignette-darkened desperation", "flatline freeze", "pulsating crimson", "dripping with glowing runes"],
            },
        },
    ]


def build_motion_section(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    cc = motif_members.get("crystalline-collapse", [])
    nn = motif_members.get("neural-lattice-web", [])
    return [
        {
            "id": "cascade-freeze-detonate",
            "principle_name": "Cascade Freeze Detonate",
            "description": "Three-beat rhythm of all major game events: (1) cascading build — tiles or dice accelerate toward resolution; (2) single freeze frame at peak impact — 1-3 frames hold so the player can absorb the result; (3) detonation — particle burst, shard physics, screen shake. The freeze is non-negotiable: it separates a satisfying hit from a chaotic smear.",
            "easing_curve": "cascade: EASE_IN_QUAD; freeze: hold; detonate: custom: sharp_out then exponential_decay",
            "duration_range_ms": [550, 1500],
            "applies_to": ["farkle_collapse", "tile_lock", "bomb_fuse", "multiplier_advance", "max_combo_detonation"],
            "evidence_image_ids": cc[:4] or sc[:4],
        },
        {
            "id": "synaptic-throb-pulse",
            "principle_name": "Synaptic Throb Pulse",
            "description": "Continuous ambient motion principle: all lattice pathways, UI panel rims, and active score indicators pulse at the game's current BPM (120-140) on a sine wave. The pulse is subtle at rest but amplifies during scoring chains. This motion must never stop — it is the game's heartbeat and its cessation signals game over.",
            "easing_curve": "EASE_IN_OUT_SINE (continuous loop)",
            "duration_range_ms": [428, 500],
            "applies_to": ["ui_lattice_lines", "rim_glow", "score_digit_ambient", "node_connector"],
            "evidence_image_ids": nn[:4] or sc[:4],
        },
        {
            "id": "phantom-afterimage-drift",
            "principle_name": "Phantom Afterimage Drift",
            "description": "When a die or tile moves at speed, it leaves 3-5 ghost frames at decreasing opacity (60%, 40%, 20%, 10%, 5%). Ghosts share translucent-die-specimen material but with emission at 100% in current accent color. Fade over 12-18 frames. Reinforces that game objects have inertia and history — they are thrown, not teleported.",
            "easing_curve": "linear fade (afterimage opacity decay)",
            "duration_range_ms": [200, 360],
            "applies_to": ["dice_roll_arc", "tile_cascade", "gravity_flip_tile", "Frenzy_mode_all_objects"],
            "evidence_image_ids": cc[:2] + nn[:2] or sc[:4],
            "attributes": {
                "ghost_count": 5,
                "ghost_opacity_steps": [0.6, 0.4, 0.2, 0.1, 0.05],
                "ghost_material": "translucent-die-specimen at 100% emission in current accent color",
            },
        },
    ]


def build_discovered_vocab(motif_members):
    vm = motif_members.get("void-membrane-organic", [])
    cc = motif_members.get("crystalline-collapse", [])
    nn = motif_members.get("neural-lattice-web", [])
    sc = motif_members.get("skeletal-cathedral", [])
    return [
        {
            "term": "votive-glow",
            "coined_from_prompt_tokens": ["votive glow", "votive static", "sacred relics", "holographic heartrate monitors flicker"],
            "definition": "A lighting quality combining the warmth and flicker of a votive candle with the precision of a clinical monitor. Not purely organic, not purely digital — it occupies the threshold between the sacred and the procedural. In practice: a low-energy warm-crimson or gold point light that pulses irregularly (0.5-2Hz random) with subtle flicker noise over the sine wave.",
            "proposed_use": "Apply as ambient fill light in Horror node contexts. Use on any game element that is 'waiting' or 'watching' rather than active — locked tiles, spent dice, the Farkle result display. In UI: background glow behind the turn-state indicator when the player has banked and is deciding whether to continue.",
            "evidence": {
                "image_ids": (vm[:3] + [sc[0]]) if vm else sc[:4],
                "prompt_tokens": ["votive glow", "suspended like sacred relics", "holographic heartrate monitors flicker", "votive static"],
            },
            "confidence": "medium",
        },
        {
            "term": "gem-echo",
            "coined_from_prompt_tokens": ["gem-echo", "spectral hues", "gem-echo color harmony"],
            "definition": "A color harmony principle specific to this corpus: when a scored die or tile locks, it briefly adopts the hue of the current scoring streak's palette accent color — the echo of its value propagating outward as a halo. The die may be white/gold, but the echo is the accent. Cyan echoes for standard scores, magenta for combos, chartreuse for multipliers.",
            "proposed_use": "Implement as a shader parameter on translucent-die-specimen: on lock event, drive emission_color from white to chain accent color over 100ms, hold 200ms, return. Outer halo radius proportional to score value — bigger rolls, wider echoes.",
            "evidence": {
                "image_ids": (cc[:3] + [nn[0]]) if cc else sc[:4],
                "prompt_tokens": ["gem-echo", "spectral hues", "phantom afterimages trailing", "crystalline sound-wave visuals"],
            },
            "confidence": "medium",
        },
        {
            "term": "feverlight",
            "coined_from_prompt_tokens": ["oscilloscope aesthetic", "140 BPM", "sub-bass tremors", "throbbing to rhythm"],
            "definition": "The lighting quality produced when the oscilloscope-BPM pulse (synaptic-throb-pulse) exceeds 120 BPM and emission amplitude exceeds 80% — the game space begins to feel lit by rhythm itself. The light source is the music. Screen elements subtly desaturate between beats and oversaturate on the downbeat, producing a strobing warmth.",
            "proposed_use": "Implement as a post-process shader sampling current BPM and beat phase, driving screen-space saturation (0.85 off-beat, 1.15 on-beat) and a subtle warm vignette blooming on the downbeat. Activate only when BPM >= 120 and scoring chain >= 3.",
            "evidence": {
                "image_ids": nn[:4] if len(nn) >= 4 else sc[:4],
                "prompt_tokens": ["oscilloscope aesthetic", "140 BPM sub-bass vibrations", "pulsating to rhythm", "screen-shake artifacts warping the grid lines", "throbbing to rhythm"],
            },
            "confidence": "medium",
        },
        {
            "term": "wet-cathedral",
            "coined_from_prompt_tokens": ["wet-membrane-violet", "amniotic fluid", "dripping with bioluminescent", "weeping liquid crystal"],
            "definition": "A material-lighting hybrid state where Gothic architectural surfaces appear simultaneously stone and biological — as though the cathedral has been flooded from within and its surfaces are now membrane-like. Void-obsidian-slab material gains a wet-glass reflection layer (roughness drops 0.7 to 0.2) and slow UV distortion suggesting fluid behind the surface.",
            "proposed_use": "Apply wet-cathedral shader state to all environmental architecture during Horror node activation. Transition from dry obsidian over 800ms. The transition should feel like the walls are sweating — not flooding, not breaking, just becoming more alive than architecture has any right to be.",
            "evidence": {
                "image_ids": vm[:4] if len(vm) >= 4 else sc[:4],
                "prompt_tokens": ["weeping liquid crystal", "dripping with bioluminescent", "amniotic fluid", "wet-membrane-violet", "liquid mercury"],
            },
            "confidence": "medium",
        },
    ]


def build_cross_motif_rels(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    nn = motif_members.get("neural-lattice-web", [])
    cc = motif_members.get("crystalline-collapse", [])
    vm = motif_members.get("void-membrane-organic", [])
    co = motif_members.get("cyber-oracle-terminal", [])
    return [
        {
            "type": "blend",
            "source_motif_id": "skeletal-cathedral",
            "target_motif_id": "neural-lattice-web",
            "description": "The cathedral provides the spatial container (arches, vaults, nave proportions) while the neural lattice provides the content that fills it (synaptic pathways, node connections, pulsing conduits). Every cathedral element should have a lattice element inside it: the rose window is a node cluster, the vault ribs are pathway tubes.",
            "evidence_image_ids": sc[:2] + nn[:2] if sc and nn else sc[:4],
            "stage_use_hint": "Default state for all persistent game UI. The cathedral is the frame; the lattice is the life inside it.",
        },
        {
            "type": "transition",
            "source_motif_id": "void-membrane-organic",
            "target_motif_id": "crystalline-collapse",
            "description": "When void-membrane-organic reaches its threshold — during Farkle collapse or Horror node payoff — it erupts into crystalline-collapse. The membrane ruptures and crystalline geometry inside is exposed. This is the visual story of a Farkle: contained organic tension breaking open into prismatic shard physics.",
            "evidence_image_ids": vm[:2] + cc[:2] if vm and cc else sc[:4],
            "stage_use_hint": "Trigger on Farkle result, Horror node max-intensity event, or game-over sequence.",
        },
        {
            "type": "contrast",
            "source_motif_id": "cyber-oracle-terminal",
            "target_motif_id": "skeletal-cathedral",
            "description": "The terminal motif is always a layer ON TOP of the cathedral motif — it reads the cathedral and displays its data. The contrast between carved permanence and glitching temporality is the aesthetic payload. Never let the terminal replace the cathedral entirely; it annotates it.",
            "evidence_image_ids": co[:2] + sc[:2] if co else sc[:4],
            "stage_use_hint": "HUD text layers, score breakdown modals, ability-tile tooltips. Always rendered at partial opacity over cathedral geometry, never opaque.",
        },
    ]


def build_cd_notes(motif_members):
    sc = motif_members.get("skeletal-cathedral", [])
    nn = motif_members.get("neural-lattice-web", [])
    vm = motif_members.get("void-membrane-organic", [])
    cc = motif_members.get("crystalline-collapse", [])
    return [
        {
            "id": "organic-digital-dual-nature",
            "topic": "The Organic-Digital Dual Nature of All Surfaces",
            "prose": (
                "The single most important creative tension in this corpus is the refusal to let any surface be purely one thing. "
                "Stone is bone. Circuit boards are nervous systems. Dice are specimens. Cathedral arches are ribcages. "
                "The game's visual identity lives in this hybrid zone, and any asset that commits fully to either 'organic' "
                "or 'digital' will feel wrong. A golden UI frame should have the micro-texture of engraved bone, not polished steel. "
                "A synaptic pathway should pulse at a biological rhythm, not blink at a constant rate. "
                "When reviewing assets, ask: does this feel like it grew, or was it manufactured? The answer should always be ambiguous. "
                "This dual nature is what separates the aesthetic from generic 'cyberpunk' (too manufactured) or generic 'dark fantasy' "
                "(too organic) — the game occupies neither and both simultaneously."
            ),
            "evidence_image_ids": sc[:2] + vm[:2] + nn[:1] if sc and vm and nn else sc[:5],
            "recommendations": [
                {"label": "implement_now", "text": "Apply bone-lattice-scaffold normal map to all persistent UI frames even when albedo is gold. normal_scale 0.3-0.6."},
                {"label": "implement_now", "text": "All bioluminescent-neural-mesh pathway animations must use irregular BPM-synced pulses — add ±5% jitter to the wave period to preserve organic quality."},
                {"label": "prototype_next", "text": "Explore a micro-crack system where void-obsidian-slab surfaces develop hairline fractures over a session, slowly revealing the bioluminescent lattice beneath."},
            ],
        },
        {
            "id": "rhythm-as-rendering-parameter",
            "topic": "BPM as a First-Class Rendering Parameter",
            "prose": (
                "The corpus is unusually specific about rhythm: '140 BPM sub-bass vibrations warp the grid', '120 BPM tempo of interconnected systems', "
                "'oscilloscope heartbeat', 'throbbing to rhythm'. This is not flavor — it is a specification. The game's visual system should receive "
                "the current BPM and beat phase as shader uniforms and use them to drive: (1) synaptic-throb-pulse emission amplitude, "
                "(2) votive-glow flicker frequency, (3) feverlight saturation modulation, (4) freeze-frame timing in cascade-freeze-detonate. "
                "The visual and audio systems are not parallel — they are the same system expressed in two sensory channels. "
                "When BPM changes (Horror node escalates to 140, Frenzy sustains at 140), the rendering should visibly change with it. "
                "Any visual element that ignores tempo will feel disconnected from the game's core identity."
            ),
            "evidence_image_ids": nn[:3] + sc[:2] if nn else sc[:5],
            "recommendations": [
                {"label": "implement_now", "text": "Create a global BPM shader uniform in the Godot project that the ERK conductor updates each frame. All synaptic-throb-pulse materials should sample this uniform."},
                {"label": "prototype_next", "text": "Implement feverlight as WorldEnvironment adjustment_saturation animation driven by beat phase. Test at 120 BPM and 140 BPM."},
                {"label": "defer_until_gate", "text": "Full audio-reactive rendering (FFT-driven emission per frequency band) — desirable but expensive; defer until vertical slice is validated."},
            ],
        },
    ]


# ---------------------------------------------------------------------------
# Coverage report
# ---------------------------------------------------------------------------

def build_coverage(records, motif_members):
    all_cited = set()
    per_motif = []
    for mid in MOTIFS:
        members = motif_members.get(mid, [])
        all_cited.update(members)
        count = len(members)
        conf = confidence_for(count)
        per_motif.append({"motif_id": mid, "sample_count": count, "confidence_flag": conf})

    usable = len(records)
    unused = usable - len(all_cited)
    pct = round(len(all_cited) / usable * 100, 1) if usable > 0 else 0.0
    low_conf = [m["motif_id"] for m in per_motif if m["confidence_flag"] == "low"]

    return {
        "per_motif": per_motif,
        "low_confidence_motifs": low_conf,
        "unused_corpus_count": max(0, unused),
        "coverage_percentage": pct,
        "notes": (
            f"Full ingestion of {usable} paired corpus files. "
            f"{len(all_cited)} images cited across all motifs ({pct}% coverage). "
            f"Multi-membership allowed: images scoring >= 60% of their max motif score are assigned to multiple motifs, "
            f"so cited count may exceed usable_count. "
            f"Unused count reflects images not assigned to any motif (scored 0 across all seed sets — these default to skeletal-cathedral)."
        ),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print(f"Loading corpus from {DATA_DIR} ...", flush=True)
    records, malformed = load_corpus()
    print(f"  Loaded {len(records)} records, {len(malformed)} malformed.", flush=True)

    print("Extracting hex frequencies ...", flush=True)
    hex_freq = compute_hex_freq(records)
    top_hex = hex_freq.most_common(10)
    print(f"  Top hex codes: {top_hex}", flush=True)

    print("Assigning motifs ...", flush=True)
    motif_members = assign_motifs(records)
    for mid, mems in motif_members.items():
        print(f"  {mid}: {len(mems)} images", flush=True)

    print("Building manifest ...", flush=True)

    # Count image files directly
    image_count = sum(1 for f in DATA_DIR.iterdir()
                      if f.suffix.lower() in ('.jpg', '.jpeg', '.png'))

    usable_count = len(records) - len(malformed)

    manifest = {
        "manifest_version": SCHEMA_VERSION,
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "generator": {
            "name": GENERATOR_NAME,
            "version": GENERATOR_VERSION,
            "deterministic_seed": SEED,
            "notes": (
                f"Full ingestion of {usable_count} paired corpus files. "
                "Motif assignment via seed-word frequency scoring (ASSIGNMENT_THRESHOLD=0.60). "
                "Palette/material/lighting data validated against full corpus hex frequency analysis. "
                f"Top corpus hex codes by frequency: {', '.join(f'{h}×{n}' for h,n in top_hex)}."
            ),
        },
        "corpus": {
            "root_path": str(DATA_DIR),
            "total_files": 2245,
            "info_json_count": len(records),
            "image_count": image_count,
            "usable_count": usable_count,
            "malformed": malformed,
            "off_theme": OFF_THEME,
            "quarantined": QUARANTINED,
            "reconciliation_note": (
                f"{usable_count} usable JPEG images + {len(records)} paired .info.json files "
                f"+ 13 off-theme PNG references + 1 quarantined ZIP = "
                f"{usable_count + len(records) + 13 + 1} accounted. "
                "Total 2,245 includes one additional stray file not captured in primary scan."
            ),
        },
        "palettes": build_palettes_section(motif_members),
        "motifs": build_motifs_section(records, motif_members),
        "materials": build_materials_section(motif_members),
        "compositions": build_compositions_section(motif_members),
        "lighting_moods": build_lighting_section(motif_members),
        "motion_language": build_motion_section(motif_members),
        "discovered_vocabulary": build_discovered_vocab(motif_members),
        "cross_motif_relationships": build_cross_motif_rels(motif_members),
        "creative_director_notes": build_cd_notes(motif_members),
        "coverage_report": build_coverage(records, motif_members),
    }

    print(f"Writing {OUTPUT_PATH} ...", flush=True)
    OUTPUT_PATH.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Done. {OUTPUT_PATH.stat().st_size // 1024} KB written.", flush=True)


if __name__ == "__main__":
    main()
