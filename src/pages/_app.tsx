import { css } from "@emotion/react"
import type { AppProps } from "next/app"
import Head from "next/head"
import Link from "next/link"
// eslint-disable-next-line import/no-unassigned-import
import "../styles/reset.css"
// eslint-disable-next-line import/no-unassigned-import
import "../styles/global.css"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Gnome Backgrounds History</title>
      </Head>
      <header>
        <Link href="/" passHref>
          <a>
            <h1
              css={css`
                font-size: 0.9rem;
                font-weight: 550;
                padding-top: 1rem;
                text-align: center;
              `}
            >
              All GNOME backgrounds
            </h1>
          </a>
        </Link>
      </header>
      <Component {...pageProps} />
      <footer
        css={css`
          font-size: 0.9rem;
          font-weight: 550;
          text-align: center;
          display: flex;
          gap: 1rem;
          justify-content: center;
          text-decoration: underline;
        `}
      >
        <a
          css={css`
            font-size: 0.9rem;
            font-weight: 550;
          `}
          href="https://gitlab.gnome.org/GNOME/gnome-backgrounds"
        >
          Wallpapers from gnome-backgrounds
        </a>
        <a
          css={css`
            font-size: 0.9rem;
            font-weight: 550;
          `}
          href="https://github.com/zebreus/all-gnome-backgrounds"
        >
          Star this website on Github
        </a>
      </footer>
    </>
  )
}
