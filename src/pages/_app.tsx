import type { AppProps } from "next/app"
import Head from "next/head"
// eslint-disable-next-line import/no-unassigned-import
import "../styles/reset.css"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        body {
          background-color: #1e1e1e;
          color: #fff;
          font-family: Cantarell, "Droid Sans", Ubuntu, "DejaVu Sans", Arial, sans-serif !important;
        }
      `}</style>
      <Head>
        <title>Gnome Backgrounds History</title>
      </Head>
      <Component {...pageProps} />
    </>
  )
}
