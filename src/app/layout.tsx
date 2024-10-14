import type { Metadata } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import HoverSVG from "./components/layout/HoverSVG";
import "./globals.css";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "shebetalking",
    description: "Translation by shebecoding",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <header className="bg-teal-300 text-teal-600">
                    <nav className="container mx-auto px-4 py-1 md:py-2 flex justify-between items-center">
                        <ul className="flex space-x-2 md:space-x-4 items-center">
                            <li className="group">
                                <Link href="/" className="text-2xl font-gruppo">
                                    s
                                    <span className="font-bold text-indigo-700 group-hover:text-fuchsia-600 ">
                                        hebe
                                    </span>
                                    talking
                                </Link>
                            </li>
                        </ul>
                        <ul className="flex md:space-x-4 space-x-2 items-center">
                            <li>
                                <a
                                    href="https://github.com/hebehh/translate"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-reds-bright"
                                >
                                    <HoverSVG
                                        alt="Github handle"
                                        src="/layout/github.svg"
                                        width={24}
                                        height={24}
                                        color="#4c1d95" // Normal color
                                        hoverColor="#ea00eb" // Hover color
                                    />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://x.com/hebehilhorst"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-reds-bright"
                                >
                                    <HoverSVG
                                        alt="Twitter handle"
                                        src="/layout/twitter.svg"
                                        width={24}
                                        height={24}
                                        color="#4c1d95" // Normal color
                                        hoverColor="#ea00eb" // Hover color
                                    />
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://www.linkedin.com/in/hebehilhorst/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-reds-bright"
                                >
                                    <HoverSVG
                                        alt="LinkedIn handle"
                                        src="/layout/linkedin.svg"
                                        width={24}
                                        height={24}
                                        color="#4c1d95" // Normal color
                                        hoverColor="#ea00eb" // Hover color
                                    />
                                </a>
                            </li>
                        </ul>
                    </nav>
                </header>
                {children}
            </body>
        </html>
    );
}
