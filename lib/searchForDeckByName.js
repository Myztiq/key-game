export default async (name) => {
  const nameWords = name.split(' ')
  return await doSearch(nameWords)
}

async function doSearch (terms, strategy = 'shift') {
  if (terms.length === 0) {
    return null
  }

  let url = buildSearchUrl(...terms)

  console.log(`Searching for deck with terms ${terms}. ${url}`)

  const response = await fetch(url, {method: 'get'})
  let body = await response.json()

  console.log(`found ${body.count} results.`)

  if (body.count === 1 ) {
    console.log(body.data[0])
    return body.data[0]
  } else {
    if (strategy === 'shift') {
      terms.shift()
      return await doSearch(terms, 'pop')
    } else {
      terms.pop()
      return await doSearch(terms, 'shift')
    }
  }
}

const buildSearchUrl = (...terms) => `https://www.keyforgegame.com/api/decks/?page=1&page_size=5&search=${terms.join('+')}`