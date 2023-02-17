import { Overview } from "components/overview"
import { GetStaticProps } from "next"
import { processedData } from "processedData"

export const getStaticProps: GetStaticProps = async () => {
  return {
    props: { wallpapers: processedData.reverse() }, // will be passed to the page component as props
  }
}

export default Overview
