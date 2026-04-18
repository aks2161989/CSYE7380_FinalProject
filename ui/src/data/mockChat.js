export const sampleQuestions = [
  "What is Buffett's view on return on equity?",
  "How does Buffett approach risk management?",
  "Why does Buffett still live in Omaha?",
  "What happened with Berkshire's textile operations?",
  "What is Buffett's investment philosophy?",
  "How did Buffett overcome his fear of public speaking?",
];

export const mockResponses = {
  default: {
    answer:
      "Warren Buffett emphasizes the importance of investing in businesses with strong fundamentals and sustainable competitive advantages, often referred to as 'economic moats.' He advocates for a long-term buy-and-hold strategy, focusing on companies with consistent earnings growth, high return on equity, and capable management teams.",
    sources: [
      {
        content:
          "In his 1987 letter to shareholders, Buffett wrote: 'We look for companies that have demonstrated consistent earning power, good return on equity while employing little or no debt, management in place, simple businesses, and an offering price.' This philosophy has guided Berkshire's investments for decades.",
        source: "shareholder_letter",
        page: 142,
      },
      {
        content:
          "Question: What is Buffett's core investment philosophy?\nAnswer: Buffett follows a value investing philosophy inspired by Benjamin Graham but evolved to include quality. He looks for wonderful companies at fair prices rather than fair companies at wonderful prices.",
        source: "qa_strategy_development",
        page: null,
      },
      {
        content:
          "Question: How does Buffett evaluate businesses?\nAnswer: Buffett evaluates businesses based on their intrinsic value, considering factors like earnings predictability, return on invested capital, management integrity, and the strength of competitive advantages.",
        source: "qa_strategy_development",
        page: null,
      },
    ],
  },
};
