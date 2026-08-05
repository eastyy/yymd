/**
 * Emoji 短代码转换(Typora 式):输入 :smile: 这类代码自动替换为 😄。
 * 数据表 + 纯函数映射可单测;插件用输入规则实现。
 */
import { $inputRule } from "@milkdown/utils";
import { InputRule } from "@milkdown/prose/inputrules";

/** 常用 emoji 短代码表 */
export const EMOJI_MAP: Record<string, string> = {
  smile: "😄", laugh: "😆", blush: "😊", smiley: "😃", wink: "😉",
  heart_eyes: "😍", kissing_heart: "😘", thinking: "🤔", neutral_face: "😐",
  expressionless: "😑", unamused: "😒", sweat: "😓", pensive: "😔",
  confused: "😕", relieved: "😌", tongue: "😛", astonished: "😲",
  disappointed: "😞", worried: "😟", cry: "😢", sob: "😭",
  joy: "😂", persevere: "😣", scream: "😱",
  angry: "😠", rage: "😡", sleeping: "😴", dizzy_face: "😵",
  mask: "😷", sunglasses: "😎", nerd: "🤓", ghost: "👻", alien: "👽",
  robot: "🤖", poop: "💩", heart: "❤️", broken_heart: "💔",
  sparkles: "✨", star: "⭐", star2: "🌟", zap: "⚡", fire: "🔥",
  rainbow: "🌈", sun: "☀️", cloud: "☁️", snowflake: "❄️", umbrella: "☔",
  coffee: "☕", beer: "🍺", wine: "🍷", pizza: "🍕", hamburger: "🍔",
  fries: "🍟", apple: "🍎", cake: "🍰", rocket: "🚀", airplane: "✈️",
  car: "🚗", bike: "🚲", check: "✅", x: "❌", warning: "⚠️",
  question: "❓", exclamation: "❗", bulb: "💡", gift: "🎁", tada: "🎉",
  trophy: "🏆", medal: "🏅", crown: "👑", gem: "💎", moneybag: "💰",
  book: "📖", books: "📚", pencil: "✏️", memo: "📝", computer: "💻",
  phone: "📱", camera: "📷", video: "📹", tv: "📺", music: "🎵",
  notes: "🎶", microphone: "🎤", headphones: "🎧", gamepad: "🎮", dice: "🎲",
  soccer: "⚽", basketball: "🏀", tennis: "🎾", golf: "⛳",
  dog: "🐶", cat: "🐱", mouse: "🐭", rabbit: "🐰", bear: "🐻",
  panda: "🐼", penguin: "🐧", bird: "🐦", fish: "🐟", whale: "🐳",
  bug: "🐛", bee: "🐝", snake: "🐍", turtle: "🐢", octopus: "🐙",
  thumbsup: "👍", "+1": "👍", thumbsdown: "👎", "-1": "👎", ok_hand: "👌",
  wave: "👋", clap: "👏", pray: "🙏", muscle: "💪", eyes: "👀",
  hundred: "💯", boom: "💥", droplet: "💧", zzz: "💤",
};

/** 查找短代码对应的 emoji(未知返回 undefined) */
export function emojiFor(code: string): string | undefined {
  return EMOJI_MAP[code.toLowerCase()];
}

/** 输入规则:键入 :name: 的收尾冒号时替换为 emoji */
export const emojiPlugin = $inputRule(() =>
  new InputRule(/:([a-zA-Z0-9_+-]+):$/, (state, match, start, end) => {
    const emoji = emojiFor(match[1]);
    if (!emoji) return null;
    return state.tr.replaceWith(start, end, state.schema.text(emoji));
  }),
);
