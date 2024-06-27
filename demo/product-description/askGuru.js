import { sprintf } from "sprintf-js";

export const askGuru = (prompt) => (openai) => (arg) =>
  openai.chat.completions
    .create({
      messages: [{ role: "system", content: sprintf(prompt, arg) }],
      max_tokens: 100,
      model: "gpt-3.5-turbo",
    })
    .then((res) => res.choices[0].message.content);

export const getDescription = askGuru(
  'Provide a humorous description of three sentences for the following item: "%s"',
);

export const getPrice = askGuru(
  'Tell me a typical consumer price in USD for one item of the following kind: "%s". Just name one figure, no other text is needed, and do not include a currency symbol.',
);
