import React from "react";

const links = [
  {
    href: "https://github.com/yourusername",
    label: "GitHub",
    emoji: "💻",
    aria: "GitHub",
  },
  {
    href: "mailto:your@email.com",
    label: "Email",
    emoji: "📧",
    aria: "Mail",
  },
  {
    href: "https://twitter.com/yourusername",
    label: "Twitter",
    emoji: "🌐",
    aria: "Twitter",
  },
  {
    href: "https://linkedin.com/in/yourusername",
    label: "LinkedIn",
    emoji: "🔗",
    aria: "LinkedIn",
  },
];

export default function Footer() {
  return (
    <footer className="w-full text-center py-4 bg-gray-900 text-gray-300 mt-8">
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-1 justify-center">
          Built with{" "}
          <span role="img" aria-label="lightbulb">
            💡
          </span>{" "}
          inspiration with <span className="font-semibold">Love</span>
        </span>
        <div className="flex gap-4 justify-center text-xl mt-1">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                link.href.startsWith("mailto:")
                  ? undefined
                  : "noopener noreferrer"
              }
              title={link.label}
            >
              <span role="img" aria-label={link.aria}>
                {link.emoji}
              </span>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
