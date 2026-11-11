import type { Experimental_DecisionQuestion } from "ai";

/**
 * The questions Jev answers about the transcript, owned by the Jev lab
 * (public/lab-files/say-the-room/). Every update asks all of them at once.
 *
 * The transcript is someone describing a 1970s living room out loud, and it is
 * often cut off mid-sentence. It may start with a "[Room so far: …]" note, which
 * the page writes when the talk gets long. Every question is about the LATEST
 * intent, so corrections ("actually…", "no wait", "get rid of…") win.
 */

const has = (thing: string, extra = ""): Experimental_DecisionQuestion => ({
  type: "boolean",
  instructions:
    `Someone is describing a room out loud. After everything said so far, is there ${thing} in the room? ` +
    `A later correction or removal beats an earlier request.${extra ? " " + extra : ""}`,
  criteria: {
    true: `They asked for ${thing} (or the room so far has one) and have not removed it since.`,
    false: `Never mentioned, or it was mentioned and then removed, cancelled or taken back.`,
  },
});

const PAINTS = {
  persimmon: "orange, persimmon, tangerine, burnt orange, rust",
  brick: "red, brick, crimson, terracotta",
  mustard: "yellow, mustard, gold, ochre",
  avocado: "green, avocado, olive, sage, lime",
  teal: "teal, blue, turquoise, aqua, navy",
  plum: "purple, plum, violet, aubergine, lilac, pink, magenta",
  cream: "cream, white, off-white, beige, plaster, ivory",
  brown: "brown, chocolate, umber, wood panelling, black, dark",
} as const;

export const JEV_QUESTIONS = {
  wall: {
    type: "choice",
    instructions:
      "What colour are the WALLS of the room, going by the latest thing said about the walls or the room's paint? Ignore colours given to furniture, stripes or other things.",
    criteria: { unsaid: "No wall colour has been asked for", ...PAINTS },
  },
  graphic: {
    type: "choice",
    instructions:
      "Which big painted graphic is on the wall, going by the latest thing said about it? If it was removed, answer none.",
    criteria: {
      none: "No wall graphic, stripe or mural was asked for, or it was removed",
      stripes: "Racing stripes or bands running along the wall, a supergraphic stripe",
      rainbow: "A rainbow, arcs or arches",
      sunburst: "A sun, sunburst or rays",
      waves: "Waves, wavy or squiggly lines, swirls",
      circles: "Big circles, dots, bubbles or rings",
    },
  },
  floor: {
    type: "choice",
    instructions: "What is the FLOOR made of, going by the latest thing said about the floor itself (not a rug)?",
    criteria: {
      unsaid: "Nothing said about the floor itself",
      wood: "Wood, parquet, floorboards",
      shag: "Wall-to-wall carpet, shag carpet",
      checker: "Tiles, checkerboard, lino, chequered",
      cork: "Cork, concrete, stone or plain",
    },
  },
  time: {
    type: "choice",
    instructions: "What time of day is it outside the window, going by the latest thing said about it?",
    criteria: {
      unsaid: "No time of day has been mentioned",
      morning: "Morning, dawn, sunrise, early",
      day: "Daytime, noon, afternoon, sunny and bright",
      sunset: "Sunset, dusk, golden hour, evening",
      night: "Night, midnight, late, dark outside, moon and stars",
    },
  },
  weather: {
    type: "choice",
    instructions: "What is the weather outside the window, going by the latest thing said about it?",
    criteria: {
      clear: "No weather mentioned, or clear, dry, fine",
      rain: "Rain, storm, drizzle, pouring",
      snow: "Snow, blizzard, snowing",
    },
  },
  lights: {
    type: "score",
    instructions:
      "How brightly lit is the room itself, going by the latest thing said about the lighting or lights? If lighting was never mentioned, choose normal.",
    criteria: [
      "Lights off, pitch dark",
      "Dim, low, moody, cosy lighting",
      "Normal lighting, or lighting not mentioned",
      "Bright",
      "Blazing, every light on, as bright as possible",
    ],
  },
  mood: {
    type: "score",
    instructions:
      "What is the mood or energy of the room right now, going by the latest thing said about the mood, vibe, party or music? If nothing was said about it, choose easygoing.",
    criteria: [
      "Silent, sleepy, completely still",
      "Calm, mellow, chilled, relaxed",
      "Easygoing, or mood not mentioned",
      "Groovy, funky, upbeat, a bit of a dance",
      "Full party, disco, wild, turned all the way up",
    ],
  },
  music: has("music playing", "Music counts if they asked for music, a song, a record playing, a tune or a groove. It stops if they said to stop, mute or turn the music off."),
  sofa: has("a sofa or couch"),
  sofaColor: {
    type: "choice",
    instructions: "What colour is the sofa or couch, going by the latest thing said about it? Ignore wall colours.",
    criteria: { unsaid: "No sofa colour has been asked for, or there is no sofa", ...PAINTS },
  },
  chair: has("an armchair, egg chair, beanbag or other chair"),
  lamp: has("a lamp or floor lamp", "A lava lamp does not count as a lamp."),
  plant: has("a plant, fern, palm, cactus or other houseplant"),
  records: has("a record player, turntable, hi-fi or stereo"),
  lava: has("a lava lamp"),
  disco: has("a disco ball or mirror ball"),
  cat: has("a cat or kitten"),
  dog: has("a dog or puppy"),
  rug: has("a rug"),
  art: has("a painting, poster, picture or other art on the wall"),
  tv: has("a television"),
  fire: has("a fireplace or a fire burning"),
} satisfies Record<string, Experimental_DecisionQuestion>;
