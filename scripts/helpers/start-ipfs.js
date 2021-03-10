const IPFS = require('ipfs')
const HttpIPFS = require('ipfs/src/http')

const startIpfs = () =>
  new Promise(async (resolve) => {
    const node = await IPFS.create({
      EXPERIMENTAL: {
        pubsub: true
      },
      config: {
        Addresses: {
          Swarm: [
            '/ip4/0.0.0.0/tcp/4001',
            '/ip4/127.0.0.1/tcp/4002/ws',
            '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
          ]
        }
      }
    })
    const httpAPI = new HttpIPFS(node, {
      config: {
        Addresses: {
          API: '/ip4/127.0.0.1/tcp/5002',
          Gateway: '/ip4/127.0.0.1/tcp/8080'
        }
      }
    })
    resolve(httpAPI.start())
  })

module.exports = startIpfs
