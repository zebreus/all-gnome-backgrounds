import { History } from "components/history"
import { GetStaticPaths, GetStaticProps } from "next"
import { processedData } from "processedData"

export const getStaticProps: GetStaticProps = async context => {
  const id = context.params?.["id"]
  if (!id) throw new Error("No id")
  const wallpapers = processedData.filter(wallpaper => wallpaper.snapshots.find(snapshot => snapshot.hash === id))
  // Ignore for now, because I don't know how to handle this case. I probably need better IDs, but they should also be permanent.
  // if (wallpapers.length > 1) throw new Error("Id found in multiple wallpapers. This should not happen I think.")
  if (wallpapers.length < 1) throw new Error("Id not found in any wallpaper.")
  const wallpaper = wallpapers[0]
  if (!wallpaper) throw new Error("No wallpaper found")
  return {
    props: { wallpaper: wallpaper }, // will be passed to the page component as props
  }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const ids = processedData.flatMap(wallpaper => wallpaper.snapshots.map(snapshot => snapshot.hash))

  return {
    paths: ids.map(id => ({ params: { id: id } })),
    fallback: false, // can also be true or 'blocking'
  }
}

export default History
