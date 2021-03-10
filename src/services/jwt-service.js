const jwt = require('jsonwebtoken')
const s = 'XaA6JrXR1G0'
const a = 'HS256'

export default class JWTService {
  constructor() { }

  async signToken(signature, expires) {
    return new Promise((resolve, reject) => {
      
      const token = jwt.sign({
        exp: expires,
        data: signature,
        algorithm: a,
      }, s)

      if(token) {
        resolve(token)
      } else (
        reject()
      )

    })
  }

  async verifyToken(token) {
    return new Promise((resolve, reject) => {

      jwt.verify(token, s, (err, decoded) => {
        if (err) {
          reject(err)
        } else {
          resolve(decoded)
        }
      }) 

    })
  }

}
