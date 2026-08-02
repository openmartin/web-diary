import dayjs, { type Dayjs } from 'dayjs';

export interface FrontMatter {
  title: string;
  date: string;
  draft: boolean;
}

export interface DiaryEntry {
  frontMatter: FrontMatter;
  content: string;
}

export function generateFrontMatter(title: string, date: Dayjs | string, draft: boolean = false): string {
  const d = typeof date === 'string' ? dayjs(date) : date;
  return `---
title: "${title}"
date: ${d.format('YYYY-MM-DDTHH:mm:ssZ')}
draft: ${draft}
---
`;
}

export function parseFrontMatter(markdown: string): DiaryEntry {
  const lines = markdown.split('\n');
  
  if (lines[0] !== '---') {
    return {
      frontMatter: {
        title: '',
        date: new Date().toISOString(),
        draft: false,
      },
      content: markdown,
    };
  }

  let endIndex = lines.indexOf('---', 1);
  if (endIndex === -1) {
    endIndex = 0;
  }

  const frontMatterLines = lines.slice(1, endIndex);
  const frontMatterObj: any = {};

  frontMatterLines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    const value = valueParts.join(':').trim();
    
    if (key === 'title') {
      frontMatterObj.title = value.replace(/^["']|["']$/g, '');
    } else if (key === 'date') {
      frontMatterObj.date = value;
    } else if (key === 'draft') {
      frontMatterObj.draft = value === 'true';
    }
  });

  const content = lines.slice(endIndex + 1).join('\n').trim();

  return {
    frontMatter: {
      title: frontMatterObj.title || '',
      date: frontMatterObj.date || new Date().toISOString(),
      draft: frontMatterObj.draft || false,
    },
    content,
  };
}

export function generateMarkdown(entry: DiaryEntry): string {
  return generateFrontMatter(entry.frontMatter.title, entry.frontMatter.date, entry.frontMatter.draft) + '\n' + entry.content;
}
