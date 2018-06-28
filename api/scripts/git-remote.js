const os = require('os')
const child_process = require('child_process')
const parseGithubUrl = require('parse-github-url')

module.exports.gitUrl = (options) => {
  const opts = options || {}
  let remoteStdOut
  try {
    remoteStdOut = child_process.execSync('git remote -v', opts)
  } catch (e) {
    throw new Error('No get remote found', e)
  }

  if (!remoteStdOut) {
    throw new Error('No get remote found')
  }

  const remotes = remoteStdOut.toString().split(os.EOL)
    .filter(function filterOnlyFetchRows(remote) {
      return remote.match('(fetch)')
    })
    .map(function mapRemoteLineToObject(remote) {
      var parts = remote.split('\t')
      if (parts.length < 2) return

      return {
        name: parts[0],
        url: parts[1].replace('(fetch)', '').trim()
      }
    })

  const origin = remotes.filter((remote) => {
    return remote.name === 'origin'
  })

  const originUrl = origin.reduce((acc, curr) => {
     return curr.url
  }, '')

  const parsed = parseGithubUrl(originUrl)

  // console.log('parsed', parsed)

  return makeGithubURL(parsed.repo)
}

function makeGithubURL(ownerRepo) {
  return `https://github.com/${ownerRepo}`
}
