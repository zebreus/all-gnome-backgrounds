describe("some examples work", () => {
  test("one is one", async () => {
    expect(1).toEqual(1)
  })

  test("two is two", async () => {
    expect(2).toEqual(2)
  })

  test("throw throws", async () => {
    expect(() => {
      throw new Error("eyyy")
    }).toThrow()
  })
})

// eslint-disable-next-line jest/no-export
export {}
