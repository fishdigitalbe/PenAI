import { GenerationParams, GenerationResult } from '../types';

export async function generateEbookContent(params: GenerationParams): Promise<GenerationResult> {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const chapters = generateChapters(params);
  const content = chapters.map(ch => `${ch.title}\n\n${ch.content}`).join('\n\n');

  return {
    title: `${params.subject}: A Comprehensive Guide`,
    content,
    chapters,
    wordCount: countWords(content),
    generatedAt: new Date().toISOString(),
  };
}

function generateChapters(params: GenerationParams) {
  const targetChapters = Math.max(5, Math.floor(params.wordCount / 1000));
  const wordsPerChapter = Math.floor(params.wordCount / targetChapters);

  const chapterTemplates = [
    {
      title: 'Introduction',
      content: generateIntroduction(params, wordsPerChapter)
    },
    {
      title: 'Understanding the Fundamentals',
      content: generateContent(params, wordsPerChapter, 'fundamentals')
    },
    {
      title: 'Key Strategies and Approaches',
      content: generateContent(params, wordsPerChapter, 'strategies')
    },
    {
      title: 'Practical Implementation',
      content: generateContent(params, wordsPerChapter, 'implementation')
    },
    {
      title: 'Common Challenges and Solutions',
      content: generateContent(params, wordsPerChapter, 'challenges')
    },
    {
      title: 'Advanced Techniques',
      content: generateContent(params, wordsPerChapter, 'advanced')
    },
    {
      title: 'Case Studies and Examples',
      content: generateContent(params, wordsPerChapter, 'examples')
    },
    {
      title: 'Best Practices',
      content: generateContent(params, wordsPerChapter, 'practices')
    },
    {
      title: 'Future Trends and Opportunities',
      content: generateContent(params, wordsPerChapter, 'future')
    },
    {
      title: 'Conclusion and Next Steps',
      content: generateConclusion(params, wordsPerChapter)
    }
  ];

  return chapterTemplates.slice(0, targetChapters);
}

function generateIntroduction(params: GenerationParams, wordTarget: number): string {
  const toneModifier = getToneModifier(params.toneOfVoice);

  let content = `${toneModifier.opening} In this comprehensive guide, we'll explore ${params.subject} specifically designed for ${params.targetAudience}.\n\n`;
  content += `Understanding ${params.subject} is crucial in today's rapidly evolving landscape. `;
  content += `This ebook will provide you with actionable insights, proven strategies, and practical knowledge that you can implement immediately.\n\n`;
  content += `Throughout this guide, you'll discover:\n\n`;
  content += `• Core concepts and fundamental principles\n`;
  content += `• Step-by-step implementation strategies\n`;
  content += `• Real-world examples and case studies\n`;
  content += `• Expert tips and best practices\n`;
  content += `• Common pitfalls to avoid\n`;
  content += `• Future trends and opportunities\n\n`;
  content += `${toneModifier.transition} Let's dive in and unlock the potential of ${params.subject}.`;

  return padContent(content, wordTarget);
}

function generateContent(params: GenerationParams, wordTarget: number, section: string): string {
  const toneModifier = getToneModifier(params.toneOfVoice);

  let content = `${toneModifier.opening} This section focuses on the ${section} aspects of ${params.subject}, tailored specifically for ${params.targetAudience}.\n\n`;

  content += `When approaching ${params.subject}, it's essential to understand the key elements that drive success. `;
  content += `Research has consistently shown that those who master these fundamentals achieve significantly better results.\n\n`;

  content += `Key considerations include:\n\n`;
  content += `1. Strategic Planning: Developing a clear roadmap aligned with your goals and objectives.\n\n`;
  content += `2. Resource Allocation: Ensuring you have the right tools, time, and expertise to execute effectively.\n\n`;
  content += `3. Continuous Improvement: Implementing feedback loops and optimization strategies.\n\n`;
  content += `4. Measurement and Analysis: Tracking key metrics to gauge progress and identify opportunities.\n\n`;

  content += `${toneModifier.emphasis} The most successful practitioners understand that ${params.subject} requires both theoretical knowledge and practical application. `;
  content += `By combining these elements, you can create a sustainable competitive advantage.\n\n`;

  content += `Real-world application demonstrates that focusing on these core principles leads to measurable outcomes. `;
  content += `Organizations and individuals who prioritize these fundamentals consistently outperform their peers.\n\n`;

  content += `${toneModifier.transition} As we move forward, consider how these concepts apply to your specific situation and objectives.`;

  return padContent(content, wordTarget);
}

function generateConclusion(params: GenerationParams, wordTarget: number): string {
  const toneModifier = getToneModifier(params.toneOfVoice);

  let content = `${toneModifier.opening} We've covered extensive ground in exploring ${params.subject} for ${params.targetAudience}.\n\n`;
  content += `The journey to mastery requires dedication, continuous learning, and consistent application of the principles we've discussed. `;
  content += `Remember that success doesn't happen overnight—it's the result of sustained effort and strategic implementation.\n\n`;
  content += `Key takeaways to remember:\n\n`;
  content += `• Start with the fundamentals and build a strong foundation\n`;
  content += `• Apply proven strategies systematically\n`;
  content += `• Learn from both successes and failures\n`;
  content += `• Stay updated with industry trends and best practices\n`;
  content += `• Continuously measure and optimize your approach\n\n`;
  content += `${toneModifier.emphasis} The knowledge you've gained through this guide provides a solid framework for success. `;
  content += `Now it's time to take action and apply these insights to your specific context.\n\n`;
  content += `Your next steps should include:\n\n`;
  content += `1. Review the key concepts and identify priority areas\n`;
  content += `2. Create an action plan with specific milestones\n`;
  content += `3. Implement strategies incrementally\n`;
  content += `4. Monitor results and adjust as needed\n`;
  content += `5. Share your learning and insights with others\n\n`;
  content += `${toneModifier.closing} Thank you for investing your time in this comprehensive guide. Here's to your success with ${params.subject}!`;

  return padContent(content, wordTarget);
}

function getToneModifier(tone: string) {
  const modifiers: Record<string, any> = {
    professional: {
      opening: 'In the following section,',
      transition: 'Moving forward,',
      emphasis: 'It is important to note that',
      closing: 'In conclusion,'
    },
    casual: {
      opening: 'Hey there!',
      transition: 'Alright, so',
      emphasis: 'Here\'s the thing:',
      closing: 'That\'s a wrap!'
    },
    authoritative: {
      opening: 'As industry experts confirm,',
      transition: 'Evidence demonstrates that',
      emphasis: 'Critical analysis reveals that',
      closing: 'To summarize the key findings,'
    },
    friendly: {
      opening: 'Welcome!',
      transition: 'Let\'s continue by',
      emphasis: 'I want to share something important:',
      closing: 'Thanks so much for reading!'
    },
    inspirational: {
      opening: 'Imagine the possibilities when',
      transition: 'Your journey to success involves',
      emphasis: 'Believe in the power of',
      closing: 'Your success story starts now!'
    },
    educational: {
      opening: 'In this learning module,',
      transition: 'Building on these concepts,',
      emphasis: 'Research indicates that',
      closing: 'Review and reflect on'
    },
    humorous: {
      opening: 'Buckle up, because',
      transition: 'Plot twist:',
      emphasis: 'No joke—',
      closing: 'And that\'s all folks!'
    }
  };

  return modifiers[tone] || modifiers.professional;
}

function padContent(content: string, targetWords: number): string {
  const currentWords = countWords(content);
  if (currentWords >= targetWords) return content;

  const additionalSentences = [
    'This approach has been validated through extensive research and practical application across various industries.',
    'Industry leaders consistently emphasize the importance of these core principles in achieving sustainable results.',
    'Understanding these concepts provides a competitive advantage in today\'s dynamic environment.',
    'Successful implementation requires careful planning, consistent execution, and ongoing optimization.',
    'The most effective practitioners combine theoretical knowledge with hands-on experience.',
    'These strategies have been proven to deliver measurable outcomes when applied systematically.',
    'Organizations that prioritize these fundamentals consistently outperform their competitors.',
    'Building expertise in this area requires dedication, practice, and continuous learning.',
    'The integration of these principles creates synergies that amplify overall effectiveness.',
    'Mastery comes through deliberate practice and thoughtful application of these concepts.'
  ];

  let paddedContent = content;
  let index = 0;

  while (countWords(paddedContent) < targetWords && index < additionalSentences.length * 3) {
    paddedContent += '\n\n' + additionalSentences[index % additionalSentences.length];
    index++;
  }

  return paddedContent;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
