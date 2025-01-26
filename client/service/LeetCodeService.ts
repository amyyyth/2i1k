
const backendUri = process.env.NEXT_PUBLIC_BACKEND_URI

export interface QuestionData {
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  content: string;
  codeSnippets: Array<{
    code: string,
    lang: string,
    langSlug: string
  }>
}

async function getQuestionSlugFromUrl(url: string): Promise<string | null> {
  const regex = /leetcode\.com\/problems\/([\w-]+)(\/|$)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export async function getLeetCodeQuestion(
  url: string
): Promise<{ success: boolean; question?: QuestionData; error?: string } | null> {
  const slug = await getQuestionSlugFromUrl(url);
  if (!slug) {
    return {
      success: false,
      error: "Invalid Url",
    };
  }
  console.log(slug, "slug")
  const response = await fetch(`${backendUri}/leetcode/question`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ slug: slug }),
  });

  if (!response.ok) {
    console.error("Failed to fetch question data");
    return {
      success: false,
      error: "Fetch failed",
    };
  }

  const data = await response.json();
  console.log(data);
  return data;
}
