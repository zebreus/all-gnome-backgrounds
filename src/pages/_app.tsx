import type { AppProps } from "next/app"

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <style jsx global>{`
        body {
          background-color: #1e1e1e;
          color: #fff;
          font-family: Cantarell, "Droid Sans", Ubuntu, "DejaVu Sans", Arial, sans-serif;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
