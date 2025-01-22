import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { wrapper } from "axios-cookiejar-support";
import express, { Request, Response } from "express";
import { CookieJar } from "tough-cookie";
const axiosCookieJarSupport = require("axios-cookiejar-support").default;
const tough = require("tough-cookie");

const LCRouter = express.Router();

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

export interface QuestionData {
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  content: string;
  codeSnippets: Array<{
    code: string;
    lang: string;
    langSlug: string;
  }>;
}

async function fetchQuestionData(slug: string): Promise<QuestionData | null> {
  const query = `
        query getQuestionDetail($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
                frontendQuestionId: questionFrontendId
                title
                titleSlug
                codeSnippets {
                    code
                    lang
                    langSlug
                }
                content
                difficulty

            }
        }
    `;

  const variables = { titleSlug: slug };

  try {
    const options = {
      method: "POST",
      hostname: "leetcode.com",
      path: "/graphql/",
      headers: {
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
      },
      maxRedirects: 20,
    };

    const response = await fetch(LEETCODE_GRAPHQL_URL, {
      method: options.method,
      headers: options.headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });
    // console.log(response);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    const question = data.data.question;
    if (question) {
      return {
        frontendQuestionId: question.frontendQuestionId,
        title: question.title,
        content: question.content,
        difficulty: question.difficulty,
        titleSlug: question.titleSlug,
        codeSnippets: question.codeSnippets,
        // Map other fields as needed
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching question data:", error);
    return null;
  }
}

LCRouter.post("/question", async (req: Request, res: Response) => {
  if (!req.body || !req.body.slug) {
    res.json({ success: false });
    return;
  }
  console.log(req.body.slug);
  const questionData = await fetchQuestionData(req.body.slug);
  if (!questionData) {
    res.json({ success: false });
    return;
  }
  res.json({ success: true, question: questionData });
});

// --------------------------------------------------------------------------
// SCRIPTING BELOW THIS POINT

interface RequestOptions extends AxiosRequestConfig {
  headers?: Record<string, string>;
  data?: any;
}

interface RequestResult {
  response: AxiosResponse;
  csrfToken: string | null;
  cookies: any[];
  cookieJar: CookieJar;
}

interface LoginResponse {
  success: boolean;
  authenticated?: boolean;
  cookies?: string[];
  error?: string;
}

interface CSRFResponse {
  success: boolean;
  csrfToken?: string | null;
  cookies?: string[];
  error?: string;
}
const cookieJar = new CookieJar();
const client = wrapper(axios.create({ jar: cookieJar, withCredentials: true }));
// axiosCookieJarSupport(client);

async function makeRequest(
  url: string,
  options: RequestOptions = {}
): Promise<RequestResult> {
  try {
    const defaultHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      DNT: "1",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    };

    const response = await client({
      url,
      method: options.method || "GET",
      headers: { ...defaultHeaders, ...options.headers },
      maxRedirects: 5,
      validateStatus: (status: number) => status >= 200 && status < 303,
      data: options.data,
    });

    const csrfToken =
      (response.headers["x-csrf-token"] as string) ||
      (response.headers["csrf-token"] as string) ||
      (response.headers["x-xsrf-token"] as string) ||
      null;

    const cookies = await cookieJar.getCookies(url);

    return {
      response,
      csrfToken,
      cookies,
      cookieJar,
    };
  } catch (error) {
    console.error("Request failed:", (error as Error).message);
    if (axios.isAxiosError(error) && error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
}

async function loginFlow(baseUrl: string): Promise<RequestResult> {
  try {
    const initialRequest = await makeRequest(`${baseUrl}/login`);
    console.log("Initial Cookies:", initialRequest.cookies);
    console.log("CSRF Token:", initialRequest.csrfToken);

    const loginResponse = await makeRequest(`${baseUrl}/login`, {
      method: "POST",
      headers: {
        "X-CSRF-Token": initialRequest.csrfToken || "",
        "Content-Type": "application/json",
      },
      data: {
        username: "user",
        password: "pass",
      },
    });

    return loginResponse;
  } catch (error) {
    console.error("Login flow failed:", error);
    throw error;
  }
}

// Router endpoints with type-safe request and response handling
LCRouter.get(
  "/fetch-csrf",
  async (_req: Request, res: Response<CSRFResponse>) => {
    try {
      const result = await makeRequest("https://leetcode.com/");
      res.json({
        success: true,
        csrfToken: result.csrfToken,
        cookies: result.cookies.map((cookie) => cookie.toString()),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }
);

LCRouter.post("/login", async (_req: Request, res: Response<LoginResponse>) => {
  try {
    const result = await loginFlow("https://leetcode.com/accounts/login");
    res.json({
      success: true,
      authenticated: result.response.status === 200,
      cookies: result.cookies.map((cookie) => cookie.toString()),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

export default LCRouter;
