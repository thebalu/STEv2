const low      = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./src/resources/db.json')
const db = low(adapter)

//console.log(db.get('tips').value())

export const newUser = (userId, userName) => {
  const user = {
    userId,
    userName,
    seen: []
  }
  db.get('users')
  .push(user)
  .write()
}

export const getUser