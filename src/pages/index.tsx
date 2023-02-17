import { Overview } from "components/overview"
import { GetStaticProps } from "next"
import { processedData } from "processedData"

export const getStaticProps: GetStaticProps = async () => {
  const allWallpapers = processedData.map(item => {
    const latestSnapshot = item.snapshots[item.snapshots.length - 1]
    if (!latestSnapshot) throw new Error("No latest snapshot")
    return { url: latestSnapshot.url, name: latestSnapshot.name }
  })
  return {
    props: { backgrounds: allWallpapers }, // will be passed to the page component as props
  }
}

export default Overview
