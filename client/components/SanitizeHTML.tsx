import sanitizeHtml from "sanitize-html";

const defaultOptions = {
//   allowedTags: ["b", "i", "em", "strong", "a", "pre", "code", "sup"],
  allowedAttributes: {
    a: ["href"],
  },
  allowedIframeHostnames: ["www.youtube.com"],
};

const sanitize = (
  dirty: string,
  options: sanitizeHtml.IOptions | undefined
) => ({
  __html: sanitizeHtml(dirty, { ...defaultOptions, ...options }),
});

interface SanitizeHTMLProps {
  html: string;
  options?: sanitizeHtml.IOptions;
}

export const SanitizeHTML = ({ html, options }: SanitizeHTMLProps) => (
  <div dangerouslySetInnerHTML={sanitize(html, options)} />
);
