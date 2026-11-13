export const objects = [
  {
    id: "mug",
    name: "Coffee mug",
    label: "Coffee mug",
    x: 67,
    y: 27,
    w: 14,
    h: 22,
    tone: "violet",
  },
  {
    id: "headphones",
    name: "Headphones",
    label: "Headphones",
    x: 51,
    y: 3,
    w: 24,
    h: 30,
    tone: "lime",
  },
  {
    id: "cable",
    name: "Charging cables",
    label: "Mystery cable",
    x: 36,
    y: 5,
    w: 19,
    h: 42,
    tone: "orange",
  },
  {
    id: "notebook",
    name: "Notebook",
    label: "Suspect #04",
    x: 80,
    y: 45,
    w: 19,
    h: 40,
    tone: "orange",
  },
  {
    id: "keyboard",
    name: "Keyboard",
    label: "Keyboard",
    x: 27,
    y: 45,
    w: 36,
    h: 26,
    tone: "violet",
  },
  { id: "plant", name: "Plant", label: "Plant", x: 77, y: 1, w: 13, h: 22, tone: "lime" },
  { id: "phone", name: "Phone", label: "Phone", x: 67, y: 53, w: 14, h: 30, tone: "violet" },
  { id: "keys", name: "Keys", label: "Keys", x: 22, y: 73, w: 12, h: 14, tone: "orange" },
  { id: "bottle", name: "Bottle", label: "Bottle", x: 87, y: 12, w: 12, h: 31, tone: "lime" },
  { id: "laptop", name: "Laptop", label: "Laptop", x: 1, y: 1, w: 40, h: 57, tone: "violet" },
];
export const challenges = [
  { text: "Find something you can drink from.", answers: ["mug", "bottle"] },
  { text: "Find something RED.", answers: ["notebook"] },
  { text: "Find something you can listen with.", answers: ["headphones"] },
];
export function isCorrectAnswer(round: number, id: string) {
  return challenges[round]?.answers.includes(id) ?? false;
}
export const roasts = [
  "Your cables are forming a government. That mug has survived three economic crises. Your desk is one missing spoon away from total collapse.",
  "Your cables have formed a government and your desk is clearly under investigation.",
  "That plant is the only thing here with its life together. Your headphones are avoiding eye contact. The notebook is collecting evidence.",
  "Your desk has more plot twists than a television drama. That mug has seen things. And the keyboard would like to speak to a manager.",
];
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} — OBJECT CHAOS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} — OBJECT CHAOS` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
